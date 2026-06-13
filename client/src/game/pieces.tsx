/**
 * Hand-sculpted piece set — staunton-inspired silhouettes with painted
 * pseudo-3D volume (highlight + core-shadow layers that adapt to any theme).
 * Drawn in a 100×100 viewBox. Themes recolor via gradients; the light always
 * falls from the upper-left.
 */

import type { ReactElement } from 'react';

export type PieceTy = 0 | 1 | 2 | 3 | 4 | 5; // pawn knight bishop rook queen king

/** shared plinth — two stacked discs with a top face */
const Base = (
  <>
    <ellipse cx="50" cy="86" rx="26" ry="7.5" />
    <ellipse cx="50" cy="82.5" rx="26" ry="7.5" className="p-top" />
    <ellipse cx="50" cy="79" rx="19" ry="5.5" />
    <ellipse cx="50" cy="76.5" rx="19" ry="5.5" className="p-top" />
  </>
);

const GLYPHS: Record<PieceTy, ReactElement> = {
  // ---- Pawn: sphere on a turned stem ----
  0: (
    <>
      {Base}
      <path d="M50 42 C40 42 37 49 39 56 C40 61 43 65 41 70 C39.5 74 43 77 50 77 C57 77 60.5 74 59 70 C57 65 60 61 61 56 C63 49 60 42 50 42 Z" />
      <ellipse cx="50" cy="42.5" rx="13.5" ry="4.5" />
      <ellipse cx="50" cy="40.8" rx="13.5" ry="4.5" className="p-top" />
      <circle cx="50" cy="28" r="12.5" />
      {/* volume */}
      <circle cx="45.5" cy="23.5" r="5" className="p-hi" />
      <path d="M58 20 A12.5 12.5 0 0 1 58 36 A19 19 0 0 0 58 20 Z" className="p-sh" />
      <path d="M43 58 C44 64 46 68 45 72 L49 73 C47 68 46 62 46.5 57 Z" className="p-hi" />
    </>
  ),

  // ---- Knight: mustang transplanted from the 3D asset sets ----
  1: (
    <>
      {Base}
      <g transform="translate(-6 0)">
      <path d="M76.4 77 L76.6 67 Q77.4 51.6 71.6 36.2 Q68.2 29.4 62 27.2 L58.7 17.2 C58.2 15.6 56.4 15.6 55.8 17.2 L53.3 24.9 L51.9 24.8 L48.8 14.7 C48.3 13.1 46.4 13.1 45.9 14.8 L43.6 26.4 L26.5 28.2 Q21.7 30.4 23.2 35.4 Q30.3 47.6 47.6 51.6 Q43.8 63.7 49.5 77 Z" />
      {/* mouth, nostril, eye, cheek */}
      <path d="M23.6 38 Q28 40.6 32.6 41.4" fill="none" strokeWidth="2" />
      <circle cx="27.2" cy="33.2" r="1.7" className="p-eye" />
      <path d="M41.5 31.6 a2.6 2 -15 1 0 0.1 0" className="p-eye" />
      <path d="M37 45.5 Q44 42 47.8 35.5" fill="none" strokeWidth="2" opacity="0.4" />
      {/* mane band down the crest */}
      <path d="M62.5 28.5 Q67.4 32.8 69.6 39.6 Q71.8 48 71.4 58 Q71.2 67 70 75.5 L74.2 75.8 Q75.6 62.5 74.4 50.5 Q73.2 39.5 68.8 32.6 Q66.4 29.4 64.6 28.2 Z" className="p-sh" />
      <path d="M62.5 28.5 Q67.4 32.8 69.6 39.6 Q71.8 48 71.4 58 Q71.2 67 70 75.5" fill="none" strokeWidth="2" opacity="0.5" />
      {/* chest highlight */}
      <path d="M46.2 53 Q44.4 62 47.6 73 L50.8 73 Q47.8 62.5 49.4 53.6 Z" className="p-hi" />
      </g>
    </>
  ),

  // ---- Bishop: mitre with slit + collar ----
  2: (
    <>
      {Base}
      <path d="M42 77 C40 71 43 67 44.5 62 L55.5 62 C57 67 60 71 58 77 Z" />
      <ellipse cx="50" cy="62" rx="9.5" ry="3.4" />
      {/* mitre body */}
      <path d="M50 21 C61 29 66.5 39 66 48 C65.6 55.5 59 60.5 50 60.5 C41 60.5 34.4 55.5 34 48 C33.5 39 39 29 50 21 Z" />
      {/* slit */}
      <path d="M47.8 30 L52.2 30 L52.2 44 L47.8 44 Z M42.5 36.2 L57.5 36.2 L57.5 40.2 L42.5 40.2 Z" className="p-eye" />
      <circle cx="50" cy="14.5" r="5.5" />
      {/* volume */}
      <path d="M44 26.5 C38.5 33 36 41 36.5 48 C36.8 52.5 39.5 56 43.5 58 C40 54.5 38.6 50.5 38.5 46 C38.4 39 41 31.5 45.8 25.2 Z" className="p-hi" />
      <path d="M56 25.5 C61.5 32 64 40.5 63.6 48 C63.3 53 60.3 56.8 56 58.6 C59.7 54.9 61.3 50.6 61.4 46 C61.5 39 58.9 31.5 54.2 25.2 Z" className="p-sh" />
      <circle cx="48" cy="12.5" r="2" className="p-hi" />
    </>
  ),

  // ---- Rook: turreted tower ----
  3: (
    <>
      {Base}
      <path d="M37 74 L39.5 38 L60.5 38 L63 74 Z" />
      <path d="M34 24 L34 13 L42.5 13 L42.5 19 L46.5 19 L46.5 13 L53.5 13 L53.5 19 L57.5 19 L57.5 13 L66 13 L66 24 C66 28 63 30.5 60.5 31.5 L60.8 36 L39.2 36 L39.5 31.5 C37 30.5 34 28 34 24 Z" />
      <path d="M38 36.6 h24 v2.4 h-24 z" className="p-top" />
      {/* battlement top face */}
      <ellipse cx="50" cy="13.6" rx="14.5" ry="2.6" className="p-top" />
      {/* volume: cylinder shading */}
      <path d="M41.5 39 L39.5 73 L43.5 73 L45 39 Z" className="p-hi" />
      <path d="M58.5 39 L61.5 73 L56.8 73 L55.8 39 Z" className="p-sh" />
      <path d="M36.5 15 L36.5 24 C36.5 26.8 38.5 28.8 40.6 30 L40.8 27 C39 25.8 38.3 24.4 38.3 22.6 L38.3 15 Z" className="p-hi" />
    </>
  ),

  // ---- Queen: coronet with orbs over a waisted gown ----
  4: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      {/* gown */}
      <path d="M50 26 C57 26 62.5 28.5 64.5 33 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L35.5 33 C37.5 28.5 43 26 50 26 Z" />
      {/* coronet */}
      <path d="M35.8 32 L29 17.5 L40 25.5 L46 13.5 L50 24.5 L54 13.5 L60 25.5 L71 17.5 L64.2 32 C60 28.5 55.5 27 50 27 C44.5 27 40 28.5 35.8 32 Z" />
      <circle cx="28.5" cy="14.5" r="3.4" />
      <circle cx="45.8" cy="10.5" r="3.4" />
      <circle cx="54.2" cy="10.5" r="3.4" />
      <circle cx="71.5" cy="14.5" r="3.4" />
      {/* volume */}
      <path d="M41 32 C39.8 34 39.3 36 39.7 38.5 L43.4 56.5 C44 59 45.5 60.4 47.5 61 C46 59.8 45.2 58.2 44.8 56 L41.6 38 C41.3 35.8 41.5 33.8 42.6 31.8 Z" className="p-hi" />
      <path d="M59 32 C60.2 34 60.7 36 60.3 38.5 L56.6 56.5 C56 59 54.5 60.4 52.5 61 C54 59.8 54.8 58.2 55.2 56 L58.4 38 C58.7 35.8 58.5 33.8 57.4 31.8 Z" className="p-sh" />
      <circle cx="44.8" cy="9.4" r="1.3" className="p-hi" />
      <circle cx="27.5" cy="13.4" r="1.3" className="p-hi" />
    </>
  ),

  // ---- King: cross above a banded crown and robe ----
  5: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      {/* robe */}
      <path d="M50 30 C58 30 64 33 65.5 38 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L34.5 38 C36 33 42 30 50 30 Z" />
      {/* crown band */}
      <path d="M36.5 38.5 C39 34.5 44 32.2 50 32.2 C56 32.2 61 34.5 63.5 38.5 L62 31.5 C59 28 55 26.3 50 26.3 C45 26.3 41 28 38 31.5 Z" className="p-band" />
      {/* cross */}
      <path d="M47.2 7 L52.8 7 L52.8 12.2 L58 12.2 L58 17.8 L52.8 17.8 L52.8 23 L47.2 23 L47.2 17.8 L42 17.8 L42 12.2 L47.2 12.2 Z" />
      <path d="M44 26.5 L56 26.5 L55 30.5 C53.5 30 51.8 29.8 50 29.8 C48.2 29.8 46.5 30 45 30.5 Z" />
      {/* volume */}
      <path d="M40.5 38 C39.6 39.8 39.4 41.5 40 43.8 L43.8 56.5 C44.4 58.8 45.8 60.2 47.8 61 C46.2 59.6 45.4 58 44.9 56 L41.6 44 C41 41.6 41 39.8 41.8 37.6 Z" className="p-hi" />
      <path d="M59.5 38 C60.4 39.8 60.6 41.5 60 43.8 L56.2 56.5 C55.6 58.8 54.2 60.2 52.2 61 C53.8 59.6 54.6 58 55.1 56 L58.4 44 C59 41.6 59 39.8 58.2 37.6 Z" className="p-sh" />
      <path d="M48.2 8.2 L49.6 8.2 L49.6 21.8 L48.2 21.8 Z" className="p-hi" />
    </>
  ),
};

export function PieceGlyph({ ty, color }: { ty: number; color: number }) {
  const cls = color === 0 ? 'piece-white' : 'piece-black';
  return <g className={`piece-glyph ${cls}`}>{GLYPHS[(ty > 5 ? 5 : ty) as PieceTy]}</g>;
}
