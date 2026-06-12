//! SpacetimeDB tables and lifecycle reducers (wasm-only; pure logic lives in `rules`).

use spacetimedb::rand::RngCore;
use spacetimedb::{
    reducer, table, view, Identity, ReducerContext, Table, TimeDuration, Timestamp, ViewContext,
};

use crate::auth;
use crate::rules::{Board, BoardPiece, Color, PieceType};

// ---------------- tables ----------------

/// PRIVATE — holds password hashes; never expose.
#[table(accessor = account)]
pub struct Account {
    #[primary_key]
    #[auto_inc]
    pub account_id: u64,
    #[unique]
    pub username_lower: String,
    pub username: String,
    pub pass_hash: String,
    pub created_at: Timestamp,
}

/// One row per connected client identity; account_id 0 = not logged in.
#[table(accessor = session, public)]
pub struct Session {
    #[primary_key]
    pub identity: Identity,
    #[index(btree)]
    pub account_id: u64,
    pub username: String,
    pub online: bool,
    /// live connections for this identity (multiple tabs); online = connections > 0
    pub connections: u32,
    /// 0 lobby, 1 in_game, 2 spectating
    pub status: u8,
}

#[table(accessor = game, public)]
pub struct Game {
    #[primary_key]
    #[auto_inc]
    pub game_id: u64,
    #[index(btree)]
    pub white_id: u64,
    #[index(btree)]
    pub black_id: u64,
    pub white_name: String,
    pub black_name: String,
    /// 0 countdown, 1 live, 2 finished
    pub phase: u8,
    pub started_at: Timestamp,
    /// 0 none, 1 white wins, 2 black wins, 3 draw
    pub result: u8,
    /// 0 none, 1 king captured, 2 resign, 3 forfeit, 4 agreement
    pub result_reason: u8,
    pub white_in_check: bool,
    pub black_in_check: bool,
    pub white_mated: bool,
    pub black_mated: bool,
    pub white_draw_offer: bool,
    pub black_draw_offer: bool,
}

#[table(accessor = piece, public)]
pub struct Piece {
    #[primary_key]
    #[auto_inc]
    pub piece_id: u64,
    #[index(btree)]
    pub game_id: u64,
    /// 0 pawn, 1 knight, 2 bishop, 3 rook, 4 queen, 5 king
    pub ty: u8,
    /// 0 white, 1 black
    pub color: u8,
    pub sq: u8,
    pub has_moved: bool,
    pub cooldown_until: Timestamp,
    /// Barrier card: next capture attempt on this piece is repelled.
    pub shielded: bool,
}

#[table(accessor = move_log, public)]
pub struct MoveLog {
    #[primary_key]
    #[auto_inc]
    pub move_id: u64,
    #[index(btree)]
    pub game_id: u64,
    pub seq: u32,
    pub ts: Timestamp,
    pub color: u8,
    pub from_sq: u8,
    pub to_sq: u8,
    /// captured piece type, 255 = none
    pub captured_ty: u8,
    /// 64 chars, '.' empty, white PNBRQK / black pnbrqk, square 0 first
    pub board_after: String,
}

#[table(accessor = queue_entry, public)]
pub struct QueueEntry {
    #[primary_key]
    pub account_id: u64,
    pub username: String,
    pub queued_at: Timestamp,
}

/// Time-gem balance per player per game — public (gem counts are visible tension).
#[table(accessor = game_gems, public)]
pub struct GameGems {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    #[index(btree)]
    pub game_id: u64,
    pub account_id: u64,
    /// gems at `anchor`; current = min(10, base + elapsed/5s)
    pub base: u8,
    pub anchor: Timestamp,
}

/// PRIVATE — deck order, hand, and discard per player per game. Exposed only
/// to the owning player through the `my_card_state` view.
#[table(accessor = game_card_state)]
pub struct GameCardState {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    #[index(btree)]
    pub game_id: u64,
    #[index(btree)]
    pub account_id: u64,
    pub deck: Vec<u8>,
    pub hand: Vec<u8>,
    pub discard: Vec<u8>,
}

