//! Chess rules engine — pure, no DB types. Squares are 0..64, a1=0, h8=63.
//!
//! Real-time adaptations: no turn order, no en passant, auto-queen promotion.
//! `is_legal_move` enforces king safety, which simultaneously covers pins,
//! moving into check, and the check-freeze rule (while in check, only moves
//! that resolve the check are legal). Mate detection (`has_any_escape`)
//! ignores cooldowns by design — mate is positional.

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum PieceType { Pawn, Knight, Bishop, Rook, Queen, King }

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Color { White, Black }

impl Color {
    pub fn other(self) -> Color {
        if self == Color::White { Color::Black } else { Color::White }
    }
}

#[derive(Clone, Debug)]
pub struct BoardPiece { pub ty: PieceType, pub color: Color, pub sq: u8, pub has_moved: bool }

#[derive(Clone, Default, Debug)]
pub struct Board { pub pieces: Vec<BoardPiece> }

#[derive(Debug, PartialEq)]
pub struct MoveOutcome {
    pub captured_sq: Option<u8>,
    pub rook_move: Option<(u8, u8)>, // castling: rook from→to
    pub promotes: bool,              // pawn reached last rank (auto-queen)
}

#[derive(Debug, PartialEq)]
pub enum MoveError {
    NoPiece, NotYours, BadDestination, PathBlocked,
    OwnPieceAtDest, IllegalForPiece, LeavesKingAttacked, BadCastle,
}

pub fn file(sq: u8) -> i8 { (sq % 8) as i8 }
pub fn rank(sq: u8) -> i8 { (sq / 8) as i8 }

impl Board {
    pub fn at(&self, sq: u8) -> Option<&BoardPiece> {
        self.pieces.iter().find(|p| p.sq == sq)
    }

    pub fn starting() -> Board {
        use PieceType::*;
        let back = [Rook, Knight, Bishop, Queen, King, Bishop, Knight, Rook];
        let mut pieces = Vec::with_capacity(32);
        for (f, ty) in back.iter().enumerate() {
            pieces.push(BoardPiece { ty: *ty, color: Color::White, sq: f as u8, has_moved: false });
            pieces.push(BoardPiece { ty: *ty, color: Color::Black, sq: 56 + f as u8, has_moved: false });
        }
        for f in 0..8u8 {
            pieces.push(BoardPiece { ty: Pawn, color: Color::White, sq: 8 + f, has_moved: false });
            pieces.push(BoardPiece { ty: Pawn, color: Color::Black, sq: 48 + f, has_moved: false });
        }
        Board { pieces }
    }
}

fn delta(from: u8, to: u8) -> (i8, i8) {
    (file(to) - file(from), rank(to) - rank(from))
}

fn sq_at(f: i8, r: i8) -> u8 { (r * 8 + f) as u8 }

/// Squares strictly between from and to are empty (straight or diagonal lines).
fn path_clear(board: &Board, from: u8, to: u8) -> bool {
    let (df, dr) = delta(from, to);
    let steps = df.abs().max(dr.abs());
    let (fs, rs) = (df.signum(), dr.signum());
    (1..steps).all(|i| board.at(sq_at(file(from) + fs * i, rank(from) + rs * i)).is_none())
}

fn pawn_dir(color: Color) -> i8 { if color == Color::White { 1 } else { -1 } }

/// Does piece `p` attack square `to`? (Capture geometry: pawn diagonals only.)
fn attacks(board: &Board, p: &BoardPiece, to: u8) -> bool {
    if p.sq == to { return false; }
    let (df, dr) = delta(p.sq, to);
    match p.ty {
        PieceType::Pawn => df.abs() == 1 && dr == pawn_dir(p.color),
        PieceType::Knight => matches!((df.abs(), dr.abs()), (1, 2) | (2, 1)),
        PieceType::Bishop => df.abs() == dr.abs() && path_clear(board, p.sq, to),
        PieceType::Rook => (df == 0) != (dr == 0) && path_clear(board, p.sq, to),
        PieceType::Queen => (df.abs() == dr.abs() || (df == 0) != (dr == 0)) && path_clear(board, p.sq, to),
        PieceType::King => df.abs() <= 1 && dr.abs() <= 1,
    }
}

