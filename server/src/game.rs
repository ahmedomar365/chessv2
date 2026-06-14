//! Game lifecycle: queue pairing, countdown, real-time moves, end conditions.

use spacetimedb::rand::seq::SliceRandom;
use spacetimedb::{reducer, table, ReducerContext, ScheduleAt, Table, TimeDuration, Timestamp};

use crate::cards;
use crate::module::*;
use crate::rules;

// ---------------- tuning constants ----------------

pub const START_COUNTDOWN_MICROS: i64 = 3_000_000;
pub const FORFEIT_GRACE_MICROS: i64 = 60_000_000;

/// Spells/cards toggle. When false: no cards or gems are dealt, play_card is
/// rejected, and the Guardian passive can't trigger — pure real-time chess.
pub const CARDS_ENABLED: bool = false;

/// Cooldown per piece type (micros): pawn 3s, knight/bishop 5s, rook/king 7s, queen 10s.
pub fn cooldown_micros(ty: u8) -> i64 {
    match ty {
        0 => 3_000_000,
        1 | 2 => 5_000_000,
        3 | 5 => 7_000_000,
        _ => 10_000_000,
    }
}

// ---------------- scheduled tables ----------------

#[table(accessor = game_start_timer, scheduled(begin_game))]
pub struct GameStartTimer {
    #[primary_key]
    #[auto_inc]
    pub scheduled_id: u64,
    pub scheduled_at: ScheduleAt,
    pub game_id: u64,
}

#[table(accessor = forfeit_timer, scheduled(forfeit_check))]
pub struct ForfeitTimer {
    #[primary_key]
    #[auto_inc]
    pub scheduled_id: u64,
    pub scheduled_at: ScheduleAt,
    #[index(btree)]
    pub game_id: u64,
    #[index(btree)]
    pub account_id: u64,
}

// ---------------- helpers ----------------

/// The sender's session, required to be logged in.
pub fn logged_in(ctx: &ReducerContext) -> Result<Session, String> {
    let s = ctx.db.session().identity().find(ctx.sender()).ok_or("Not connected")?;
    if s.account_id == 0 {
        return Err("Not logged in".into());
    }
    Ok(s)
}

/// Live = countdown or in progress.
pub fn live_game_of(ctx: &ReducerContext, account_id: u64) -> Option<Game> {
    ctx.db.game().white_id().filter(account_id).find(|g| g.phase < 2)
        .or_else(|| ctx.db.game().black_id().filter(account_id).find(|g| g.phase < 2))
}

fn color_of(game: &Game, account_id: u64) -> Result<rules::Color, String> {
    if game.white_id == account_id {
        Ok(rules::Color::White)
    } else if game.black_id == account_id {
        Ok(rules::Color::Black)
    } else {
        Err("You are not a player in this game".into())
    }
}

fn set_status_for_account(ctx: &ReducerContext, account_id: u64, status: u8) {
    let rows: Vec<Session> = ctx.db.session().account_id().filter(account_id).collect();
    for mut s in rows {
        s.status = status;
        ctx.db.session().identity().update(s);
    }
}

fn account_is_online(ctx: &ReducerContext, account_id: u64) -> bool {
    ctx.db.session().account_id().filter(account_id).any(|s| s.online)
}

fn in_stasis(ctx: &ReducerContext, piece_id: u64) -> bool {
    ctx.db.piece_status().piece_id().find(piece_id)
        .map(|s| s.stasis_until > ctx.timestamp)
        .unwrap_or(false)
}

fn finish_game(ctx: &ReducerContext, game_id: u64, result: u8, reason: u8) {
    if let Some(mut g) = ctx.db.game().game_id().find(game_id) {
        if g.phase == 2 {
            return;
        }
        g.phase = 2;
        g.result = result;
        g.result_reason = reason;
        let (w, b) = (g.white_id, g.black_id);
        let rated = g.rated;
        ctx.db.game().game_id().update(g);
        if rated && result != 0 {
            apply_elo(ctx, w, b, result);
        }
        // coin rewards: win 100 (+10 × streak, cap +50), loss 25, draw 40 each
        match result {
            1 | 2 => {
                let (winner, loser) = if result == 1 { (w, b) } else { (b, w) };
                let streak = ctx.db.player_profile().account_id().find(winner).map(|p| p.streak).unwrap_or(0);
                let bonus = (streak.saturating_sub(1) as u64 * 10).min(50);
                crate::economy::award_coins(ctx, winner, 100 + bonus);
                crate::economy::award_coins(ctx, loser, 25);
            }
            3 => {
                crate::economy::award_coins(ctx, w, 40);
                crate::economy::award_coins(ctx, b, 40);
            }
            _ => {}
        }
        set_status_for_account(ctx, w, 0);
        set_status_for_account(ctx, b, 0);
        let timers: Vec<ForfeitTimer> = ctx.db.forfeit_timer().game_id().filter(game_id).collect();
        for t in timers {
            ctx.db.forfeit_timer().scheduled_id().delete(t.scheduled_id);
        }
        // prune per-game card/gem/snapshot state (move_log + effect_log stay for replays)
        let snaps: Vec<u64> = ctx.db.board_snapshot().game_id().filter(game_id).map(|s| s.id).collect();
        for id in snaps {
            ctx.db.board_snapshot().id().delete(id);
        }
        let states: Vec<u64> = ctx.db.game_card_state().game_id().filter(game_id).map(|s| s.id).collect();
        for id in states {
            ctx.db.game_card_state().id().delete(id);
        }
        let gems: Vec<u64> = ctx.db.game_gems().game_id().filter(game_id).map(|s| s.id).collect();
        for id in gems {
            ctx.db.game_gems().id().delete(id);
        }
        let statuses: Vec<u64> = ctx.db.piece_status().game_id().filter(game_id).map(|s| s.piece_id).collect();
        for id in statuses {
            ctx.db.piece_status().piece_id().delete(id);
        }
        // spectators intentionally stay: they see the result screen and
        // leave via stop_spectating (or disconnect cleanup).
    }
}

