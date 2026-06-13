import { Timestamp } from 'spacetimedb';
import type { Piece } from '../module_bindings/types';

/** Rebuild Piece-shaped rows from a 64-char snapshot string (replays, delayed spectate). */
export function piecesFromSnapshot(snap: string, gameId: bigint): Piece[] {
  const out: Piece[] = [];
  for (let sq = 0; sq < 64; sq++) {
    const ch = snap[sq];
    if (!ch || ch === '.') continue;
    const ty = { p: 0, n: 1, b: 2, r: 3, q: 4, k: 5 }[ch.toLowerCase()] ?? 5;
    out.push({
      pieceId: BigInt(sq + 1),
      gameId,
      ty,
      color: ch === ch.toUpperCase() ? 0 : 1,
      sq,
      hasMoved: false,
      cooldownUntil: new Timestamp(0n),
      shielded: false,
    } as Piece);
  }
  return out;
}