/// Movement geometry + blocking. Caller guarantees: to != from, dest is not own piece.
fn pseudo_legal(board: &Board, p: &BoardPiece, to: u8) -> Result<(), MoveError> {
    let (df, dr) = delta(p.sq, to);
    match p.ty {
        PieceType::Pawn => {
            let dir = pawn_dir(p.color);
            if df == 0 {
                if board.at(to).is_some() { return Err(MoveError::PathBlocked); }
                if dr == dir { return Ok(()); }
                if dr == 2 * dir && !p.has_moved {
                    return if board.at(sq_at(file(p.sq), rank(p.sq) + dir)).is_some() {
                        Err(MoveError::PathBlocked)
                    } else { Ok(()) };
                }
                Err(MoveError::IllegalForPiece)
            } else if df.abs() == 1 && dr == dir {
                // diagonal: capture only
                if board.at(to).is_some() { Ok(()) } else { Err(MoveError::IllegalForPiece) }
            } else {
                Err(MoveError::IllegalForPiece)
            }
        }
        PieceType::Knight => {
            if matches!((df.abs(), dr.abs()), (1, 2) | (2, 1)) { Ok(()) } else { Err(MoveError::IllegalForPiece) }
        }
        PieceType::Bishop => {
            if df.abs() != dr.abs() || df == 0 { return Err(MoveError::IllegalForPiece); }
            if path_clear(board, p.sq, to) { Ok(()) } else { Err(MoveError::PathBlocked) }
        }
        PieceType::Rook => {
            if (df == 0) == (dr == 0) { return Err(MoveError::IllegalForPiece); }
            if path_clear(board, p.sq, to) { Ok(()) } else { Err(MoveError::PathBlocked) }
        }
        PieceType::Queen => {
            if !(df.abs() == dr.abs() && df != 0) && !((df == 0) != (dr == 0)) {
                return Err(MoveError::IllegalForPiece);
            }
            if path_clear(board, p.sq, to) { Ok(()) } else { Err(MoveError::PathBlocked) }
        }
        PieceType::King => {
            if df.abs() <= 1 && dr.abs() <= 1 { Ok(()) } else { Err(MoveError::IllegalForPiece) }
        }
    }
}

pub fn is_legal_move(board: &Board, from: u8, to: u8, mover: Color) -> Result<MoveOutcome, MoveError> {
    if from >= 64 || to >= 64 || from == to { return Err(MoveError::BadDestination); }
    let p = board.at(from).ok_or(MoveError::NoPiece)?;
    if p.color != mover { return Err(MoveError::NotYours); }
    if let Some(d) = board.at(to) {
        if d.color == mover { return Err(MoveError::OwnPieceAtDest); }
    }

    let (df, dr) = delta(from, to);
    let outcome = if p.ty == PieceType::King && df.abs() == 2 && dr == 0 {
        // Castling: king moves two files toward an unmoved rook.
        if p.has_moved { return Err(MoveError::BadCastle); }
        let r = rank(from);
        let (rook_from, rook_to, between, cross) = if df > 0 {
            (sq_at(7, r), sq_at(5, r), [sq_at(5, r), sq_at(6, r), sq_at(6, r)], sq_at(5, r))
        } else {
            (sq_at(0, r), sq_at(3, r), [sq_at(1, r), sq_at(2, r), sq_at(3, r)], sq_at(3, r))
        };
        let rook_ok = board.at(rook_from)
            .map(|rp| rp.ty == PieceType::Rook && rp.color == mover && !rp.has_moved)
            .unwrap_or(false);
        if !rook_ok { return Err(MoveError::BadCastle); }
        if between.iter().any(|&s| board.at(s).is_some()) { return Err(MoveError::BadCastle); }
        if in_check(board, mover) { return Err(MoveError::BadCastle); }
        if is_attacked(board, cross, mover.other()) { return Err(MoveError::BadCastle); }
        MoveOutcome { captured_sq: None, rook_move: Some((rook_from, rook_to)), promotes: false }
    } else {
        pseudo_legal(board, p, to)?;
        let last_rank = if mover == Color::White { 7 } else { 0 };
        MoveOutcome {
            captured_sq: board.at(to).map(|_| to),
            rook_move: None,
            promotes: p.ty == PieceType::Pawn && rank(to) == last_rank,
        }
    };

    // King safety: simulate. Covers pins, moving into check, and check-freeze.
    let mut sim = board.clone();
    apply_move(&mut sim, from, to, &outcome);
    if in_check(&sim, mover) { return Err(MoveError::LeavesKingAttacked); }
    Ok(outcome)
}