/// Apply ELO + stats to both players after a rated game. result: 1 white, 2 black, 3 draw.
fn apply_elo(ctx: &ReducerContext, white_id: u64, black_id: u64, result: u8) {
    let (Some(mut wp), Some(mut bp)) = (
        ctx.db.player_profile().account_id().find(white_id),
        ctx.db.player_profile().account_id().find(black_id),
    ) else {
        return;
    };
    let score_white = match result {
        1 => 1.0,
        2 => 0.0,
        _ => 0.5,
    };
    let (nw, nb) = crate::elo::update(wp.rating, wp.games, bp.rating, bp.games, score_white);
    wp.rating = nw;
    bp.rating = nb;
    wp.games += 1;
    bp.games += 1;
    match result {
        1 => {
            wp.wins += 1;
            wp.streak += 1;
            bp.losses += 1;
            bp.streak = 0;
        }
        2 => {
            bp.wins += 1;
            bp.streak += 1;
            wp.losses += 1;
            wp.streak = 0;
        }
        _ => {
            wp.draws += 1;
            bp.draws += 1;
            wp.streak = 0;
            bp.streak = 0;
        }
    }
    wp.peak = wp.peak.max(nw);
    bp.peak = bp.peak.max(nb);
    ctx.db.player_profile().account_id().update(wp);
    ctx.db.player_profile().account_id().update(bp);
    ctx.db.rating_history().insert(RatingHistory { id: 0, account_id: white_id, ts: ctx.timestamp, rating: nw });
    ctx.db.rating_history().insert(RatingHistory { id: 0, account_id: black_id, ts: ctx.timestamp, rating: nb });
}

/// Persist the current board (positions + has_moved) for Rewind.
fn write_snapshot(ctx: &ReducerContext, game_id: u64, seq: u32) {
    let mut board = ['.'; 64];
    let mut moved = ['.'; 64];
    for p in ctx.db.piece().game_id().filter(game_id) {
        let ch = match u8_to_ty(p.ty) {
            rules::PieceType::Pawn => 'p',
            rules::PieceType::Knight => 'n',
            rules::PieceType::Bishop => 'b',
            rules::PieceType::Rook => 'r',
            rules::PieceType::Queen => 'q',
            rules::PieceType::King => 'k',
        };
        board[p.sq as usize] = if p.color == 0 { ch.to_ascii_uppercase() } else { ch };
        if p.has_moved {
            moved[p.sq as usize] = 'm';
        }
    }
    ctx.db.board_snapshot().insert(BoardSnapshot {
        id: 0,
        game_id,
        ts: ctx.timestamp,
        seq,
        board: board.iter().collect(),
        moved: moved.iter().collect(),
    });
}

fn log_effect(ctx: &ReducerContext, game_id: u64, kind: u8, actor_color: u8, card: u8, a_sq: u8, b_sq: u8) {
    ctx.db.effect_log().insert(EffectLog {
        effect_id: 0,
        game_id,
        ts: ctx.timestamp,
        kind,
        actor_color,
        card,
        a_sq,
        b_sq,
    });
}

/// Recompute check/mate flags for both sides; auto-draw on king vs king.
fn refresh_check_flags(ctx: &ReducerContext, game_id: u64) {
    let board = board_of(ctx, game_id);
    if board.pieces.len() == 2 && board.pieces.iter().all(|p| p.ty == rules::PieceType::King) {
        finish_game(ctx, game_id, 3, 4);
        return;
    }
    if let Some(mut g) = ctx.db.game().game_id().find(game_id) {
        g.white_in_check = rules::in_check(&board, rules::Color::White);
        g.black_in_check = rules::in_check(&board, rules::Color::Black);
        g.white_mated = g.white_in_check && !rules::has_any_escape(&board, rules::Color::White);
        g.black_mated = g.black_in_check && !rules::has_any_escape(&board, rules::Color::Black);
        ctx.db.game().game_id().update(g);
    }
}

