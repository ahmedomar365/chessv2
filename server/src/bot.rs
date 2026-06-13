//! Practice bot ("TimeKeeper") — unrated games with humanized timing.

use spacetimedb::rand::Rng;
use spacetimedb::{reducer, table, ReducerContext, ScheduleAt, Table, TimeDuration};

use crate::game::{live_game_of, logged_in, start_game_pair};
use crate::module::*;
use crate::rules;

pub const BOT_USERNAME: &str = "TimeKeeper";
const BOT_TICK_MICROS: i64 = 1_600_000;

#[table(accessor = bot_timer, scheduled(bot_tick))]
pub struct BotTimer {
    #[primary_key]
    #[auto_inc]
    pub scheduled_id: u64,
    pub scheduled_at: ScheduleAt,
    #[index(btree)]
    pub game_id: u64,
}

/// Created in init(): an account nobody can log into (sentinel hash).
pub fn ensure_bot_account(ctx: &ReducerContext) -> u64 {
    if let Some(a) = ctx.db.account().username_lower().find(BOT_USERNAME.to_lowercase()) {
        return a.account_id;
    }
    let acc = ctx.db.account().insert(Account {
        account_id: 0,
        username_lower: BOT_USERNAME.to_lowercase(),
        username: BOT_USERNAME.to_string(),
        pass_hash: "!bot".into(),
        created_at: ctx.timestamp,
    });
    ctx.db.player_profile().insert(PlayerProfile {
        account_id: acc.account_id,
        username: BOT_USERNAME.to_string(),
        rating: 1200,
        games: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        streak: 0,
        peak: 1200,
        equipped_skin: 0,
    });
    crate::economy::seed_new_account(ctx, acc.account_id);
    acc.account_id
}

fn bot_account_id(ctx: &ReducerContext) -> Option<u64> {
    ctx.db.account().username_lower().find(BOT_USERNAME.to_lowercase()).map(|a| a.account_id)
}

/// Start an unrated practice game against the bot (player plays white).
#[reducer]
pub fn play_bot(ctx: &ReducerContext) -> Result<(), String> {
    let s = logged_in(ctx)?;
    if live_game_of(ctx, s.account_id).is_some() {
        return Err("Already in a game".into());
    }
    let bot_id = bot_account_id(ctx).unwrap_or_else(|| ensure_bot_account(ctx));
    start_game_pair(ctx, s.account_id, &s.username, bot_id, BOT_USERNAME);
    // mark unrated + schedule the bot's brain
    let game = live_game_of(ctx, s.account_id).ok_or("Game failed to start")?;
    let mut g = ctx.db.game().game_id().find(game.game_id).ok_or("No game")?;
    g.rated = false;
    ctx.db.game().game_id().update(g);
    ctx.db.bot_timer().insert(BotTimer {
        scheduled_id: 0,
        scheduled_at: (ctx.timestamp + TimeDuration::from_micros(BOT_TICK_MICROS * 2)).into(),
        game_id: game.game_id,
    });
    Ok(())
}

#[reducer]
pub fn bot_tick(ctx: &ReducerContext, timer: BotTimer) -> Result<(), String> {
    if ctx.sender() != ctx.identity() {
        return Err("scheduler only".into());
    }
    let game = match ctx.db.game().game_id().find(timer.game_id) {
        Some(g) if g.phase < 2 => g,
        _ => return Ok(()), // game over — timer not rescheduled, brain stops
    };
    let bot_id = bot_account_id(ctx).ok_or("no bot")?;
    let bot_color = if game.white_id == bot_id { rules::Color::White } else { rules::Color::Black };
    let mated = if bot_color == rules::Color::White { game.white_mated } else { game.black_mated };

    // reschedule first (with jitter) so the brain keeps ticking
    let jitter: i64 = ctx.rng().gen_range(-400_000..=600_000);
    ctx.db.bot_timer().insert(BotTimer {
        scheduled_id: 0,
        scheduled_at: (ctx.timestamp + TimeDuration::from_micros(BOT_TICK_MICROS + jitter)).into(),
        game_id: timer.game_id,
    });

    if game.phase != 1 || mated {
        return Ok(());
    }
    // ~20% of ticks the bot "thinks" instead of moving
    if ctx.rng().gen_range(0..5) == 0 {
        return Ok(());
    }

    let board = crate::module::board_of(ctx, timer.game_id);
    let ready: Vec<u8> = ctx.db.piece().game_id().filter(timer.game_id)
        .filter(|p| u8_to_color(p.color) == bot_color && p.cooldown_until <= ctx.timestamp)
        .map(|p| p.sq)
        .collect();
    if ready.is_empty() {
        return Ok(());
    }

    // collect legal moves from ready pieces, scored: captures by victim value
    let val = |ty: rules::PieceType| match ty {
        rules::PieceType::Pawn => 1,
        rules::PieceType::Knight | rules::PieceType::Bishop => 3,
        rules::PieceType::Rook => 5,
        rules::PieceType::Queen => 9,
        rules::PieceType::King => 100,
    };
    let mut best: Option<(i32, u8, u8)> = None;
    let mut quiet: Vec<(u8, u8)> = Vec::new();
    for &from in &ready {
        for to in 0..64u8 {
            if let Ok(outcome) = rules::is_legal_move(&board, from, to, bot_color) {
                match outcome.captured_sq.and_then(|cs| board.at(cs)).map(|p| val(p.ty)) {
                    Some(v) => {
                        if best.map(|(bv, _, _)| v > bv).unwrap_or(true) {
                            best = Some((v, from, to));
                        }
                    }
                    None => quiet.push((from, to)),
                }
            }
        }
    }
    let chosen = if let Some((_, f, t)) = best {
        Some((f, t))
    } else if !quiet.is_empty() {
        Some(quiet[ctx.rng().gen_range(0..quiet.len())])
    } else {
        None
    };
    if let Some((from, to)) = chosen {
        // play through the same authoritative path as humans
        let _ = crate::game::bot_move(ctx, timer.game_id, bot_id, from, to);
    }
    Ok(())
}
