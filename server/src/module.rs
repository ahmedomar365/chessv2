//! SpacetimeDB tables and lifecycle reducers (wasm-only; pure logic lives in `rules`).

use spacetimedb::{reducer, table, Identity, ReducerContext, Table, Timestamp};

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

// ---------------- lifecycle ----------------

#[reducer(init)]
pub fn init(_ctx: &ReducerContext) {}

#[reducer(client_connected)]
pub fn client_connected(ctx: &ReducerContext) {
    if let Some(mut s) = ctx.db.session().identity().find(ctx.sender()) {
        s.online = true;
        ctx.db.session().identity().update(s);
    } else {
        ctx.db.session().insert(Session {
            identity: ctx.sender(),
            account_id: 0,
            username: String::new(),
            online: true,
            status: 0,
        });
    }
}

#[reducer(client_disconnected)]
pub fn client_disconnected(ctx: &ReducerContext) {
    if let Some(mut s) = ctx.db.session().identity().find(ctx.sender()) {
        if s.account_id != 0 {
            ctx.db.queue_entry().account_id().delete(s.account_id);
        }
        s.online = false;
        ctx.db.session().identity().update(s);
    }
}