/// Start a game between two players (queue pairing AND challenge accepts).
pub fn start_game_pair(ctx: &ReducerContext, white_id: u64, white_name: &str, black_id: u64, black_name: &str) {
    // entering a game cancels outstanding challenges, queue entries, and spectating
    for id in [white_id, black_id] {
        crate::social::clear_challenges_for(ctx, id);
        crate::social::stop_spectating_inner(ctx, id);
        ctx.db.queue_entry().account_id().delete(id);
    }
    start_game(ctx, white_id, white_name, black_id, black_name);
}

fn start_game(ctx: &ReducerContext, white_id: u64, white_name: &str, black_id: u64, black_name: &str) {
    let game = ctx.db.game().insert(Game {
        game_id: 0,
        white_id,
        black_id,
        white_name: white_name.to_string(),
        black_name: black_name.to_string(),
        phase: 0,
        started_at: ctx.timestamp + TimeDuration::from_micros(START_COUNTDOWN_MICROS),
        result: 0,
        result_reason: 0,
        white_in_check: false,
        black_in_check: false,
        white_mated: false,
        black_mated: false,
        white_draw_offer: false,
        black_draw_offer: false,
        rated: true,
    });
    let ready_at = ctx.timestamp + TimeDuration::from_micros(START_COUNTDOWN_MICROS);
    for p in rules::Board::starting().pieces {
        ctx.db.piece().insert(Piece {
            piece_id: 0,
            game_id: game.game_id,
            ty: ty_to_u8(p.ty),
            color: color_to_u8(p.color),
            sq: p.sq,
            has_moved: false,
            cooldown_until: ready_at,
            shielded: false,
        });
    }
    // deal cards + anchor gems for both players (from each player's active loadout)
    if CARDS_ENABLED {
        for account_id in [white_id, black_id] {
            let mut deck = crate::economy::active_deck(ctx, account_id);
            deck.shuffle(&mut ctx.rng());
            let hand: Vec<u8> = deck.split_off(deck.len() - cards::HAND_SIZE);
            ctx.db.game_card_state().insert(GameCardState {
                id: 0,
                game_id: game.game_id,
                account_id,
                deck,
                hand,
                discard: Vec::new(),
            });
            ctx.db.game_gems().insert(GameGems {
                id: 0,
                game_id: game.game_id,
                account_id,
                base: 0,
                anchor: ready_at,
            });
        }
    }
    write_snapshot(ctx, game.game_id, 0);
    ctx.db.game_start_timer().insert(GameStartTimer {
        scheduled_id: 0,
        scheduled_at: ready_at.into(),
        game_id: game.game_id,
    });
    set_status_for_account(ctx, white_id, 1);
    set_status_for_account(ctx, black_id, 1);
}

// ---------------- reducers ----------------

#[reducer]
pub fn join_queue(ctx: &ReducerContext) -> Result<(), String> {
    let s = logged_in(ctx)?;
    if live_game_of(ctx, s.account_id).is_some() {
        return Err("Already in a game".into());
    }
    if ctx.db.queue_entry().account_id().find(s.account_id).is_some() {
        return Ok(()); // idempotent
    }
    // Pair with the nearest-rated waiting opponent.
    let my_rating = ctx.db.player_profile().account_id().find(s.account_id).map(|p| p.rating).unwrap_or(1200);
    let opponent = ctx.db.queue_entry().iter()
        .filter(|q| q.account_id != s.account_id)
        .min_by_key(|q| {
            let r = ctx.db.player_profile().account_id().find(q.account_id).map(|p| p.rating).unwrap_or(1200);
            (my_rating - r).abs()
        });
    match opponent {
        Some(op) => {
            ctx.db.queue_entry().account_id().delete(op.account_id);
            start_game_pair(ctx, op.account_id, &op.username, s.account_id, &s.username);
        }
        None => {
            ctx.db.queue_entry().insert(QueueEntry {
                account_id: s.account_id,
                username: s.username.clone(),
                queued_at: ctx.timestamp,
            });
        }
    }
    Ok(())
}

#[reducer]
pub fn leave_queue(ctx: &ReducerContext) -> Result<(), String> {
    let s = logged_in(ctx)?;
    ctx.db.queue_entry().account_id().delete(s.account_id);
    Ok(())
}

#[reducer]
pub fn begin_game(ctx: &ReducerContext, timer: GameStartTimer) -> Result<(), String> {
    if ctx.sender() != ctx.identity() {
        return Err("begin_game may only be invoked by the scheduler".into());
    }
    if let Some(mut g) = ctx.db.game().game_id().find(timer.game_id) {
        if g.phase == 0 {
            g.phase = 1;
            ctx.db.game().game_id().update(g);
        }
    }
    Ok(())
}

