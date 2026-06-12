/**
 * Classic piece set — bold geometric silhouettes, readable at 40px on phones.
 * Drawn in a 100×100 viewBox. This component is the seam where future skin
 * themes plug in (each theme provides its own glyph set).
 */

import type { ReactElement } from 'react';

export type PieceTy = 0 | 1 | 2 | 3 | 4 | 5; // pawn knight bishop rook queen king

const GLYPHS: Record<PieceTy, ReactElement> = {
  // Pawn — ball on a flared base
  0: (
    <>
      <circle cx="50" cy="32" r="13" />
      <path d="M38 50 a12 8 0 0 1 24 0 l4 22 q1 6 -5 6 h-22 q-6 0 -5 -6 z" />
      <path d="M30 82 h40 q5 0 5 6 v4 h-50 v-4 q0 -6 5 -6 z" />
    </>
  ),
  // Knight — horse head profile
  1: (
    <>
      <path d="M34 78 C29 62 36 52 43 44 C48 38 50 31 48 23 L45 15 C44 12 47 10 50 12 L60 21 C73 25 79 36 80 50 C81 61 79 71 78 78 Z" />
      <path d="M52 18 L60 7 C62 4 65 6 64 9 L61 21 Z" />
      <circle cx="59" cy="31" r="2.8" fill="var(--piece-detail)" stroke="none" />
      <path d="M38 47 C36 51 35 55 36 59" fill="none" strokeWidth="2.5" />
      <path d="M28 82 h44 q5 0 5 6 v4 h-54 v-4 q0 -6 5 -6 z" />
    </>
  ),
  // Bishop — mitre with slit
  2: (
    <>
      <circle cx="50" cy="16" r="6" />
      <path d="M50 24 q16 12 16 28 q0 12 -9 16 h-14 q-9 -4 -9 -16 q0 -16 16 -28 z" />
      <path d="M47 36 h6 v16 h-6 z M41 44 h18 v5 h-18 z" fill="var(--piece-detail)" stroke="none" />
      <path d="M36 72 h28 l3 8 h-34 z" />
      <path d="M30 82 h40 q5 0 5 6 v4 h-50 v-4 q0 -6 5 -6 z" />
    </>
  ),
  // Rook — crenellated tower
  3: (
    <>
      <path d="M32 14 h9 v8 h7 v-8 h4 v8 h7 v-8 h9 v16 l-6 6 v32 l6 8 h-36 l6 -8 v-32 l-6 -6 z" />
      <path d="M28 82 h44 q5 0 5 6 v4 h-54 v-4 q0 -6 5 -6 z" />
    </>
  ),
  // Queen — coronet with orbs
  4: (
    <>
      <circle cx="22" cy="22" r="4.5" />
      <circle cx="36" cy="16" r="4.5" />
      <circle cx="50" cy="13" r="4.5" />
      <circle cx="64" cy="16" r="4.5" />
      <circle cx="78" cy="22" r="4.5" />
      <path d="M24 28 l12 -8 l14 -4 l14 4 l12 8 l-7 36 q-1 6 -7 6 h-24 q-6 0 -7 -6 z" />
      <path d="M34 72 h32 l3 8 h-38 z" />
      <path d="M28 82 h44 q5 0 5 6 v4 h-54 v-4 q0 -6 5 -6 z" />
    </>
  ),
  // King — cross-crowned
  5: (
    <>
      <path d="M46 8 h8 v7 h7 v8 h-7 v7 h-8 v-7 h-7 v-8 h7 z" />
      <path d="M30 36 q8 -8 20 -8 q12 0 20 8 l-5 32 q-1 6 -7 6 h-16 q-6 0 -7 -6 z" />
      <path d="M34 72 h32 l3 8 h-38 z" />
      <path d="M28 82 h44 q5 0 5 6 v4 h-54 v-4 q0 -6 5 -6 z" />
    </>
  ),
};

export function PieceGlyph({ ty, color }: { ty: number; color: number }) {
  const cls = color === 0 ? 'piece-white' : 'piece-black';
  return (
    <g className={`piece-glyph ${cls}`}>{GLYPHS[(ty > 5 ? 5 : ty) as PieceTy]}</g>
  );
}