/// Public play-by-play of card plays and effects — powers animations,
/// opponent notifications, and spectators. Never reveals hands.
#[table(accessor = effect_log, public)]
pub struct EffectLog {
    #[primary_key]
    #[auto_inc]
    pub effect_id: u64,
    #[index(btree)]
    pub game_id: u64,
    pub ts: Timestamp,
    /// 0 card_played, 1 repel, 2 guardian_save, 3 rewind, 4 freeze, 5 reset,
    /// 6 pawn_storm, 7 swap, 8 theft, 9 shield_set
    pub kind: u8,
    pub actor_color: u8,
    /// card id, 255 = n/a
    pub card: u8,
    /// squares involved, 255 = n/a
    pub a_sq: u8,
    pub b_sq: u8,
}

/// PRIVATE — full board state after every change; powers the Rewind card.
/// `board`: 64 chars ('.', PNBRQK/pnbrqk); `moved`: 64 chars ('.', 'm').
#[table(accessor = board_snapshot)]
pub struct BoardSnapshot {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    #[index(btree)]
    pub game_id: u64,
    pub ts: Timestamp,
    pub seq: u32,
    pub board: String,
    pub moved: String,
}

/// Each player sees ONLY their own hands (per live game) through this view.
#[view(accessor = my_card_state, public)]
fn my_card_state(ctx: &ViewContext) -> Vec<GameCardState> {
    match ctx.db.session().identity().find(ctx.sender()) {
        Some(s) if s.account_id != 0 => {
            ctx.db.game_card_state().account_id().filter(s.account_id).collect()
        }
        _ => Vec::new(),
    }
}

/// PRIVATE — failed-login throttle per connection identity.
#[table(accessor = auth_throttle)]
pub struct AuthThrottle {
    #[primary_key]
    pub identity: Identity,
    pub fails: u32,
    pub locked_until: Timestamp,
}

// ---------------- conversions & helpers ----------------

pub fn ty_to_u8(ty: PieceType) -> u8 {
    match ty {
        PieceType::Pawn => 0,
        PieceType::Knight => 1,
        PieceType::Bishop => 2,
        PieceType::Rook => 3,
        PieceType::Queen => 4,
        PieceType::King => 5,
    }
}

pub fn u8_to_ty(v: u8) -> PieceType {
    match v {
        0 => PieceType::Pawn,
        1 => PieceType::Knight,
        2 => PieceType::Bishop,
        3 => PieceType::Rook,
        4 => PieceType::Queen,
        _ => PieceType::King,
    }
}

pub fn color_to_u8(c: Color) -> u8 {
    if c == Color::White { 0 } else { 1 }
}

pub fn u8_to_color(v: u8) -> Color {
    if v == 0 { Color::White } else { Color::Black }
}

/// Rebuild a pure rules board from a game's piece rows.
pub fn board_of(ctx: &ReducerContext, game_id: u64) -> Board {
    Board {
        pieces: ctx.db.piece().game_id().filter(game_id)
            .map(|p| BoardPiece {
                ty: u8_to_ty(p.ty),
                color: u8_to_color(p.color),
                sq: p.sq,
                has_moved: p.has_moved,
            })
            .collect(),
    }
}

/// 64-char board snapshot ('.', PNBRQK for white, pnbrqk for black).
pub fn snapshot_string(board: &Board) -> String {
    let mut out = ['.'; 64];
    for p in &board.pieces {
        let ch = match p.ty {
            PieceType::Pawn => 'p',
            PieceType::Knight => 'n',
            PieceType::Bishop => 'b',
            PieceType::Rook => 'r',
            PieceType::Queen => 'q',
            PieceType::King => 'k',
        };
        out[p.sq as usize] = if p.color == Color::White { ch.to_ascii_uppercase() } else { ch };
    }
    out.iter().collect()
}

// ---------------- auth ----------------

fn bind_session(ctx: &ReducerContext, account_id: u64, username: &str) {
    if let Some(mut s) = ctx.db.session().identity().find(ctx.sender()) {
        s.account_id = account_id;
        s.username = username.to_string();
        ctx.db.session().identity().update(s);
    } else {
        ctx.db.session().insert(Session {
            identity: ctx.sender(),
            account_id,
            username: username.to_string(),
            online: true,
            connections: 1,
            status: 0,
        });
    }
}

const MAX_AUTH_FAILS: u32 = 5;
const AUTH_LOCK_SECS: i64 = 60;

fn check_throttle(ctx: &ReducerContext) -> Result<(), String> {
    if let Some(t) = ctx.db.auth_throttle().identity().find(ctx.sender()) {
        if t.locked_until > ctx.timestamp {
            return Err("Too many attempts. Try again in a minute".into());
        }
    }
    Ok(())
}