/// PRIVATE — anti-automation: per-player minimum spacing between accepted moves.
#[table(accessor = move_throttle)]
pub struct MoveThrottle {
    #[primary_key]
    pub account_id: u64,
    pub last_ts: Timestamp,
}

/// PRIVATE — accounts flagged for sustained superhuman input rates.
#[table(accessor = flagged_account)]
pub struct FlaggedAccount {
    #[primary_key]
    pub account_id: u64,
    pub violations: u32,
    pub last_ts: Timestamp,
}

const MIN_MOVE_SPACING_MICROS: i64 = 120_000;

#[reducer]
pub fn move_piece(ctx: &ReducerContext, game_id: u64, from_sq: u8, to_sq: u8) -> Result<(), String> {
    let s = logged_in(ctx)?;
    // anti-automation spacing (humans only — generous for real play)
    if let Some(t) = ctx.db.move_throttle().account_id().find(s.account_id) {
        if ctx.timestamp.to_micros_since_unix_epoch() - t.last_ts.to_micros_since_unix_epoch()
            < MIN_MOVE_SPACING_MICROS
        {
            let mut f = ctx.db.flagged_account().account_id().find(s.account_id).unwrap_or(FlaggedAccount {
                account_id: s.account_id,
                violations: 0,
                last_ts: ctx.timestamp,
            });
            f.violations += 1;
            f.last_ts = ctx.timestamp;
            if ctx.db.flagged_account().account_id().find(s.account_id).is_some() {
                ctx.db.flagged_account().account_id().update(f);
            } else {
                ctx.db.flagged_account().insert(f);
            }
            return Err("TOO_FAST".into());
        }
    }
    let result = execute_move(ctx, game_id, s.account_id, from_sq, to_sq);
    if result.is_ok() {
        if ctx.db.move_throttle().account_id().find(s.account_id).is_some() {
            ctx.db.move_throttle().account_id().update(MoveThrottle { account_id: s.account_id, last_ts: ctx.timestamp });
        } else {
            ctx.db.move_throttle().insert(MoveThrottle { account_id: s.account_id, last_ts: ctx.timestamp });
        }
    }
    result
}

/// Bot path — called only from the scheduler-guarded bot_tick.
pub fn bot_move(ctx: &ReducerContext, game_id: u64, account_id: u64, from_sq: u8, to_sq: u8) -> Result<(), String> {
    execute_move(ctx, game_id, account_id, from_sq, to_sq)
}

