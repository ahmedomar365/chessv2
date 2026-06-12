/**
 * Client-side mirror of the server rules engine (server/src/rules.rs) —
 * used ONLY for UX (legal-target hints, drag affordances). The SpacetimeDB
 * module is the sole authority; disagreements resolve in the server's favor.
 *
 * Squares are 0..63, a1=0, h8=63. ty: 0 P 1 N 2 B 3 R 4 Q 5 K. color: 0 white 1 black.
 */

export interface LPiece {
  ty: number;
  color: number;
  sq: number;
  hasMoved: boolean;
}

const file = (sq: number) => sq % 8;
const rank = (sq: number) => Math.floor(sq / 8);

const at = (board: LPiece[], sq: number) => board.find((p) => p.sq === sq);

function pathClear(board: LPiece[], from: number, to: number): boolean {
  const df = file(to) - file(from);
  const dr = rank(to) - rank(from);
  const steps = Math.max(Math.abs(df), Math.abs(dr));
  const fs = Math.sign(df);
  const rs = Math.sign(dr);
  for (let i = 1; i < steps; i++) {
    if (at(board, (rank(from) + rs * i) * 8 + file(from) + fs * i)) return false;
  }
  return true;
}

const pawnDir = (color: number) => (color === 0 ? 1 : -1);

/** Does piece p attack square `to`? (capture geometry) */
function attacks(board: LPiece[], p: LPiece, to: number): boolean {
  if (p.sq === to) return false;
  const df = file(to) - file(p.sq);
  const dr = rank(to) - rank(p.sq);
  const adf = Math.abs(df);
  const adr = Math.abs(dr);
  switch (p.ty) {
    case 0: return adf === 1 && dr === pawnDir(p.color);
    case 1: return (adf === 1 && adr === 2) || (adf === 2 && adr === 1);
    case 2: return adf === adr && pathClear(board, p.sq, to);
    case 3: return (df === 0) !== (dr === 0) && pathClear(board, p.sq, to);
    case 4: return (adf === adr || (df === 0) !== (dr === 0)) && pathClear(board, p.sq, to);
    default: return adf <= 1 && adr <= 1;
  }
}

export function isAttacked(board: LPiece[], sq: number, by: number): boolean {
  return board.some((p) => p.color === by && attacks(board, p, sq));
}

export function inCheck(board: LPiece[], color: number): boolean {
  const king = board.find((p) => p.ty === 5 && p.color === color);
  return king ? isAttacked(board, king.sq, 1 - color) : false;
}

function pseudoLegal(board: LPiece[], p: LPiece, to: number): boolean {
  const df = file(to) - file(p.sq);
  const dr = rank(to) - rank(p.sq);
  const adf = Math.abs(df);
  const adr = Math.abs(dr);
  const dest = at(board, to);
  switch (p.ty) {
    case 0: {
      const dir = pawnDir(p.color);
      if (df === 0) {
        if (dest) return false;
        if (dr === dir) return true;
        if (dr === 2 * dir && !p.hasMoved) return !at(board, (rank(p.sq) + dir) * 8 + file(p.sq));
        return false;
      }
      return adf === 1 && dr === dir && !!dest;
    }
    case 1: return (adf === 1 && adr === 2) || (adf === 2 && adr === 1);
    case 2: return adf === adr && adf !== 0 && pathClear(board, p.sq, to);
    case 3: return (df === 0) !== (dr === 0) && pathClear(board, p.sq, to);
    case 4: return ((adf === adr && adf !== 0) || (df === 0) !== (dr === 0)) && pathClear(board, p.sq, to);
    default: return adf <= 1 && adr <= 1;
  }
}

function applySim(board: LPiece[], from: number, to: number, rookMove?: [number, number]): LPiece[] {
  const next = board.filter((p) => p.sq !== to).map((p) => ({ ...p }));
  const mover = next.find((p) => p.sq === from);
  if (mover) {
    mover.sq = to;
    mover.hasMoved = true;
  }
  if (rookMove) {
    const rook = next.find((p) => p.sq === rookMove[0]);
    if (rook) {
      rook.sq = rookMove[1];
      rook.hasMoved = true;
    }
  }
  return next;
}

/** Mirrors rules.rs is_legal_move; returns true if the move would be accepted. */
export function isLegal(board: LPiece[], from: number, to: number, mover: number): boolean {
  if (from === to || from < 0 || from > 63 || to < 0 || to > 63) return false;
  const p = at(board, from);
  if (!p || p.color !== mover) return false;
  const dest = at(board, to);
  if (dest && dest.color === mover) return false;

  const df = file(to) - file(p.sq);
  const dr = rank(to) - rank(p.sq);

  // castling
  if (p.ty === 5 && Math.abs(df) === 2 && dr === 0) {
    if (p.hasMoved) return false;
    const r = rank(from);
    const kingside = df > 0;
    const rookFrom = r * 8 + (kingside ? 7 : 0);
    const rookTo = r * 8 + (kingside ? 5 : 3);
    const between = kingside ? [r * 8 + 5, r * 8 + 6] : [r * 8 + 1, r * 8 + 2, r * 8 + 3];
    const cross = r * 8 + (kingside ? 5 : 3);
    const rook = at(board, rookFrom);
    if (!rook || rook.ty !== 3 || rook.color !== mover || rook.hasMoved) return false;
    if (between.some((s) => at(board, s))) return false;
    if (inCheck(board, mover)) return false;
    if (isAttacked(board, cross, 1 - mover)) return false;
    return !inCheck(applySim(board, from, to, [rookFrom, rookTo]), mover);
  }

  if (!pseudoLegal(board, p, to)) return false;
  return !inCheck(applySim(board, from, to), mover);
}

/** All legal destinations for the piece at `from` (UX hints). */
export function legalTargets(board: LPiece[], from: number, mover: number): number[] {
  const out: number[] = [];
  for (let to = 0; to < 64; to++) if (isLegal(board, from, to, mover)) out.push(to);
  return out;
}