pub fn apply_move(board: &mut Board, from: u8, to: u8, outcome: &MoveOutcome) {
    if let Some(cs) = outcome.captured_sq {
        board.pieces.retain(|p| p.sq != cs);
    }
    if let Some(p) = board.pieces.iter_mut().find(|p| p.sq == from) {
        p.sq = to;
        p.has_moved = true;
        if outcome.promotes { p.ty = PieceType::Queen; }
    }
    if let Some((rf, rt)) = outcome.rook_move {
        if let Some(rp) = board.pieces.iter_mut().find(|p| p.sq == rf) {
            rp.sq = rt;
            rp.has_moved = true;
        }
    }
}

pub fn is_attacked(board: &Board, sq: u8, by: Color) -> bool {
    board.pieces.iter().filter(|p| p.color == by).any(|p| attacks(board, p, sq))
}

pub fn in_check(board: &Board, color: Color) -> bool {
    board.pieces.iter()
        .find(|p| p.ty == PieceType::King && p.color == color)
        .map(|k| is_attacked(board, k.sq, color.other()))
        .unwrap_or(false)
}

/// Any legal move at all for `color`? Ignores cooldowns by design — mate is positional.
pub fn has_any_escape(board: &Board, color: Color) -> bool {
    let froms: Vec<u8> = board.pieces.iter().filter(|p| p.color == color).map(|p| p.sq).collect();
    froms.iter().any(|&f| (0..64u8).any(|t| is_legal_move(board, f, t, color).is_ok()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use Color::*;
    use PieceType::*;

    /// "e2" → square index
    fn s(n: &str) -> u8 {
        let b = n.as_bytes();
        (b[1] - b'1') * 8 + (b[0] - b'a')
    }

    fn board_with(pieces: &[(PieceType, Color, &str, bool)]) -> Board {
        Board {
            pieces: pieces.iter()
                .map(|(ty, c, sq, m)| BoardPiece { ty: *ty, color: *c, sq: s(sq), has_moved: *m })
                .collect(),
        }
    }

    #[test]
    fn starting_position_is_correct() {
        let b = Board::starting();
        assert_eq!(b.pieces.len(), 32);
        assert_eq!(b.at(s("e1")).unwrap().ty, King);
        assert_eq!(b.at(s("e8")).unwrap().ty, King);
        assert_eq!(b.at(s("d1")).unwrap().ty, Queen);
        assert_eq!(b.at(s("a1")).unwrap().ty, Rook);
        assert_eq!(b.at(s("e2")).unwrap().ty, Pawn);
        assert_eq!(b.at(s("e7")).unwrap().color, Black);
    }

    #[test]
    fn pawn_single_and_double_push() {
        let b = Board::starting();
        assert!(is_legal_move(&b, s("e2"), s("e3"), White).is_ok());
        assert!(is_legal_move(&b, s("e2"), s("e4"), White).is_ok());
        assert!(is_legal_move(&b, s("e7"), s("e5"), Black).is_ok());
    }

    #[test]
    fn pawn_double_push_only_when_unmoved() {
        let b = board_with(&[
            (Pawn, White, "e3", true),
            (King, White, "a1", true), (King, Black, "h8", true),
        ]);
        assert_eq!(is_legal_move(&b, s("e3"), s("e5"), White).unwrap_err(), MoveError::IllegalForPiece);
        assert!(is_legal_move(&b, s("e3"), s("e4"), White).is_ok());
    }

    #[test]
    fn pawn_cannot_push_through_blocker() {
        let mut b = Board::starting();
        b.pieces.push(BoardPiece { ty: Knight, color: Black, sq: s("a3"), has_moved: true });
        assert_eq!(is_legal_move(&b, s("a2"), s("a3"), White).unwrap_err(), MoveError::PathBlocked);
        assert_eq!(is_legal_move(&b, s("a2"), s("a4"), White).unwrap_err(), MoveError::PathBlocked);
    }

    #[test]
    fn pawn_cannot_capture_forward() {
        let mut b = Board::starting();
        b.pieces.push(BoardPiece { ty: Knight, color: Black, sq: s("e3"), has_moved: true });
        assert_eq!(is_legal_move(&b, s("e2"), s("e3"), White).unwrap_err(), MoveError::PathBlocked);
    }

    #[test]
    fn pawn_captures_diagonally_only_with_enemy_present() {
        let mut b = Board::starting();
        // empty diagonal: no capture move
        assert_eq!(is_legal_move(&b, s("e2"), s("d3"), White).unwrap_err(), MoveError::IllegalForPiece);
        b.pieces.push(BoardPiece { ty: Knight, color: Black, sq: s("d3"), has_moved: true });
        let out = is_legal_move(&b, s("e2"), s("d3"), White).unwrap();
        assert_eq!(out.captured_sq, Some(s("d3")));
    }

    #[test]
    fn pawn_cannot_move_backwards_or_sideways() {
        let b = board_with(&[
            (Pawn, White, "e4", true),
            (King, White, "a1", true), (King, Black, "h8", true),
        ]);
        assert_eq!(is_legal_move(&b, s("e4"), s("e3"), White).unwrap_err(), MoveError::IllegalForPiece);
        assert_eq!(is_legal_move(&b, s("e4"), s("d4"), White).unwrap_err(), MoveError::IllegalForPiece);
    }

    #[test]
    fn knight_jumps_over_pieces() {
        let b = Board::starting();
        assert!(is_legal_move(&b, s("g1"), s("f3"), White).is_ok());
        assert!(is_legal_move(&b, s("b1"), s("c3"), White).is_ok());
        assert_eq!(is_legal_move(&b, s("b1"), s("b3"), White).unwrap_err(), MoveError::IllegalForPiece);
    }

    #[test]
    fn sliders_are_blocked_by_pieces() {
        let b = Board::starting();
        assert_eq!(is_legal_move(&b, s("f1"), s("b5"), White).unwrap_err(), MoveError::PathBlocked);
        assert_eq!(is_legal_move(&b, s("a1"), s("a5"), White).unwrap_err(), MoveError::PathBlocked);
        assert_eq!(is_legal_move(&b, s("d1"), s("d4"), White).unwrap_err(), MoveError::PathBlocked);
    }

    #[test]
    fn slider_moves_when_path_clear() {
        let b = board_with(&[
            (Bishop, White, "c1", false), (Rook, White, "h1", false), (Queen, White, "d1", false),
            (King, White, "a1", true), (King, Black, "h8", true),
        ]);
        assert!(is_legal_move(&b, s("c1"), s("g5"), White).is_ok());
        assert!(is_legal_move(&b, s("h1"), s("h7"), White).is_ok());
        assert!(is_legal_move(&b, s("d1"), s("d8"), White).is_ok());
        assert!(is_legal_move(&b, s("d1"), s("h5"), White).is_ok());
        // non-line queen move is illegal
        assert_eq!(is_legal_move(&b, s("d1"), s("e3"), White).unwrap_err(), MoveError::IllegalForPiece);
    }

    #[test]
    fn king_moves_one_step() {
        let b = board_with(&[
            (King, White, "e4", true), (King, Black, "a8", true),
        ]);
        assert!(is_legal_move(&b, s("e4"), s("e5"), White).is_ok());
        assert!(is_legal_move(&b, s("e4"), s("d3"), White).is_ok());
        assert_eq!(is_legal_move(&b, s("e4"), s("e6"), White).unwrap_err(), MoveError::IllegalForPiece);
    }

    #[test]
    fn basic_rejections() {
        let b = Board::starting();
        assert_eq!(is_legal_move(&b, s("e4"), s("e5"), White).unwrap_err(), MoveError::NoPiece);
        assert_eq!(is_legal_move(&b, s("e7"), s("e5"), White).unwrap_err(), MoveError::NotYours);
        assert_eq!(is_legal_move(&b, s("a1"), s("a2"), White).unwrap_err(), MoveError::OwnPieceAtDest);
        assert_eq!(is_legal_move(&b, s("e2"), s("e2"), White).unwrap_err(), MoveError::BadDestination);
    }

    #[test]
    fn pinned_piece_cannot_move() {
        let b = board_with(&[
            (King, White, "e1", false), (Rook, White, "e2", true),
            (Rook, Black, "e8", true), (King, Black, "a8", true),
        ]);
        // rook is pinned to the king on the e-file
        assert_eq!(is_legal_move(&b, s("e2"), s("d2"), White).unwrap_err(), MoveError::LeavesKingAttacked);
        // sliding along the pin is fine
        assert!(is_legal_move(&b, s("e2"), s("e5"), White).is_ok());
    }

    #[test]
    fn while_in_check_only_resolving_moves_are_legal() {
        let b = board_with(&[
            (King, White, "e1", false), (Pawn, White, "a2", false), (Rook, White, "d4", true),
            (Rook, Black, "e8", true), (King, Black, "a8", true),
        ]);
        assert!(in_check(&b, White));
        // unrelated pawn move leaves king attacked
        assert_eq!(is_legal_move(&b, s("a2"), s("a3"), White).unwrap_err(), MoveError::LeavesKingAttacked);
        // stepping off the file escapes
        assert!(is_legal_move(&b, s("e1"), s("d1"), White).is_ok());
        // blocking the check is legal
        assert!(is_legal_move(&b, s("d4"), s("e4"), White).is_ok());
    }

    #[test]
    fn cannot_move_king_adjacent_to_enemy_king() {
        let b = board_with(&[
            (King, White, "e4", true), (King, Black, "e6", true),
        ]);
        assert_eq!(is_legal_move(&b, s("e4"), s("e5"), White).unwrap_err(), MoveError::LeavesKingAttacked);
    }

    #[test]
    fn castling_kingside_works() {
        let b = board_with(&[
            (King, White, "e1", false), (Rook, White, "h1", false),
            (King, Black, "e8", false),
        ]);
        let out = is_legal_move(&b, s("e1"), s("g1"), White).unwrap();
        assert_eq!(out.rook_move, Some((s("h1"), s("f1"))));
        let mut b2 = b.clone();
        apply_move(&mut b2, s("e1"), s("g1"), &out);
        assert_eq!(b2.at(s("g1")).unwrap().ty, King);
        assert_eq!(b2.at(s("f1")).unwrap().ty, Rook);
    }

    #[test]
    fn castling_queenside_works() {
        let b = board_with(&[
            (King, White, "e1", false), (Rook, White, "a1", false),
            (King, Black, "e8", false),
        ]);
        let out = is_legal_move(&b, s("e1"), s("c1"), White).unwrap();
        assert_eq!(out.rook_move, Some((s("a1"), s("d1"))));
    }

    #[test]
    fn castling_rejected_when_invalid() {
        // king has moved
        let b1 = board_with(&[
            (King, White, "e1", true), (Rook, White, "h1", false), (King, Black, "e8", false),
        ]);
        assert_eq!(is_legal_move(&b1, s("e1"), s("g1"), White).unwrap_err(), MoveError::BadCastle);
        // path blocked
        let b2 = board_with(&[
            (King, White, "e1", false), (Rook, White, "h1", false),
            (Bishop, White, "f1", false), (King, Black, "e8", false),
        ]);
        assert_eq!(is_legal_move(&b2, s("e1"), s("g1"), White).unwrap_err(), MoveError::BadCastle);
        // king currently in check
        let b3 = board_with(&[
            (King, White, "e1", false), (Rook, White, "h1", false),
            (Rook, Black, "e8", true), (King, Black, "a8", true),
        ]);
        assert_eq!(is_legal_move(&b3, s("e1"), s("g1"), White).unwrap_err(), MoveError::BadCastle);
        // king crosses an attacked square (f1 covered by rook on f8)
        let b4 = board_with(&[
            (King, White, "e1", false), (Rook, White, "h1", false),
            (Rook, Black, "f8", true), (King, Black, "a8", true),
        ]);
        assert_eq!(is_legal_move(&b4, s("e1"), s("g1"), White).unwrap_err(), MoveError::BadCastle);
        // no rook there
        let b5 = board_with(&[
            (King, White, "e1", false), (King, Black, "e8", false),
        ]);
        assert_eq!(is_legal_move(&b5, s("e1"), s("g1"), White).unwrap_err(), MoveError::BadCastle);
    }

    #[test]
    fn promotion_flags_and_applies() {
        let b = board_with(&[
            (Pawn, White, "a7", true),
            (King, White, "e1", true), (King, Black, "h8", true),
        ]);
        let out = is_legal_move(&b, s("a7"), s("a8"), White).unwrap();
        assert!(out.promotes);
        let mut b2 = b.clone();
        apply_move(&mut b2, s("a7"), s("a8"), &out);
        assert_eq!(b2.at(s("a8")).unwrap().ty, Queen);
    }

    #[test]
    fn apply_move_capture_removes_piece() {
        let mut b = Board::starting();
        b.pieces.push(BoardPiece { ty: Knight, color: Black, sq: s("d3"), has_moved: true });
        let n = b.pieces.len();
        let out = is_legal_move(&b, s("e2"), s("d3"), White).unwrap();
        apply_move(&mut b, s("e2"), s("d3"), &out);
        assert_eq!(b.pieces.len(), n - 1);
        let p = b.at(s("d3")).unwrap();
        assert_eq!((p.ty, p.color), (Pawn, White));
        assert!(p.has_moved);
    }

    #[test]
    fn back_rank_mate_has_no_escape() {
        let b = board_with(&[
            (King, Black, "h8", true), (Pawn, Black, "g7", true), (Pawn, Black, "h7", true),
            (Rook, White, "a8", true), (King, White, "a1", true),
        ]);
        assert!(in_check(&b, Black));
        assert!(!has_any_escape(&b, Black));
    }

    #[test]
    fn blocking_piece_means_escape_exists() {
        let b = board_with(&[
            (King, Black, "h8", true), (Pawn, Black, "g7", true), (Pawn, Black, "h7", true),
            (Rook, Black, "b2", true),
            (Rook, White, "a8", true), (King, White, "a1", true),
        ]);
        assert!(in_check(&b, Black));
        assert!(has_any_escape(&b, Black)); // Rb2-b8 blocks
    }

    #[test]
    fn attack_detection() {
        let b = board_with(&[
            (Pawn, White, "e4", true), (Knight, White, "g1", false),
            (King, White, "a1", true), (King, Black, "h8", true),
        ]);
        assert!(is_attacked(&b, s("d5"), White));  // pawn diagonal
        assert!(is_attacked(&b, s("f5"), White));
        assert!(!is_attacked(&b, s("e5"), White)); // pawn push is not an attack
        assert!(is_attacked(&b, s("f3"), White));  // knight
    }
}