fn execute_move(ctx: &ReducerContext, game_id: u64, account_id: u64, from_sq: u8, to_sq: u8) -> Result<(), String> {
    let game = ctx.db.game().game_id().find(game_id).ok_or("No such game")?;
    if game.phase != 1 {
        return Err("Game is not live".into());
    }
    let my_color = color_of(&game, account_id)?;
    let mated = if my_color == rules::Color::White { game.white_mated } else { game.black_mated };
    if mated {
        return Err("FROZEN_MATED".into());
    }

    let piece_row = ctx.db.piece().game_id().filter(game_id)
        .find(|p| p.sq == from_sq)
        .ok_or("No piece there")?;
    if u8_to_color(piece_row.color) != my_color {
        return Err("Not your piece".into());
    }
    if piece_row.cooldown_until > ctx.timestamp {
        return Err("COOLDOWN".into());
    }
    if in_stasis(ctx, piece_row.piece_id) {
        return Err("STASIS".into());
    }

    let board = board_of(ctx, game_id);
    let outcome = rules::is_legal_move(&board, from_sq, to_sq, my_color).map_err(|e| format!("{e:?}"))?;

    // Detect king capture BEFORE applying (so we know the game ends).
    let captured_king = outcome.captured_sq
        .and_then(|cs| board.at(cs).map(|p| p.ty == rules::PieceType::King))
        .unwrap_or(false);
    let captured_ty = outcome.captured_sq
        .and_then(|cs| board.at(cs).map(|p| ty_to_u8(p.ty)))
        .unwrap_or(255);

    // Barrier / Guardian interception: a shielded victim — or a king whose
    // owner holds Guardian in hand — repels the attacker. The attacker never
    // leaves its square and takes a (doubled, for Guardian) full cooldown.
    if let Some(cs) = outcome.captured_sq {
        let victim = ctx.db.piece().game_id().filter(game_id)
            .find(|p| p.sq == cs)
            .ok_or("Victim piece missing")?;
        if in_stasis(ctx, victim.piece_id) {
            return Err("Target is locked in stasis".into());
        }
        if victim.shielded {
            let mut v = victim;
            v.shielded = false;
            ctx.db.piece().piece_id().update(v);
            let mut atk = piece_row;
            atk.cooldown_until = ctx.timestamp + TimeDuration::from_micros(cooldown_micros(atk.ty));
            ctx.db.piece().piece_id().update(atk);
            log_effect(ctx, game_id, 1, color_to_u8(my_color), 255, from_sq, cs);
            return Ok(());
        }
        if victim.ty == 5 {
            let defender_id = if game.white_id == account_id { game.black_id } else { game.white_id };
            if let Some(mut dcs) = ctx.db.game_card_state().game_id().filter(game_id)
                .find(|c| c.account_id == defender_id)
            {
                if let Some(pos) = dcs.hand.iter().position(|&c| c == cards::CARD_GUARDIAN) {
                    dcs.hand.remove(pos);
                    dcs.discard.push(cards::CARD_GUARDIAN);
                    draw_card(ctx, &mut dcs);
                    ctx.db.game_card_state().id().update(dcs);
                    let mut atk = piece_row;
                    atk.cooldown_until =
                        ctx.timestamp + TimeDuration::from_micros(2 * cooldown_micros(atk.ty));
                    ctx.db.piece().piece_id().update(atk);
                    log_effect(ctx, game_id, 2, color_to_u8(my_color), cards::CARD_GUARDIAN, from_sq, cs);
                    return Ok(());
                }
            }
        }
    }

    // Apply to tables.
    if let Some(cs) = outcome.captured_sq {
        if let Some(victim) = ctx.db.piece().game_id().filter(game_id).find(|p| p.sq == cs) {
            ctx.db.piece_status().piece_id().delete(victim.piece_id);
            ctx.db.piece().piece_id().delete(victim.piece_id);
        }
    }
    let mut mover = piece_row;
    mover.sq = to_sq;
    mover.has_moved = true;
    if outcome.promotes {
        mover.ty = 4; // auto-queen
    }
    mover.cooldown_until = ctx.timestamp + TimeDuration::from_micros(cooldown_micros(mover.ty));
    ctx.db.piece().piece_id().update(mover);
    if let Some((rf, rt)) = outcome.rook_move {
        if let Some(mut rook) = ctx.db.piece().game_id().filter(game_id).find(|p| p.sq == rf) {
            rook.sq = rt;
            rook.has_moved = true;
            rook.cooldown_until = ctx.timestamp + TimeDuration::from_micros(cooldown_micros(3));
            ctx.db.piece().piece_id().update(rook);
        }
    }

    // Log with the post-move snapshot (powers replays, judge, and later Rewind).
    let board_after = board_of(ctx, game_id);
    let seq = ctx.db.move_log().game_id().filter(game_id).count() as u32;
    ctx.db.move_log().insert(MoveLog {
        move_id: 0,
        game_id,
        seq,
        ts: ctx.timestamp,
        color: color_to_u8(my_color),
        from_sq,
        to_sq,
        captured_ty,
        board_after: snapshot_string(&board_after),
    });

    if captured_king {
        let result = if my_color == rules::Color::White { 1 } else { 2 };
        finish_game(ctx, game_id, result, 1);
        return Ok(());
    }
    refresh_check_flags(ctx, game_id);
    write_snapshot(ctx, game_id, seq + 1);
    Ok(())
}

/// Draw one card; reshuffles the discard pile back into the deck when empty.
fn draw_card(ctx: &ReducerContext, cs: &mut GameCardState) {
    if cs.deck.is_empty() && !cs.discard.is_empty() {
        cs.deck = std::mem::take(&mut cs.discard);
        cs.deck.shuffle(&mut ctx.rng());
    }
    if let Some(c) = cs.deck.pop() {
        cs.hand.push(c);
    }
}

fn own_piece_at(ctx: &ReducerContext, game_id: u64, sq: u8, my_u8: u8) -> Result<Piece, String> {
    let p = ctx.db.piece().game_id().filter(game_id).find(|p| p.sq == sq).ok_or("No piece there")?;
    if p.color != my_u8 {
        return Err("Target one of your own pieces".into());
    }
    Ok(p)
}

fn enemy_piece_at(ctx: &ReducerContext, game_id: u64, sq: u8, my_u8: u8) -> Result<Piece, String> {
    let p = ctx.db.piece().game_id().filter(game_id).find(|p| p.sq == sq).ok_or("No piece there")?;
    if p.color == my_u8 {
        return Err("Target an enemy piece".into());
    }
    Ok(p)
}

