//! Game lifecycle: queue pairing, countdown, real-time moves, end conditions.

use spacetimedb::{reducer, table, ReducerContext, ScheduleAt, Table, TimeDuration, Timestamp};

use crate::module::*;
use crate::rules;

// ---------------- tuning constants ----------------

pub const START_COUNTDOWN_MICROS: i64 = 3_000_000;
pub const FORFEIT_GRACE_MICROS: i64 = 60_000_000;

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

fn finish_game(ctx: &ReducerContext, game_id: u64, result: u8, reason: u8) {
    if let Some(mut g) = ctx.db.game().game_id().find(game_id) {
        if g.phase == 2 {
            return;
        }
        g.phase = 2;
        g.result = result;
        g.result_reason = reason;
        let (w, b) = (g.white_id, g.black_id);
        ctx.db.game().game_id().update(g);
        set_status_for_account(ctx, w, 0);
        set_status_for_account(ctx, b, 0);
        let timers: Vec<ForfeitTimer> = ctx.db.forfeit_timer().game_id().filter(game_id).collect();
        for t in timers {
            ctx.db.forfeit_timer().scheduled_id().delete(t.scheduled_id);
        }
    }
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
        });
    }
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
    // FIFO: pair with the earliest waiting opponent
    let opponent = ctx.db.queue_entry().iter()
        .filter(|q| q.account_id != s.account_id)
        .min_by_key(|q| q.queued_at);
    match opponent {
        Some(op) => {
            ctx.db.queue_entry().account_id().delete(op.account_id);
            start_game(ctx, op.account_id, &op.username, s.account_id, &s.username);
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

#[reducer]
pub fn move_piece(ctx: &ReducerContext, game_id: u64, from_sq: u8, to_sq: u8) -> Result<(), String> {
    let s = logged_in(ctx)?;
    let game = ctx.db.game().game_id().find(game_id).ok_or("No such game")?;
    if game.phase != 1 {
        return Err("Game is not live".into());
    }
    let my_color = color_of(&game, s.account_id)?;
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

    let board = board_of(ctx, game_id);
    let outcome = rules::is_legal_move(&board, from_sq, to_sq, my_color).map_err(|e| format!("{e:?}"))?;

    // Detect king capture BEFORE applying (so we know the game ends).
    let captured_king = outcome.captured_sq
        .and_then(|cs| board.at(cs).map(|p| p.ty == rules::PieceType::King))
        .unwrap_or(false);
    let captured_ty = outcome.captured_sq
        .and_then(|cs| board.at(cs).map(|p| ty_to_u8(p.ty)))
        .unwrap_or(255);

    // Apply to tables.
    if let Some(cs) = outcome.captured_sq {
        if let Some(victim) = ctx.db.piece().game_id().filter(game_id).find(|p| p.sq == cs) {
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