fn record_auth_fail(ctx: &ReducerContext) {
    let mut t = ctx.db.auth_throttle().identity().find(ctx.sender()).unwrap_or(AuthThrottle {
        identity: ctx.sender(),
        fails: 0,
        locked_until: Timestamp::UNIX_EPOCH,
    });
    t.fails += 1;
    if t.fails >= MAX_AUTH_FAILS {
        t.fails = 0;
        t.locked_until = ctx.timestamp + TimeDuration::from_micros(AUTH_LOCK_SECS * 1_000_000);
    }
    if ctx.db.auth_throttle().identity().find(ctx.sender()).is_some() {
        ctx.db.auth_throttle().identity().update(t);
    } else {
        ctx.db.auth_throttle().insert(t);
    }
}

#[reducer]
pub fn register(ctx: &ReducerContext, username: String, password: String) -> Result<(), String> {
    check_throttle(ctx)?;
    auth::validate_username(&username)?;
    if password.len() < 6 {
        return Err("Password must be at least 6 characters".into());
    }
    let lower = username.to_lowercase();
    if ctx.db.account().username_lower().find(&lower).is_some() {
        return Err("Username already taken".into());
    }
    let mut salt = [0u8; 16];
    let mut rng = ctx.rng();
    rng.fill_bytes(&mut salt);
    let acc = ctx.db.account().insert(Account {
        account_id: 0,
        username_lower: lower,
        username: username.clone(),
        pass_hash: auth::hash_password(&password, &salt),
        created_at: ctx.timestamp,
    });
    bind_session(ctx, acc.account_id, &username);
    Ok(())
}

/// Login NEVER creates an account, and there is no password recovery.
#[reducer]
pub fn login(ctx: &ReducerContext, username: String, password: String) -> Result<(), String> {
    check_throttle(ctx)?;
    let acc = match ctx.db.account().username_lower().find(username.to_lowercase()) {
        Some(a) => a,
        None => {
            record_auth_fail(ctx);
            return Err("Account does not exist".into());
        }
    };
    if !auth::verify_password(&password, &acc.pass_hash) {
        record_auth_fail(ctx);
        return Err("Wrong password".into());
    }
    ctx.db.auth_throttle().identity().delete(ctx.sender());
    bind_session(ctx, acc.account_id, &acc.username);
    Ok(())
}

#[reducer]
pub fn logout(ctx: &ReducerContext) {
    if let Some(mut s) = ctx.db.session().identity().find(ctx.sender()) {
        if s.account_id != 0 {
            ctx.db.queue_entry().account_id().delete(s.account_id);
        }
        s.account_id = 0;
        s.username = String::new();
        s.status = 0;
        ctx.db.session().identity().update(s);
    }
}

// ---------------- lifecycle ----------------

#[reducer(init)]
pub fn init(_ctx: &ReducerContext) {}

#[reducer(client_connected)]
pub fn client_connected(ctx: &ReducerContext) {
    if let Some(mut s) = ctx.db.session().identity().find(ctx.sender()) {
        s.connections += 1;
        s.online = true;
        let account_id = s.account_id;
        ctx.db.session().identity().update(s);
        if account_id != 0 {
            crate::game::cancel_forfeits_for_account(ctx, account_id);
        }
    } else {
        ctx.db.session().insert(Session {
            identity: ctx.sender(),
            account_id: 0,
            username: String::new(),
            online: true,
            connections: 1,
            status: 0,
        });
    }
}

#[reducer(client_disconnected)]
pub fn client_disconnected(ctx: &ReducerContext) {
    if let Some(mut s) = ctx.db.session().identity().find(ctx.sender()) {
        let account_id = s.account_id;
        s.connections = s.connections.saturating_sub(1);
        s.online = s.connections > 0;
        let fully_offline = !s.online;
        ctx.db.session().identity().update(s);
        if account_id != 0 && fully_offline {
            // Only dequeue / start forfeit when the LAST connection drops.
            ctx.db.queue_entry().account_id().delete(account_id);
            crate::game::schedule_forfeit_if_in_game(ctx, account_id);
            crate::social::clear_challenges_for(ctx, account_id);
            crate::social::stop_spectating_inner(ctx, account_id);
        }
    }
}