/// Restore the board to its snapshot of ≥20s ago (or the earliest available).
fn rewind_board(ctx: &ReducerContext, game_id: u64) -> Result<(), String> {
    let cutoff = ctx.timestamp.to_micros_since_unix_epoch() - 20_000_000;
    let snaps: Vec<BoardSnapshot> = ctx.db.board_snapshot().game_id().filter(game_id).collect();
    let target = snaps
        .iter()
        .filter(|s| s.ts.to_micros_since_unix_epoch() <= cutoff)
        .max_by_key(|s| (s.ts.to_micros_since_unix_epoch(), s.id))
        .or_else(|| snaps.iter().min_by_key(|s| s.id))
        .ok_or("No snapshot available")?;

    let ids: Vec<u64> = ctx.db.piece().game_id().filter(game_id).map(|p| p.piece_id).collect();
    for id in ids {
        ctx.db.piece_status().piece_id().delete(id);
        ctx.db.piece().piece_id().delete(id);
    }
    let ready = ctx.timestamp + TimeDuration::from_micros(3_000_000);
    let board = target.board.as_bytes();
    let moved = target.moved.as_bytes();
    for sq in 0..64usize {
        let ch = board[sq] as char;
        if ch == '.' {
            continue;
        }
        let ty = match ch.to_ascii_lowercase() {
            'p' => 0,
            'n' => 1,
            'b' => 2,
            'r' => 3,
            'q' => 4,
            _ => 5,
        };
        ctx.db.piece().insert(Piece {
            piece_id: 0,
            game_id,
            ty,
            color: if ch.is_ascii_uppercase() { 0 } else { 1 },
            sq: sq as u8,
            has_moved: moved[sq] == b'm',
            cooldown_until: ready,
            shielded: false,
        });
    }
    Ok(())
}

/// Play a card from your hand. Cards ARE playable while checked or mated —
/// they are the comeback mechanic. targets are squares; 255 = unused.
#[reducer]
pub fn play_card(ctx: &ReducerContext, game_id: u64, hand_index: u8, target_a: u8, target_b: u8) -> Result<(), String> {
    if !CARDS_ENABLED {
        return Err("Spells are disabled".into());
    }
    let s = logged_in(ctx)?;
    let game = ctx.db.game().game_id().find(game_id).ok_or("No such game")?;
    if game.phase != 1 {
        return Err("Game is not live".into());
    }
    let my_color = color_of(&game, s.account_id)?;
    let my_u8 = color_to_u8(my_color);

    let mut cs = ctx.db.game_card_state().game_id().filter(game_id)
        .find(|c| c.account_id == s.account_id)
        .ok_or("No card state")?;
    let card = *cs.hand.get(hand_index as usize).ok_or("No such card in hand")?;
    if card == cards::CARD_GUARDIAN {
        return Err("Guardian is passive — it triggers on its own".into());
    }

    let mut gems = ctx.db.game_gems().game_id().filter(game_id)
        .find(|g| g.account_id == s.account_id)
        .ok_or("No gem state")?;
    let now_us = ctx.timestamp.to_micros_since_unix_epoch();
    let (new_base, new_anchor) =
        cards::spend(gems.base, gems.anchor.to_micros_since_unix_epoch(), now_us, cards::cost_of(card))
            .ok_or("NOT_ENOUGH_GEMS")?;

    let mut board_changed = false;
    let mut stolen_bonus = 0u8;
    match card {
        cards::CARD_BARRIER => {
            let mut p = own_piece_at(ctx, game_id, target_a, my_u8)?;
            if p.shielded {
                return Err("Already shielded".into());
            }
            p.shielded = true;
            ctx.db.piece().piece_id().update(p);
            log_effect(ctx, game_id, 9, my_u8, card, target_a, 255);
        }
        cards::CARD_RESET => {
            let mut p = own_piece_at(ctx, game_id, target_a, my_u8)?;
            if p.cooldown_until <= ctx.timestamp {
                return Err("That piece is already ready".into());
            }
            p.cooldown_until = ctx.timestamp;
            ctx.db.piece().piece_id().update(p);
            log_effect(ctx, game_id, 5, my_u8, card, target_a, 255);
        }
        cards::CARD_REWIND => {
            rewind_board(ctx, game_id)?;
            board_changed = true;
            log_effect(ctx, game_id, 3, my_u8, card, 255, 255);
        }
        cards::CARD_FREEZE => {
            let mut p = enemy_piece_at(ctx, game_id, target_a, my_u8)?;
            let base = if p.cooldown_until > ctx.timestamp { p.cooldown_until } else { ctx.timestamp };
            p.cooldown_until = base + TimeDuration::from_micros(8_000_000);
            ctx.db.piece().piece_id().update(p);
            log_effect(ctx, game_id, 4, my_u8, card, target_a, 255);
        }
        cards::CARD_PAWN_STORM => {
            let pawns: Vec<Piece> = ctx.db.piece().game_id().filter(game_id)
                .filter(|p| p.color == my_u8 && p.ty == 0)
                .collect();
            if pawns.is_empty() {
                return Err("You have no pawns".into());
            }
            for mut p in pawns {
                p.cooldown_until = ctx.timestamp;
                ctx.db.piece().piece_id().update(p);
            }
            log_effect(ctx, game_id, 6, my_u8, card, 255, 255);
        }
        cards::CARD_SWAP => {
            if target_a == target_b {
                return Err("Pick two different pieces".into());
            }
            let a = own_piece_at(ctx, game_id, target_a, my_u8)?;
            let b = own_piece_at(ctx, game_id, target_b, my_u8)?;
            if a.cooldown_until > ctx.timestamp || b.cooldown_until > ctx.timestamp {
                return Err("Both pieces must be ready".into());
            }
            if in_stasis(ctx, a.piece_id) || in_stasis(ctx, b.piece_id) {
                return Err("A piece is locked in stasis".into());
            }
            let mut sim = board_of(ctx, game_id);
            for p in sim.pieces.iter_mut() {
                if p.sq == target_a {
                    p.sq = target_b;
                } else if p.sq == target_b {
                    p.sq = target_a;
                }
            }
            if rules::in_check(&sim, my_color) {
                return Err("LeavesKingAttacked".into());
            }
            let (mut a, mut b) = (a, b);
            a.sq = target_b;
            b.sq = target_a;
            a.has_moved = true;
            b.has_moved = true;
            a.cooldown_until = ctx.timestamp + TimeDuration::from_micros(cooldown_micros(a.ty));
            b.cooldown_until = ctx.timestamp + TimeDuration::from_micros(cooldown_micros(b.ty));
            ctx.db.piece().piece_id().update(a);
            ctx.db.piece().piece_id().update(b);
            board_changed = true;
            log_effect(ctx, game_id, 7, my_u8, card, target_a, target_b);
        }
        cards::CARD_REVIVE => {
            // most recently lost piece (a capture made by the opponent)
            let opp_u8 = 1 - my_u8;
            let lost_ty = ctx.db.move_log().game_id().filter(game_id)
                .filter(|m| m.color == opp_u8 && m.captured_ty != 255 && m.captured_ty != 5)
                .max_by_key(|m| m.seq)
                .map(|m| m.captured_ty)
                .ok_or("You haven't lost a piece yet")?;
            if ctx.db.piece().game_id().filter(game_id).any(|p| p.sq == target_a) {
                return Err("Pick an empty square".into());
            }
            let r = rules::rank(target_a);
            let home = if my_u8 == 0 { r <= 1 } else { r >= 6 };
            if !home {
                return Err("Revive only works on your two home ranks".into());
            }
            ctx.db.piece().insert(Piece {
                piece_id: 0,
                game_id,
                ty: lost_ty,
                color: my_u8,
                sq: target_a,
                has_moved: true,
                cooldown_until: ctx.timestamp + TimeDuration::from_micros(5_000_000),
                shielded: false,
            });
            board_changed = true;
            log_effect(ctx, game_id, 10, my_u8, card, target_a, lost_ty);
        }
        cards::CARD_DUPLICATE => {
            let src = own_piece_at(ctx, game_id, target_a, my_u8)?;
            if src.ty != 0 {
                return Err("Only pawns can be duplicated".into());
            }
            // first empty adjacent square: behind, left, right, ahead
            let dir: i8 = if my_u8 == 0 { -1 } else { 1 };
            let f = rules::file(target_a);
            let r = rules::rank(target_a);
            let candidates = [(0i8, dir), (-1, 0), (1, 0), (0, -dir)];
            let spot = candidates.iter().find_map(|(df, dr)| {
                let nf = f + df;
                let nr = r + dr;
                if !(0..8).contains(&nf) || !(0..8).contains(&nr) {
                    return None;
                }
                let sq = (nr * 8 + nf) as u8;
                if ctx.db.piece().game_id().filter(game_id).any(|p| p.sq == sq) {
                    None
                } else {
                    Some(sq)
                }
            }).ok_or("No empty square next to that pawn")?;
            ctx.db.piece().insert(Piece {
                piece_id: 0,
                game_id,
                ty: 0,
                color: my_u8,
                sq: spot,
                has_moved: true,
                cooldown_until: ctx.timestamp + TimeDuration::from_micros(3_000_000),
                shielded: false,
            });
            board_changed = true;
            log_effect(ctx, game_id, 11, my_u8, card, target_a, spot);
        }
        cards::CARD_OVERCLOCK => {
            let cooling: Vec<Piece> = ctx.db.piece().game_id().filter(game_id)
                .filter(|p| p.color == my_u8 && p.cooldown_until > ctx.timestamp)
                .collect();
            if cooling.is_empty() {
                return Err("Nothing is cooling down".into());
            }
            for mut p in cooling {
                let remaining = p.cooldown_until.to_micros_since_unix_epoch()
                    - ctx.timestamp.to_micros_since_unix_epoch();
                p.cooldown_until = ctx.timestamp + TimeDuration::from_micros(remaining / 2);
                ctx.db.piece().piece_id().update(p);
            }
            log_effect(ctx, game_id, 12, my_u8, card, 255, 255);
        }
        cards::CARD_STASIS => {
            let p = ctx.db.piece().game_id().filter(game_id)
                .find(|p| p.sq == target_a)
                .ok_or("No piece there")?;
            let until = ctx.timestamp + TimeDuration::from_micros(8_000_000);
            if ctx.db.piece_status().piece_id().find(p.piece_id).is_some() {
                ctx.db.piece_status().piece_id().update(PieceStatus { piece_id: p.piece_id, game_id, stasis_until: until });
            } else {
                ctx.db.piece_status().insert(PieceStatus { piece_id: p.piece_id, game_id, stasis_until: until });
            }
            log_effect(ctx, game_id, 13, my_u8, card, target_a, 255);
        }
        cards::CARD_TIME_THEFT => {
            let opp_id = if game.white_id == s.account_id { game.black_id } else { game.white_id };
            let mut opp = ctx.db.game_gems().game_id().filter(game_id)
                .find(|g| g.account_id == opp_id)
                .ok_or("No gem state")?;
            let opp_anchor = opp.anchor.to_micros_since_unix_epoch();
            let stolen = cards::gems_now(opp.base, opp_anchor, now_us).min(2);
            if stolen == 0 {
                return Err("Opponent has no gems to steal".into());
            }
            let (ob, oa) = cards::spend(opp.base, opp_anchor, now_us, stolen).expect("checked above");
            opp.base = ob;
            opp.anchor = Timestamp::from_micros_since_unix_epoch(oa);
            ctx.db.game_gems().id().update(opp);
            stolen_bonus = stolen;
            log_effect(ctx, game_id, 8, my_u8, card, 255, 255);
        }
        _ => return Err("Unknown card".into()),
    }

    gems.base = (new_base + stolen_bonus).min(cards::GEM_CAP);
    gems.anchor = Timestamp::from_micros_since_unix_epoch(new_anchor);
    ctx.db.game_gems().id().update(gems);

    cs.hand.remove(hand_index as usize);
    cs.discard.push(card);
    draw_card(ctx, &mut cs);
    ctx.db.game_card_state().id().update(cs);
    log_effect(ctx, game_id, 0, my_u8, card, target_a, target_b);

    if board_changed {
        refresh_check_flags(ctx, game_id);
        let seq = ctx.db.move_log().game_id().filter(game_id).count() as u32;
        write_snapshot(ctx, game_id, seq + 1);
    }
    Ok(())
}

#[reducer]
pub fn resign(ctx: &ReducerContext, game_id: u64) -> Result<(), String> {
    let s = logged_in(ctx)?;
    let game = ctx.db.game().game_id().find(game_id).ok_or("No such game")?;
    if game.phase == 2 {
        return Err("Game already finished".into());
    }
    let my_color = color_of(&game, s.account_id)?;
    let result = if my_color == rules::Color::White { 2 } else { 1 };
    finish_game(ctx, game_id, result, 2);
    Ok(())
}

#[reducer]
pub fn offer_draw(ctx: &ReducerContext, game_id: u64) -> Result<(), String> {
    let s = logged_in(ctx)?;
    let mut game = ctx.db.game().game_id().find(game_id).ok_or("No such game")?;
    if game.phase != 1 {
        return Err("Game is not live".into());
    }
    match color_of(&game, s.account_id)? {
        rules::Color::White => game.white_draw_offer = true,
        rules::Color::Black => game.black_draw_offer = true,
    }
    if game.white_draw_offer && game.black_draw_offer {
        let id = game.game_id;
        ctx.db.game().game_id().update(game);
        finish_game(ctx, id, 3, 4);
    } else {
        ctx.db.game().game_id().update(game);
    }
    Ok(())
}

#[reducer]
pub fn forfeit_check(ctx: &ReducerContext, timer: ForfeitTimer) -> Result<(), String> {
    if ctx.sender() != ctx.identity() {
        return Err("forfeit_check may only be invoked by the scheduler".into());
    }
    let game = match ctx.db.game().game_id().find(timer.game_id) {
        Some(g) => g,
        None => return Ok(()),
    };
    if game.phase == 2 {
        return Ok(());
    }
    if !account_is_online(ctx, timer.account_id) {
        let result = if game.white_id == timer.account_id { 2 } else { 1 };
        finish_game(ctx, timer.game_id, result, 3);
    }
    Ok(())
}

/// Called from connection lifecycle: schedule a forfeit when a player drops mid-game.
pub fn schedule_forfeit_if_in_game(ctx: &ReducerContext, account_id: u64) {
    if account_is_online(ctx, account_id) {
        return; // another device still connected
    }
    if let Some(g) = live_game_of(ctx, account_id) {
        ctx.db.forfeit_timer().insert(ForfeitTimer {
            scheduled_id: 0,
            scheduled_at: (ctx.timestamp + TimeDuration::from_micros(FORFEIT_GRACE_MICROS)).into(),
            game_id: g.game_id,
            account_id,
        });
    }
}

/// Called from connection lifecycle: cancel pending forfeits when a player returns.
pub fn cancel_forfeits_for_account(ctx: &ReducerContext, account_id: u64) {
    let timers: Vec<ForfeitTimer> = ctx.db.forfeit_timer().account_id().filter(account_id).collect();
    for t in timers {
        ctx.db.forfeit_timer().scheduled_id().delete(t.scheduled_id);
    }
}
