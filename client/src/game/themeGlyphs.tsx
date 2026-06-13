/**
 * Theme skin glyphs — REAL skins, not chromas. Every theme redesigns each
 * piece around its fantasy (cartridge pawns, seahorse knights, pagoda rooks)
 * while keeping the role instantly readable: pawns small & round-topped,
 * rooks square-topped towers, knights creature profiles, bishops tall split
 * spires, queens spiked crowns, kings the tallest with a crown emblem.
 *
 * All drawn in the shared 100×100 viewBox; fills/strokes come from the army
 * gradients; `p-eye` = detail color, `p-hi`/`p-sh`/`p-top` = sculpt layers.
 */

import type { ReactElement } from 'react';
import { Base } from './glyphParts';
import type { PieceTy } from './pieces';

type GlyphSet = Partial<Record<PieceTy, ReactElement>>;

/* ============================== 1 · SAFARI ============================== */

const safari: GlyphSet = {
  // ostrich egg in a grass nest
  0: (
    <>
      {Base}
      <path d="M34 74 Q38 68 36 63 L42 67 L44 60 L49 66 L53 59 L57 66 L62 61 L61 67 L66 64 Q64 69 66 74 Z" />
      <ellipse cx="50" cy="48" rx="15" ry="19" />
      <ellipse cx="45" cy="40" rx="5" ry="7" className="p-hi" />
      <path d="M60 38 A19 19 0 0 1 60 60 A15 19 0 0 0 60 38 Z" className="p-sh" />
    </>
  ),
  // termite-mound tower
  3: (
    <>
      {Base}
      <path d="M36 74 Q33 58 36 42 L33 40 Q31 30 36 22 L40 22 L41 27 L46 27 L47 21 L53 21 L54 27 L59 27 L60 22 L64 22 Q69 30 67 40 L64 42 Q67 58 64 74 Z" />
      <path d="M46 52 Q44 58 46 64 Q50 66 54 64 Q56 58 54 52 Q50 50 46 52 Z" className="p-eye" />
      <path d="M38 42 Q36 56 38 72 L42 72 Q40 56 42 43 Z" className="p-hi" />
      <path d="M62 42 Q64 56 62 72 L58 72 Q60 56 58 43 Z" className="p-sh" />
    </>
  ),
  // zebra mustang
  1: (
    <>
      {Base}
      <g transform="translate(-6 0)">
        <path d="M76.4 77 L76.6 67 Q77.4 51.6 71.6 36.2 Q68.2 29.4 62 27.2 L58.7 17.2 C58.2 15.6 56.4 15.6 55.8 17.2 L53.3 24.9 L51.9 24.8 L48.8 14.7 C48.3 13.1 46.4 13.1 45.9 14.8 L43.6 26.4 L26.5 28.2 Q21.7 30.4 23.2 35.4 Q30.3 47.6 47.6 51.6 Q43.8 63.7 49.5 77 Z" />
        <circle cx="27.2" cy="33.2" r="1.7" className="p-eye" />
        <path d="M41.5 31.6 a2.6 2 -15 1 0 0.1 0" className="p-eye" />
        {/* zebra stripes */}
        <path d="M56 30 Q58 38 56 46 L60 46 Q62 38 60 30 Z M63 33 Q66 41 65 50 L69 51 Q70 42 67 34 Z M68 44 Q71 52 70 62 L74 62 Q75 52 72 45 Z M66 60 Q67 68 66 75 L70 75 Q71 67 70 60 Z" className="p-sh" />
        <path d="M23.6 38 Q28 40.6 32.6 41.4" fill="none" strokeWidth="2" />
      </g>
    </>
  ),
  // acacia tree
  2: (
    <>
      {Base}
      <path d="M44 74 Q46 62 45 50 L40 44 L47 46 L50 38 L53 46 L60 44 L55 50 Q54 62 56 74 Z" />
      <path d="M22 34 Q26 20 42 17 Q58 13 70 20 Q79 25 77 33 Q74 39 62 40 Q40 42 28 39 Q22 38 22 34 Z" />
      <path d="M48 52 L52 52 L52 66 L48 66 Z" className="p-eye" />
      <path d="M27 32 Q30 23 42 20 Q38 28 36 36 Q30 36 27 32 Z" className="p-hi" />
      <path d="M62 21 Q72 24 74 31 Q70 37 60 38 Q64 30 62 21 Z" className="p-sh" />
    </>
  ),
  // sun-crown queen
  4: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 28 C57 28 62.5 30.5 64.5 35 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L35.5 35 C37.5 30.5 43 28 50 28 Z" />
      <circle cx="50" cy="18" r="8.5" />
      <path d="M50 4 L52 11 L48 11 Z M62 8 L60.5 14.5 L57.5 12.5 Z M38 8 L39.5 14.5 L42.5 12.5 Z M68 19 L61.5 19.5 L62.5 16 Z M32 19 L38.5 19.5 L37.5 16 Z" />
      <circle cx="47" cy="15.5" r="2.6" className="p-hi" />
      <path d="M41 34 L44.5 56 Q45.2 59.5 47.5 61 Q44 60 43 56 L39 35 Z" className="p-hi" />
    </>
  ),
  // tusk-crown king
  5: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 30 C58 30 64 33 65.5 38 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L34.5 38 C36 33 42 30 50 30 Z" />
      <path d="M36.5 38.5 C39 34.5 44 32.2 50 32.2 C56 32.2 61 34.5 63.5 38.5 L62 31.5 C59 28 55 26.3 50 26.3 C45 26.3 41 28 38 31.5 Z" className="p-band" />
      <path d="M38 26 Q33 16 38 7 Q40 14 43 19 Q40 23 38 26 Z" />
      <path d="M62 26 Q67 16 62 7 Q60 14 57 19 Q60 23 62 26 Z" />
      <circle cx="50" cy="16" r="6" />
      <circle cx="48" cy="14" r="2" className="p-hi" />
    </>
  ),
};

/* ============================== 2 · COWBOY ============================== */

const cowboy: GlyphSet = {
  // cartridge pawn
  0: (
    <>
      {Base}
      <path d="M40 74 L40 68 L60 68 L60 74 Z" />
      <path d="M42 68 L42 44 L58 44 L58 68 Z" />
      <path d="M42 44 Q42 30 50 24 Q58 30 58 44 Z" />
      <path d="M41 48 h18 v4 h-18 z" className="p-band" />
      <path d="M44.5 42 Q45 31 50 26.5 L50 42 Z" className="p-hi" />
      <path d="M55 30 Q57.5 36 56 44 L58 44 Q58 34 55 30 Z" className="p-sh" />
    </>
  ),
  // barrel rook
  3: (
    <>
      {Base}
      <path d="M38 74 Q34 56 38 30 L44 30 L44 25 L49 25 L49 30 L51 30 L51 25 L56 25 L56 30 L62 30 Q66 56 62 74 Z" />
      <path d="M36.6 38 H63.4 V42 H36.6 Z" className="p-band" />
      <path d="M35.8 58 H64.2 V62 H35.8 Z" className="p-band" />
      <path d="M44 31 Q42 52 44 73 L47.5 73 Q46 52 47.5 31 Z" className="p-hi" />
      <path d="M56 31 Q58 52 56 73 L52.5 73 Q54 52 52.5 31 Z" className="p-sh" />
    </>
  ),
  // mustang with sheriff hat
  1: (
    <>
      {Base}
      <g transform="translate(-6 0)">
        <path d="M76.4 77 L76.6 67 Q77.4 51.6 71.6 36.2 Q68.2 29.4 62 27.2 L60 21 L46 21.5 L43.6 26.4 L26.5 28.2 Q21.7 30.4 23.2 35.4 Q30.3 47.6 47.6 51.6 Q43.8 63.7 49.5 77 Z" />
        {/* hat */}
        <path d="M40 22 Q39 20.5 41.5 20 Q44 13 49 10.5 Q54.5 8.5 58.5 11 Q61.5 13.5 62 19 Q65.5 19.4 66.5 21 Q67.5 23 63 23.5 Q51 25 43 23.5 Q40.5 23.2 40 22 Z" />
        <path d="M46 20.5 Q47.5 14.5 51.5 12 Q49 16.5 48.8 21 Z" className="p-hi" />
        <circle cx="27.2" cy="33.2" r="1.7" className="p-eye" />
        <path d="M41.5 31.6 a2.6 2 -15 1 0 0.1 0" className="p-eye" />
        <path d="M23.6 38 Q28 40.6 32.6 41.4" fill="none" strokeWidth="2" />
        <path d="M62.5 28.5 Q67.4 32.8 69.6 39.6 Q71.8 48 71.4 58 Q71.2 67 70 75.5 L74.2 75.8 Q75.6 62.5 74.4 50.5 Q73.2 39.5 68.8 32.6 Q66.4 29.4 64.6 28.2 Z" className="p-sh" />
      </g>
    </>
  ),
  // cactus bishop
  2: (
    <>
      {Base}
      <path d="M43 74 Q45 68 44.5 62 L55.5 62 Q55 68 57 74 Z" />
      <path d="M44 62 Q42 40 46 26 Q48 20 50 19 Q52 20 54 26 Q58 40 56 62 Z" />
      <path d="M40 36 Q33 35 32 28 Q32 24 35 24 Q38 24.5 38.5 30 Q39 33 44 34 L44 39 Q41.5 38.5 40 36 Z" />
      <path d="M60 44 Q67 43 68 36 Q68 32 65 32 Q62 32.5 61.5 38 Q61 41 56 42 L56 47 Q58.5 46.5 60 44 Z" />
      <path d="M48.6 32 L51.4 32 L51.4 46 L48.6 46 Z" className="p-eye" />
      <circle cx="50" cy="15" r="4.2" />
      <path d="M50 9.6 L51.4 13 L48.6 13 Z M55 12 L52.8 14.6 L51.6 12.2 Z M45 12 L47.2 14.6 L48.4 12.2 Z" className="p-eye" />
      <path d="M46.5 28 Q44.8 42 45.8 58 L48 58 Q47.2 42 48.6 27 Z" className="p-hi" />
    </>
  ),
  // lasso queen
  4: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 26 C57 26 62.5 28.5 64.5 33 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L35.5 33 C37.5 28.5 43 26 50 26 Z" />
      {/* rope coil on hip */}
      <circle cx="63" cy="46" r="6.5" fill="none" strokeWidth="3" />
      <circle cx="63" cy="46" r="3" fill="none" strokeWidth="2" />
      {/* rope loop crown */}
      <path d="M50 25 Q36 22 38 13 Q40 6.5 50 6.5 Q60 6.5 62 13 Q64 22 50 25 Z" fill="none" strokeWidth="3.4" />
      <circle cx="50" cy="24" r="3.4" />
      <path d="M41 32 L44.5 56 Q45.2 59.5 47.5 61 Q44 60 43 56 L39 33 Z" className="p-hi" />
    </>
  ),
  // sheriff king
  5: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 30 C58 30 64 33 65.5 38 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L34.5 38 C36 33 42 30 50 30 Z" />
      {/* star badge */}
      <path d="M50 36 L52 42 L58 42 L53.2 45.8 L55 52 L50 48.2 L45 52 L46.8 45.8 L42 42 L48 42 Z" className="p-eye" />
      {/* hat crown */}
      <path d="M34 24 Q33 21.5 36.5 21 Q39 21 42 21.2 Q43 12.5 48 10 Q53 8 56.5 11 Q59.5 14 59.5 21 Q63 21 65.5 21.6 Q68 22.4 66.5 24.6 Q60 27.5 50 27.5 Q40 27.5 34 24 Z" />
      <path d="M44.5 20.8 Q45.5 13.8 49.5 11.5 Q47.5 16 47.5 21 Z" className="p-hi" />
    </>
  ),
};

/* ============================ 3 · HALLOWEEN ============================ */

const halloween: GlyphSet = {
  // jack-o-pumpkin
  0: (
    <>
      {Base}
      <path d="M48 35 Q47 29 50 25 L54 25 Q51 29 52 35 Z" />
      <path d="M50 36 Q36 36 34 50 Q33 64 42 70 Q50 74 58 70 Q67 64 66 50 Q64 36 50 36 Z" />
      <path d="M44 38 Q40 50 44 67 L48 69 Q44 52 48 37 Z M56 37 Q60 52 56 69 L52 69.5 Q56 52 52 36.5 Z" fill="none" strokeWidth="2" opacity="0.45" />
      <path d="M42 49 L47 53 L41 53 Z M58 49 L53 53 L59 53 Z M42 60 L46 58 L48 61 L52 58 L54 61 L58 58 L56 64 L44 64 Z" className="p-eye" />
    </>
  ),
  // haunted tower
  3: (
    <>
      {Base}
      <path d="M37 74 L39 40 L35 38 L36 22 L41 24 L42 17 L47 21 L50 13 L54 20 L59 16 L60 24 L65 21 L64 38 L61 40 L63 74 Z" />
      <path d="M46 50 Q46 44 50 43 Q54 44 54 50 L54 58 L46 58 Z" className="p-eye" />
      <path d="M52 62 L56 70 M50 26 L48 34" fill="none" strokeWidth="2" opacity="0.6" />
      <path d="M41 40 L39.5 72 L43 72 L44.5 41 Z" className="p-hi" />
      <path d="M59 40 L61.5 72 L58 72 L57 41 Z" className="p-sh" />
    </>
  ),
  // nightmare steed
  1: (
    <>
      {Base}
      <g transform="translate(-6 0)">
        <path d="M76.4 77 L76.6 67 Q77.4 51.6 71.6 36.2 Q68.2 29.4 62 27.2 L60.5 19 L55 23.5 L52.5 15 L48 22 L45.5 13.5 L43.6 26.4 L26.5 28.2 Q21.7 30.4 23.2 35.4 Q30.3 47.6 47.6 51.6 Q43.8 63.7 49.5 77 Z" />
        {/* hollow eye + fangs */}
        <circle cx="41.5" cy="31.6" r="3" className="p-eye" />
        <path d="M26 36.5 L28 41 L30 36.9 L32.5 41.2 L34.5 37.4" fill="none" strokeWidth="2" />
        {/* flame mane */}
        <path d="M62.5 28.5 Q60 35 65 40 Q61 46 66.5 52 Q63 58 68 64 Q65.5 70 69.5 75.5 L74.2 75.8 Q75.6 62.5 74.4 50.5 Q73.2 39.5 68.8 32.6 Q66.4 29.4 64.6 28.2 Z" className="p-sh" />
      </g>
    </>
  ),
  // ghost bishop
  2: (
    <>
      {Base}
      <path d="M36 74 Q35 52 38 38 Q41 24 50 17 Q59 24 62 38 Q65 52 64 74 L60 68 L56 74 L52 68 L48 74 L44 68 L40 74 Z" />
      <circle cx="45" cy="40" r="3.2" className="p-eye" />
      <circle cx="56" cy="40" r="3.2" className="p-eye" />
      <path d="M46 51 Q50 55 55 51 Q53 57 50 57 Q47 57 46 51 Z" className="p-eye" />
      <path d="M40 38 Q42.5 26 49 19.5 Q44 28 43 40 Q42.5 52 42 66 L39 70 Q38.5 52 40 38 Z" className="p-hi" />
    </>
  ),
  // witch queen
  4: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 28 C57 28 62.5 30.5 64.5 35 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L35.5 35 C37.5 30.5 43 28 50 28 Z" />
      {/* witch hat */}
      <path d="M33 27 Q32 24.5 36 24 Q42 23.2 45 23 Q49 13 57 5 Q59.5 3 59 7 Q57.5 15 56.5 23 Q61 23.4 65 24.4 Q68 25.4 66 27.4 Q58 30.5 50 30.5 Q40 30.5 33 27 Z" />
      <path d="M45.5 24.5 h10 v3.4 h-10 z" className="p-band" />
      <path d="M48.5 25.6 h3.4 v1.6 h-3.4 z" className="p-eye" />
      <path d="M41 34 L44.5 56 Q45.2 59.5 47.5 61 Q44 60 43 56 L39 35 Z" className="p-hi" />
    </>
  ),
  // vampire king
  5: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      {/* high collar */}
      <path d="M36 32 L42 44 L40 56 C41 60 44.5 62 50 62 C55.5 62 59 60 60 56 L58 44 L64 32 L57 36 L50 30 L43 36 Z" />
      {/* bat crown */}
      <path d="M50 8 Q47 12 47.5 16 Q44 13 40 13.5 Q42.5 16.5 43 20 Q46.5 19 48.5 21.5 L50 24 L51.5 21.5 Q53.5 19 57 20 Q57.5 16.5 60 13.5 Q56 13 52.5 16 Q53 12 50 8 Z" />
      <path d="M46 40 L48 45 L50 40 L52 45 L54 40" fill="none" strokeWidth="2" />
      <path d="M40 34.5 L43.5 43 L42 55 Q42.6 58.8 45.5 60.6 Q43 59 42.4 55.6 L44.4 43.4 L41.5 36 Z" className="p-hi" />
    </>
  ),
};

/* ============================ 4 · DEEP OCEAN ============================ */

const ocean: GlyphSet = {
  // pearl in shell
  0: (
    <>
      {Base}
      <path d="M34 72 Q34 60 40 54 L60 54 Q66 60 66 72 Q58 75 50 75 Q42 75 34 72 Z" />
      <path d="M40 55 L36 70 M47 54.5 L45 73 M53 54.5 L55 73 M60 55 L64 70" fill="none" strokeWidth="2" opacity="0.5" />
      <circle cx="50" cy="42" r="12" />
      <circle cx="45.5" cy="38" r="4" className="p-hi" />
      <path d="M58 35 A12 12 0 0 1 58 49 A16 16 0 0 0 58 35 Z" className="p-sh" />
    </>
  ),
  // lighthouse
  3: (
    <>
      {Base}
      <path d="M40 74 L43 36 L57 36 L60 74 Z" />
      <path d="M42.4 44 L57.6 44 L58.2 51 L41.8 51 Z" className="p-band" />
      <path d="M41.2 60 L58.8 60 L59.4 67 L40.6 67 Z" className="p-band" />
      <path d="M41 36 L59 36 L59 32 L41 32 Z" />
      <path d="M44 32 L44 22 L56 22 L56 32 Z" />
      <path d="M46.5 24.5 h7 v5.5 h-7 z" className="p-eye" />
      <path d="M42 22 L58 22 L50 14 Z" />
      <path d="M45 37 L43.5 72 L46.5 72 L47.6 37 Z" className="p-hi" />
    </>
  ),
  // seahorse knight
  1: (
    <>
      {Base}
      <path d="M52 74 Q42 72 40 63 Q38.5 55 45 51 Q41 47 40.5 40 Q40 31 46 25 Q43 24 41 21.5 Q44 20 47 20.4 Q49 14 56 12.5 Q63 11.5 66 16 Q69 21 67 27 Q72 30 72 36 Q72 41 68 44 Q70 49 68.5 55 Q66 64 58 69 Q60 72 58 74 Z" />
      {/* snout + eye */}
      <path d="M41 21.5 Q35 20 31.5 22.5 Q35 25.5 40.5 25.2" fill="none" strokeWidth="3" />
      <circle cx="51" cy="21.5" r="2.4" className="p-eye" />
      {/* dorsal fin spikes */}
      <path d="M66 27 L72.5 25 L68.4 31 L74 31.5 L68.6 36 L73 39 L67.8 40.5" fill="none" strokeWidth="2.4" />
      {/* belly ridges */}
      <path d="M46 32 Q51 33.5 55 32 M45 39 Q51 41 56.5 39 M45.5 46 Q51 48 57 46 M47 53 Q52 55 58 53 M48.5 60 Q53 62 57.5 60" fill="none" strokeWidth="2" opacity="0.55" />
      {/* curled tail */}
      <circle cx="50" cy="65" r="4.5" fill="none" strokeWidth="2.6" />
    </>
  ),
  // coral bishop
  2: (
    <>
      {Base}
      <path d="M43 74 Q45 68 44.5 62 L55.5 62 Q55 68 57 74 Z" />
      <path d="M46 62 Q42 48 45 34 Q47 24 50 19 Q53 24 55 34 Q58 48 54 62 Z" />
      <path d="M44.5 40 Q37 38 36 30 L39.5 31 Q40.5 36 45.2 37.6 Z" />
      <path d="M55.5 46 Q63 44 64 36 L60.5 37 Q59.5 42 54.8 43.6 Z" />
      <path d="M48.6 30 L51.4 30 L51.4 44 L48.6 44 Z" className="p-eye" />
      <circle cx="50" cy="14.5" r="4.5" />
      <circle cx="48.5" cy="13" r="1.6" className="p-hi" />
      <path d="M47 33 Q45.5 47 46.8 60 L49 60 Q48 46 49.4 32 Z" className="p-hi" />
    </>
  ),
  // jellyfish queen
  4: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 26 C57 26 62.5 28.5 64.5 33 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L35.5 33 C37.5 28.5 43 26 50 26 Z" />
      {/* jelly dome crown */}
      <path d="M35 20 Q35 7 50 7 Q65 7 65 20 Q57 23.5 50 23.5 Q43 23.5 35 20 Z" />
      <path d="M38 22.5 Q37 26 38.5 28.5 M44 24 Q43.5 28 45 31 M50 24.5 Q50 29 50 32 M56 24 Q56.5 28 55 31 M62 22.5 Q63 26 61.5 28.5" fill="none" strokeWidth="2.2" />
      <path d="M39 16 Q40.5 10.5 46 8.8 Q42 13 41.6 18.6 Z" className="p-hi" />
      <path d="M41 32 L44.5 56 Q45.2 59.5 47.5 61 Q44 60 43 56 L39 33 Z" className="p-hi" />
    </>
  ),
  // trident king
  5: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 30 C58 30 64 33 65.5 38 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L34.5 38 C36 33 42 30 50 30 Z" />
      <path d="M36.5 38.5 C39 34.5 44 32.2 50 32.2 C56 32.2 61 34.5 63.5 38.5 L62 31.5 C59 28 55 26.3 50 26.3 C45 26.3 41 28 38 31.5 Z" className="p-band" />
      {/* trident */}
      <path d="M48.6 14 L51.4 14 L51.4 27 L48.6 27 Z" />
      <path d="M42 8 Q41 14 44 18 L46.5 18 Q44.5 13.5 45.5 9.5 Z" />
      <path d="M58 8 Q59 14 56 18 L53.5 18 Q55.5 13.5 54.5 9.5 Z" />
      <path d="M48 6 L52 6 L51.2 13 L48.8 13 Z" />
      <path d="M41 41 Q46 44 50 44 Q54 44 59 41" fill="none" strokeWidth="2" opacity="0.5" />
    </>
  ),
};

/* ============================= 5 · INFERNO ============================= */

const inferno: GlyphSet = {
  // flame wisp pawn
  0: (
    <>
      {Base}
      <path d="M40 74 Q38 68 42 64 L58 64 Q62 68 60 74 Z" />
      <path d="M50 18 Q56 28 61 38 Q65 48 60 56 Q56 62 50 62 Q44 62 40 56 Q35 48 39 38 Q44 28 50 18 Z" />
      <path d="M50 32 Q53 38 55 44 Q56 50 52.5 54 Q50 56 47.5 54 Q44 50 45 44 Q47 38 50 32 Z" className="p-eye" />
      <path d="M44 38 Q41 46 43.5 53 Q40.5 47 42 40 Z" className="p-hi" />
    </>
  ),
  // furnace tower
  3: (
    <>
      {Base}
      <path d="M37 74 L39.5 38 L36 36 L36 22 L42 22 L42 27 L47 27 L47 22 L53 22 L53 27 L58 27 L58 22 L64 22 L64 36 L60.5 38 L63 74 Z" />
      <path d="M45 50 Q45 44 50 43 Q55 44 55 50 L55 60 L45 60 Z" className="p-eye" />
      <path d="M47 60 L48.5 55 L50 60 L51.5 55 L53 60" fill="none" strokeWidth="2" />
      <path d="M40 42 L38 48 L41.5 52 M60 44 L62 52 L59.5 58" fill="none" strokeWidth="2" opacity="0.6" />
      <path d="M41.5 38 L39.8 72 L43 72 L44.5 39 Z" className="p-hi" />
    </>
  ),
  // hellsteed
  1: (
    <>
      {Base}
      <g transform="translate(-6 0)">
        <path d="M76.4 77 L76.6 67 Q77.4 51.6 71.6 36.2 Q68.2 29.4 62 27.2 L61 18 L56 22.5 L54 13 L49.5 20.5 L46 12 L43.6 26.4 L26.5 28.2 Q21.7 30.4 23.2 35.4 Q30.3 47.6 47.6 51.6 Q43.8 63.7 49.5 77 Z" />
        <circle cx="41.5" cy="31.6" r="2.6" className="p-eye" />
        <path d="M23.6 38 Q28 40.6 32.6 41.4" fill="none" strokeWidth="2" />
        {/* flame mane */}
        <path d="M62.5 28.5 Q59.5 34 64.5 38.5 Q60.5 44 66 49.5 Q62 55 67.5 61 Q64.5 67 69 75.5 L74.2 75.8 Q75.6 62.5 74.4 50.5 Q73.2 39.5 68.8 32.6 Q66.4 29.4 64.6 28.2 Z" className="p-sh" />
        <path d="M62.5 28.5 Q59.5 34 64.5 38.5 Q60.5 44 66 49.5 Q62 55 67.5 61" fill="none" strokeWidth="2" opacity="0.6" />
      </g>
    </>
  ),
  // magma spire bishop
  2: (
    <>
      {Base}
      <path d="M43 74 Q45 68 44.5 62 L55.5 62 Q55 68 57 74 Z" />
      <path d="M44 62 L42 50 L45 51 L44 38 L47.5 40 L48 26 L50 17 L52 26 L52.5 40 L56 38 L55 51 L58 50 L56 62 Z" />
      <path d="M48.6 32 L51.4 32 L51.4 46 L48.6 46 Z" className="p-eye" />
      <path d="M50 6 L52.5 11.5 L50 14.5 L47.5 11.5 Z" />
      <path d="M46 42 Q45 52 46.5 60 L48.5 60 Q47.5 52 48.4 41 Z" className="p-hi" />
    </>
  ),
  // ember queen
  4: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 26 C57 26 62.5 28.5 64.5 33 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L35.5 33 C37.5 28.5 43 26 50 26 Z" />
      {/* flame crown */}
      <path d="M36 27 Q34 18 38 10 Q39.5 16 42.5 19 Q42 13 46 7 Q47 14 50 17.5 Q53 14 54 7 Q58 13 57.5 19 Q60.5 16 62 10 Q66 18 64 27 Q57 30.5 50 30.5 Q43 30.5 36 27 Z" />
      <path d="M40 22 Q39 16 41 11.5 Q41.5 17 43.5 20.5 Z" className="p-hi" />
      <path d="M41 32 L44.5 56 Q45.2 59.5 47.5 61 Q44 60 43 56 L39 33 Z" className="p-hi" />
    </>
  ),
  // inferno king
  5: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 30 C58 30 64 33 65.5 38 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L34.5 38 C36 33 42 30 50 30 Z" />
      <path d="M36.5 38.5 C39 34.5 44 32.2 50 32.2 C56 32.2 61 34.5 63.5 38.5 L62 31.5 C59 28 55 26.3 50 26.3 C45 26.3 41 28 38 31.5 Z" className="p-band" />
      {/* flaming cross */}
      <path d="M47.6 9 L52.4 9 L52.4 13.8 L57 13.8 L57 18.6 L52.4 18.6 L52.4 24 L47.6 24 L47.6 18.6 L43 18.6 L43 13.8 L47.6 13.8 Z" />
      <path d="M44 8 Q42 4.5 44.5 2 Q45.5 5 47 6.5 Z M56 8 Q58 4.5 55.5 2 Q54.5 5 53 6.5 Z" />
      <path d="M45 41 L47 45 L50 41.5 L53 45 L55 41" fill="none" strokeWidth="2" opacity="0.6" />
    </>
  ),
};

/* ============================ 6 · FROSTBITE ============================ */

const frost: GlyphSet = {
  // snow orb pawn
  0: (
    <>
      {Base}
      <path d="M38 74 Q36 66 41 62 L59 62 Q64 66 62 74 Z" />
      <circle cx="50" cy="44" r="16" />
      <path d="M50 32 L50 56 M40 38 L60 50 M60 38 L40 50" fill="none" strokeWidth="2" opacity="0.55" />
      <circle cx="44" cy="38" r="4.5" className="p-hi" />
    </>
  ),
  // ice fortress
  3: (
    <>
      {Base}
      <path d="M37 74 L39.5 38 L35 36 L36 20 L41 24 L43 14 L47 22 L50 11 L53 22 L57 14 L59 24 L64 20 L65 36 L60.5 38 L63 74 Z" />
      <path d="M44 46 L50 43 L56 46 L56 58 L44 58 Z" className="p-eye" />
      <path d="M42 62 L45 68 M58 50 L60 57" fill="none" strokeWidth="2" opacity="0.5" />
      <path d="M41.5 38 L39.8 72 L43 72 L44.5 39 Z" className="p-hi" />
      <path d="M58.5 38 L61.2 72 L58 72 L56.5 39 Z" className="p-sh" />
    </>
  ),
  // frost steed
  1: (
    <>
      {Base}
      <g transform="translate(-6 0)">
        <path d="M76.4 77 L76.6 67 Q77.4 51.6 71.6 36.2 Q68.2 29.4 62 27.2 L60.5 16.5 L56.5 23 L53 13 L49 21.5 L45.5 12.5 L43.6 26.4 L26.5 28.2 Q21.7 30.4 23.2 35.4 Q30.3 47.6 47.6 51.6 Q43.8 63.7 49.5 77 Z" />
        <circle cx="41.5" cy="31.6" r="2.4" className="p-eye" />
        <path d="M23.6 38 Q28 40.6 32.6 41.4" fill="none" strokeWidth="2" />
        {/* icicle mane */}
        <path d="M62.5 28.5 L66 36 L63 36.5 L68 46 L65 46.5 L70 57 L67 57.5 L71 68 L68.5 68 L70 75.5 L74.2 75.8 Q75.6 62.5 74.4 50.5 Q73.2 39.5 68.8 32.6 Q66.4 29.4 64.6 28.2 Z" className="p-sh" />
      </g>
    </>
  ),
  // icicle bishop
  2: (
    <>
      {Base}
      <path d="M43 74 Q45 68 44.5 62 L55.5 62 Q55 68 57 74 Z" />
      <path d="M45 62 L43 52 L46 53 L44.5 40 L48 42 L48.5 28 L50 18 L51.5 28 L52 42 L55.5 40 L54 53 L57 52 L55 62 Z" />
      <path d="M48.7 33 L51.3 33 L51.3 46 L48.7 46 Z" className="p-eye" />
      <path d="M50 7 L52 12.5 L50 15.5 L48 12.5 Z" />
      <path d="M46.5 44 Q45.8 53 46.8 60 L48.6 60 Q47.8 53 48.4 43 Z" className="p-hi" />
    </>
  ),
  // snowflake queen
  4: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 26 C57 26 62.5 28.5 64.5 33 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L35.5 33 C37.5 28.5 43 26 50 26 Z" />
      {/* snowflake crown */}
      <g strokeWidth="2.6" fill="none">
        <path d="M50 5 L50 25 M41 8.5 L57.5 21 M59 8.5 L42.5 21 M38 15 L62 15" />
        <path d="M47 8 L50 11 L53 8 M44 11.5 L46.5 14.5 M56 11.5 L53.5 14.5" />
      </g>
      <circle cx="50" cy="15" r="3.2" />
      <path d="M41 32 L44.5 56 Q45.2 59.5 47.5 61 Q44 60 43 56 L39 33 Z" className="p-hi" />
    </>
  ),
  // glacier king
  5: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 30 C58 30 64 33 65.5 38 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L34.5 38 C36 33 42 30 50 30 Z" />
      <path d="M36.5 38.5 C39 34.5 44 32.2 50 32.2 C56 32.2 61 34.5 63.5 38.5 L62 31.5 C59 28 55 26.3 50 26.3 C45 26.3 41 28 38 31.5 Z" className="p-band" />
      {/* ice shard crown */}
      <path d="M40 26 L42 12 L46 22 L50 6 L54 22 L58 12 L60 26 Q55 28.5 50 28.5 Q45 28.5 40 26 Z" />
      <path d="M43.5 18 L44.5 23.5 M50 12 L50 24" fill="none" strokeWidth="2" opacity="0.5" />
    </>
  ),
};

/* ============================ 7 · CYBER NEON ============================ */

const cyber: GlyphSet = {
  // drone pawn
  0: (
    <>
      {Base}
      <path d="M40 74 L42 64 L58 64 L60 74 Z" />
      <path d="M50 24 L46 30 L54 30 Z" />
      <path d="M50 14 L50 26" fill="none" strokeWidth="2.4" />
      <circle cx="50" cy="12" r="2.6" className="p-eye" />
      <rect x="38" y="30" width="24" height="32" rx="9" />
      <rect x="43" y="38" width="14" height="6" rx="3" className="p-eye" />
      <path d="M41 34 Q40 46 41.5 58 L44 58 Q42.8 46 43.8 33 Z" className="p-hi" />
    </>
  ),
  // server tower
  3: (
    <>
      {Base}
      <path d="M38 74 L38 22 L44 22 L44 17 L48 17 L48 22 L52 22 L52 17 L56 17 L56 22 L62 22 L62 74 Z" />
      <path d="M42 28 h16 v3 h-16 z M42 36 h16 v3 h-16 z M42 44 h16 v3 h-16 z" className="p-band" />
      <circle cx="45" cy="56" r="2" className="p-eye" />
      <circle cx="51" cy="56" r="2" className="p-eye" />
      <circle cx="57" cy="56" r="2" className="p-eye" />
      <path d="M42 62 h16 v6 h-16 z" className="p-eye" />
      <path d="M40 23 L40 72 L43 72 L43 23 Z" className="p-hi" />
    </>
  ),
  // mecha steed
  1: (
    <>
      {Base}
      <g transform="translate(-6 0)">
        <path d="M76.4 77 L76.6 67 Q77.4 51.6 71.6 36.2 Q68.2 29.4 62 27.2 L58.7 17.2 L55.8 17.2 L53.3 24.9 L51.9 24.8 L48.8 14.7 L45.9 14.8 L43.6 26.4 L26.5 28.2 Q21.7 30.4 23.2 35.4 Q30.3 47.6 47.6 51.6 Q43.8 63.7 49.5 77 Z" />
        {/* visor */}
        <path d="M27 30 L45 28.5 L44.5 33.5 L28 34 Z" className="p-eye" />
        {/* armor segments */}
        <path d="M50 54 L62 54 M48.5 60 L64 60 M48 66 L65 66 M48.5 72 L66 72" fill="none" strokeWidth="2.2" opacity="0.6" />
        <path d="M62.5 28.5 L68 33 L64 35 L70 41 L66 43 L71.5 50 L68 51.5 L72 60 L69 61 L71 75.5 L74.2 75.8 Q75.6 62.5 74.4 50.5 Q73.2 39.5 68.8 32.6 Q66.4 29.4 64.6 28.2 Z" className="p-sh" />
      </g>
    </>
  ),
  // antenna bishop
  2: (
    <>
      {Base}
      <path d="M43 74 Q45 68 44.5 62 L55.5 62 Q55 68 57 74 Z" />
      <path d="M45 62 L46 30 L50 20 L54 30 L55 62 Z" />
      <path d="M48.5 32 L51.5 32 L51.5 50 L48.5 50 Z" className="p-eye" />
      <path d="M50 20 L50 11" fill="none" strokeWidth="2.4" />
      <path d="M43 9 Q50 4 57 9" fill="none" strokeWidth="2.4" />
      <path d="M45.5 13 Q50 9.5 54.5 13" fill="none" strokeWidth="2.2" />
      <circle cx="50" cy="16" r="2.2" className="p-eye" />
      <path d="M47 32 L46.4 60 L48.4 60 L48.8 31 Z" className="p-hi" />
    </>
  ),
  // hologram queen
  4: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 26 C57 26 62.5 28.5 64.5 33 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L35.5 33 C37.5 28.5 43 26 50 26 Z" />
      {/* circuit crown */}
      <path d="M37 26 L37 13 L44 13 L44 20 L48 20 L48 8 L52 8 L52 20 L56 20 L56 13 L63 13 L63 26 Q56 29.5 50 29.5 Q44 29.5 37 26 Z" />
      <circle cx="37" cy="10.5" r="2.5" className="p-eye" />
      <circle cx="50" cy="5.5" r="2.5" className="p-eye" />
      <circle cx="63" cy="10.5" r="2.5" className="p-eye" />
      <path d="M42 36 Q50 39 58 36 M41 44 Q50 47 59 44 M42 52 Q50 55 58 52" fill="none" strokeWidth="2" opacity="0.5" />
    </>
  ),
  // mainframe king
  5: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 30 C58 30 64 33 65.5 38 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L34.5 38 C36 33 42 30 50 30 Z" />
      <path d="M36.5 38.5 C39 34.5 44 32.2 50 32.2 C56 32.2 61 34.5 63.5 38.5 L62 31.5 C59 28 55 26.3 50 26.3 C45 26.3 41 28 38 31.5 Z" className="p-band" />
      {/* power-symbol crown */}
      <circle cx="50" cy="17" r="8.5" fill="none" strokeWidth="3.4" />
      <path d="M50 6 L50 17" fill="none" strokeWidth="3.4" />
      <path d="M44 42 h12 v4 h-12 z" className="p-eye" />
    </>
  ),
};

/* ============================ 8 · ROYAL GOLD ============================ */

const royal: GlyphSet = {
  0: (
    <>
      {Base}
      <path d="M40 74 Q38 67 42.5 63 L57.5 63 Q62 67 60 74 Z" />
      <path d="M42 63 Q40 56 44 52 L56 52 Q60 56 58 63 Z" />
      <circle cx="50" cy="38" r="13.5" />
      <path d="M37.5 36 h25 v4.4 h-25 z" className="p-band" />
      <circle cx="50" cy="22" r="3.4" />
      <circle cx="45" cy="32" r="4" className="p-hi" />
    </>
  ),
  3: (
    <>
      {Base}
      <path d="M38 74 L40 36 L36 33 L36 19 L42 19 L42 25 L47 25 L47 19 L53 19 L53 25 L58 25 L58 19 L64 19 L64 33 L60 36 L62 74 Z" />
      <path d="M45 48 Q45 41 50 40 Q55 41 55 48 L55 60 L45 60 Z" className="p-eye" />
      <path d="M44 33 h12 v3 h-12 z" className="p-band" />
      <path d="M42 36 L40.5 72 L44 72 L45 37 Z" className="p-hi" />
      <path d="M58 36 L60.5 72 L57 72 L56 37 Z" className="p-sh" />
    </>
  ),
  1: (
    <>
      {Base}
      <g transform="translate(-6 0)">
        <path d="M76.4 77 L76.6 67 Q77.4 51.6 71.6 36.2 Q68.2 29.4 62 27.2 L58.7 17.2 C58.2 15.6 56.4 15.6 55.8 17.2 L53.3 24.9 L51.9 24.8 L48.8 14.7 C48.3 13.1 46.4 13.1 45.9 14.8 L43.6 26.4 L26.5 28.2 Q21.7 30.4 23.2 35.4 Q30.3 47.6 47.6 51.6 Q43.8 63.7 49.5 77 Z" />
        {/* plume */}
        <path d="M51 13 Q48 4 54 1 Q54.5 7 58 10 Q54 11 51 13 Z" />
        {/* bridle */}
        <path d="M26 30 Q34 33 43 33.5 M44 27 L42 40" fill="none" strokeWidth="2" opacity="0.6" />
        <circle cx="27.2" cy="33.2" r="1.7" className="p-eye" />
        <path d="M41.5 31.6 a2.6 2 -15 1 0 0.1 0" className="p-eye" />
        <path d="M62.5 28.5 Q67.4 32.8 69.6 39.6 Q71.8 48 71.4 58 Q71.2 67 70 75.5 L74.2 75.8 Q75.6 62.5 74.4 50.5 Q73.2 39.5 68.8 32.6 Q66.4 29.4 64.6 28.2 Z" className="p-sh" />
      </g>
    </>
  ),
  2: (
    <>
      {Base}
      <path d="M42 77 C40 71 43 67 44.5 62 L55.5 62 C57 67 60 71 58 77 Z" />
      <ellipse cx="50" cy="62" rx="9.5" ry="3.4" />
      <path d="M50 22 C60 29 65 38 64.5 47 C64 55 58.5 60.5 50 60.5 C41.5 60.5 36 55 35.5 47 C35 38 40 29 50 22 Z" />
      <path d="M47.8 31 L52.2 31 L52.2 45 L47.8 45 Z M42.5 36.6 L57.5 36.6 L57.5 40.6 L42.5 40.6 Z" className="p-eye" />
      <circle cx="50" cy="13.5" r="5" />
      <path d="M50 5.5 L51.6 9.5 L48.4 9.5 Z" />
      <path d="M44 27.5 C39 33.5 36.8 41 37.5 47.5 C38 52 40.5 55.5 44 57.6 C41 54 39.8 50 39.8 45.5 C39.8 39 42 32.5 46 26.4 Z" className="p-hi" />
    </>
  ),
  4: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 26 C57 26 62.5 28.5 64.5 33 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L35.5 33 C37.5 28.5 43 26 50 26 Z" />
      {/* arched imperial crown */}
      <path d="M36 25 L36 14 L42 18 L48 11 L50 14 L52 11 L58 18 L64 14 L64 25 Q57 28.5 50 28.5 Q43 28.5 36 25 Z" />
      <path d="M38 14 Q50 2 62 14" fill="none" strokeWidth="3" />
      <circle cx="50" cy="6.5" r="2.8" />
      <circle cx="39" cy="20" r="1.6" className="p-eye" />
      <circle cx="50" cy="22" r="1.6" className="p-eye" />
      <circle cx="61" cy="20" r="1.6" className="p-eye" />
      <path d="M41 32 L44.5 56 Q45.2 59.5 47.5 61 Q44 60 43 56 L39 33 Z" className="p-hi" />
    </>
  ),
  5: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 30 C58 30 64 33 65.5 38 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L34.5 38 C36 33 42 30 50 30 Z" />
      <path d="M36.5 38.5 C39 34.5 44 32.2 50 32.2 C56 32.2 61 34.5 63.5 38.5 L62 31.5 C59 28 55 26.3 50 26.3 C45 26.3 41 28 38 31.5 Z" className="p-band" />
      {/* orb + cross */}
      <circle cx="50" cy="20" r="7" />
      <path d="M48.6 5 L51.4 5 L51.4 8 L54 8 L54 10.8 L51.4 10.8 L51.4 13.5 L48.6 13.5 L48.6 10.8 L46 10.8 L46 8 L48.6 8 Z" />
      <path d="M43.5 19.5 h13 v2.6 h-13 z" className="p-band" />
      <circle cx="47.5" cy="17" r="2" className="p-hi" />
    </>
  ),
};

/* =========================== 9 · ELVEN FOREST =========================== */

const elven: GlyphSet = {
  // acorn pawn
  0: (
    <>
      {Base}
      <path d="M41 74 Q39 67 43 63 L57 63 Q61 67 59 74 Z" />
      <path d="M40 42 Q40 36 50 36 Q60 36 60 42 Q60 44 58 45 Q60 54 53 61 Q50 63 47 61 Q40 54 42 45 Q40 44 40 42 Z" />
      <path d="M40 41 Q40 34 50 34 Q60 34 60 41 L58 42.5 Q54 39.5 50 39.5 Q46 39.5 42 42.5 Z" className="p-band" />
      <path d="M50 34 Q49 29 52 26" fill="none" strokeWidth="2.6" />
      <path d="M44.5 46 Q44 54 48 59 Q44.5 56 43.2 49 Z" className="p-hi" />
    </>
  ),
  // ancient trunk tower
  3: (
    <>
      {Base}
      <path d="M38 74 Q40 56 39 40 L35 36 Q40 36 42 32 L42 24 L46 28 L50 22 L54 28 L58 24 L58 32 Q60 36 65 36 L61 40 Q60 56 62 74 Z" />
      <path d="M44 44 Q43 56 44.5 70 M56 46 Q57 58 55.5 70 M50 42 Q49.5 50 50 58" fill="none" strokeWidth="2" opacity="0.5" />
      <path d="M46 50 Q46 45 50 44 Q54 45 54 50 L54 57 L46 57 Z" className="p-eye" />
      <path d="M41 40 Q40 56 40.8 72 L43.6 72 Q43 56 43.8 41 Z" className="p-hi" />
    </>
  ),
  // stag knight
  1: (
    <>
      {Base}
      <g transform="translate(-6 0)">
        <path d="M76.4 77 L76.6 67 Q77.4 51.6 71.6 36.2 Q68.2 29.4 62 27.2 L59.5 20 L54 24 L51 24 L47.5 17 L44.5 26 L26.5 28.2 Q21.7 30.4 23.2 35.4 Q30.3 47.6 47.6 51.6 Q43.8 63.7 49.5 77 Z" />
        {/* antlers */}
        <g fill="none" strokeWidth="2.8">
          <path d="M47.5 17 Q44 10 46 3.5 M46.5 9.5 Q42.5 8.5 40.5 5 M46.8 13 Q43 13.5 40 11.5" />
          <path d="M59.5 20 Q60 10 65.5 4.5 M61 12 Q65 10.5 67 6.5 M60 16 Q64.5 16 67.5 13.5" />
        </g>
        <circle cx="27.2" cy="33.2" r="1.7" className="p-eye" />
        <path d="M41.5 31.6 a2.6 2 -15 1 0 0.1 0" className="p-eye" />
        <path d="M23.6 38 Q28 40.6 32.6 41.4" fill="none" strokeWidth="2" />
        <path d="M62.5 28.5 Q67.4 32.8 69.6 39.6 Q71.8 48 71.4 58 Q71.2 67 70 75.5 L74.2 75.8 Q75.6 62.5 74.4 50.5 Q73.2 39.5 68.8 32.6 Q66.4 29.4 64.6 28.2 Z" className="p-sh" />
      </g>
    </>
  ),
  // leaf bishop
  2: (
    <>
      {Base}
      <path d="M43 74 Q45 68 44.5 62 L55.5 62 Q55 68 57 74 Z" />
      <path d="M50 16 Q63 28 62 44 Q61 56 50 62 Q39 56 38 44 Q37 28 50 16 Z" />
      <path d="M50 22 L50 58 M50 30 Q44 32 41.5 37 M50 30 Q56 32 58.5 37 M50 42 Q44.5 44 42 49 M50 42 Q55.5 44 58 49" fill="none" strokeWidth="2.2" opacity="0.65" />
      <path d="M44 28 Q39.5 36 40.2 45 Q40.8 52 45 57 Q42 51 41.8 44 Q41.8 35.5 45.8 27 Z" className="p-hi" />
    </>
  ),
  // blossom queen
  4: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 26 C57 26 62.5 28.5 64.5 33 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L35.5 33 C37.5 28.5 43 26 50 26 Z" />
      {/* petal crown */}
      <path d="M50 6 Q54 11 52.5 16 Q50 18 47.5 16 Q46 11 50 6 Z" />
      <path d="M36 12 Q42 13.5 44.5 18 Q43.5 21 40.5 20.5 Q36.5 17.5 36 12 Z" />
      <path d="M64 12 Q58 13.5 55.5 18 Q56.5 21 59.5 20.5 Q63.5 17.5 64 12 Z" />
      <path d="M38 25 Q44 21 50 21 Q56 21 62 25 Q57 28.5 50 28.5 Q43 28.5 38 25 Z" />
      <circle cx="50" cy="19" r="2.8" className="p-eye" />
      <path d="M41 32 L44.5 56 Q45.2 59.5 47.5 61 Q44 60 43 56 L39 33 Z" className="p-hi" />
    </>
  ),
  // antler king
  5: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 30 C58 30 64 33 65.5 38 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L34.5 38 C36 33 42 30 50 30 Z" />
      <path d="M36.5 38.5 C39 34.5 44 32.2 50 32.2 C56 32.2 61 34.5 63.5 38.5 L62 31.5 C59 28 55 26.3 50 26.3 C45 26.3 41 28 38 31.5 Z" className="p-band" />
      {/* antler crown */}
      <g fill="none" strokeWidth="2.8">
        <path d="M44 26 Q39 18 40.5 8 M41 14 Q37 12.5 35.5 8.5 M42 20 Q38 20 35 17.5" />
        <path d="M56 26 Q61 18 59.5 8 M59 14 Q63 12.5 64.5 8.5 M58 20 Q62 20 65 17.5" />
      </g>
      <circle cx="50" cy="20" r="5" />
      <circle cx="48.4" cy="18.4" r="1.7" className="p-hi" />
    </>
  ),
};

/* ============================= 10 · GALAXY ============================= */

const galaxy: GlyphSet = {
  // ringed planet pawn
  0: (
    <>
      {Base}
      <path d="M40 74 Q38 67 43 63 L57 63 Q62 67 60 74 Z" />
      <circle cx="50" cy="42" r="13" />
      <path d="M30 46 Q50 36 70 38 Q50 50 30 46 Z" className="p-band" />
      <circle cx="45" cy="36" r="4" className="p-hi" />
      <circle cx="55" cy="46" r="2.2" className="p-sh" />
    </>
  ),
  // rocket rook
  3: (
    <>
      {Base}
      <path d="M42 74 L38 66 L42 66 L42 30 Q42 18 50 12 Q58 18 58 30 L58 66 L62 66 L58 74 Z" />
      <path d="M42 50 L34 62 L42 62 Z M58 50 L66 62 L58 62 Z" />
      <circle cx="50" cy="30" r="5.5" className="p-eye" />
      <circle cx="50" cy="30" r="2.4" className="p-hi" />
      <path d="M46 66 L48 70 L50 66 L52 70 L54 66" fill="none" strokeWidth="2" />
      <path d="M44.5 30 Q44.5 20 49 14 Q46.5 21 46.5 30 L46.5 64 L44.5 64 Z" className="p-hi" />
    </>
  ),
  // comet steed
  1: (
    <>
      {Base}
      <g transform="translate(-6 0)">
        <path d="M76.4 77 L76.6 67 Q77.4 51.6 71.6 36.2 Q68.2 29.4 62 27.2 L58.7 17.2 C58.2 15.6 56.4 15.6 55.8 17.2 L53.3 24.9 L51.9 24.8 L48.8 14.7 C48.3 13.1 46.4 13.1 45.9 14.8 L43.6 26.4 L26.5 28.2 Q21.7 30.4 23.2 35.4 Q30.3 47.6 47.6 51.6 Q43.8 63.7 49.5 77 Z" />
        <circle cx="27.2" cy="33.2" r="1.7" className="p-eye" />
        {/* star eye */}
        <path d="M41.5 28 L42.6 31 L45.6 31.2 L43.2 33 L44 36 L41.5 34.2 L39 36 L39.8 33 L37.4 31.2 L40.4 31 Z" className="p-eye" />
        <path d="M23.6 38 Q28 40.6 32.6 41.4" fill="none" strokeWidth="2" />
        {/* star-trail mane */}
        <path d="M62.5 28.5 Q67.4 32.8 69.6 39.6 Q71.8 48 71.4 58 Q71.2 67 70 75.5 L74.2 75.8 Q75.6 62.5 74.4 50.5 Q73.2 39.5 68.8 32.6 Q66.4 29.4 64.6 28.2 Z" className="p-sh" />
        <path d="M65 34 L66 36.5 L68.5 36.7 L66.6 38.2 L67.2 40.7 L65 39.2 L62.8 40.7 L63.4 38.2 L61.5 36.7 L64 36.5 Z M68 48 L68.8 50 L70.8 50.2 L69.3 51.4 L69.8 53.4 L68 52.2 L66.2 53.4 L66.7 51.4 L65.2 50.2 L67.2 50 Z M68.5 62 L69.3 64 L71.3 64.2 L69.8 65.4 L70.3 67.4 L68.5 66.2 L66.7 67.4 L67.2 65.4 L65.7 64.2 L67.7 64 Z" className="p-hi" />
      </g>
    </>
  ),
  // observatory bishop
  2: (
    <>
      {Base}
      <path d="M43 74 Q45 68 44.5 62 L55.5 62 Q55 68 57 74 Z" />
      <path d="M44 62 Q42 48 45 36 Q47 27 50 23 Q53 27 55 36 Q58 48 56 62 Z" />
      <path d="M48.5 34 L51.5 34 L51.5 48 L48.5 48 Z" className="p-eye" />
      {/* telescope */}
      <path d="M47 23 L57 9 L61 12 L51 26 Z" />
      <circle cx="59" cy="10.5" r="2.4" className="p-hi" />
      <path d="M46.8 38 Q45.8 50 46.8 60 L48.8 60 Q48 50 48.8 37 Z" className="p-hi" />
    </>
  ),
  // celestial queen
  4: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 26 C57 26 62.5 28.5 64.5 33 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L35.5 33 C37.5 28.5 43 26 50 26 Z" />
      {/* crescent + stars crown */}
      <path d="M42 22 Q36 16 38 8 Q40.5 13 46 14.5 Q43.5 18.5 42 22 Z" />
      <path d="M58 22 Q64 16 62 8 Q59.5 13 54 14.5 Q56.5 18.5 58 22 Z" />
      <path d="M50 4 L51.6 8.6 L56.4 8.8 L52.6 11.6 L54 16.2 L50 13.4 L46 16.2 L47.4 11.6 L43.6 8.8 L48.4 8.6 Z" />
      <path d="M38 25 Q44 21.5 50 21.5 Q56 21.5 62 25 Q56 28.5 50 28.5 Q44 28.5 38 25 Z" />
      <path d="M41 32 L44.5 56 Q45.2 59.5 47.5 61 Q44 60 43 56 L39 33 Z" className="p-hi" />
    </>
  ),
  // solar king
  5: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 30 C58 30 64 33 65.5 38 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L34.5 38 C36 33 42 30 50 30 Z" />
      <path d="M36.5 38.5 C39 34.5 44 32.2 50 32.2 C56 32.2 61 34.5 63.5 38.5 L62 31.5 C59 28 55 26.3 50 26.3 C45 26.3 41 28 38 31.5 Z" className="p-band" />
      {/* radiant sun crown */}
      <circle cx="50" cy="16" r="6.5" />
      <path d="M50 3 L51.5 8 L48.5 8 Z M60 6 L58 10.5 L55.8 8 Z M40 6 L42 10.5 L44.2 8 Z M63 16 L57.8 16.8 L59 13.4 Z M37 16 L42.2 16.8 L41 13.4 Z M58.5 25 L55.6 21.4 L58.8 20.4 Z M41.5 25 L44.4 21.4 L41.2 20.4 Z" />
      <circle cx="48" cy="14" r="2" className="p-hi" />
    </>
  ),
};

/* ============================ 11 · CANDYLAND ============================ */

const candy: GlyphSet = {
  // gumdrop pawn
  0: (
    <>
      {Base}
      <path d="M40 74 Q38 68 42 64 L58 64 Q62 68 60 74 Z" />
      <path d="M38 64 Q36 44 44 32 Q47 28 50 28 Q53 28 56 32 Q64 44 62 64 Z" />
      <circle cx="45" cy="42" r="1.8" className="p-eye" />
      <circle cx="55" cy="38" r="1.8" className="p-eye" />
      <circle cx="50" cy="52" r="1.8" className="p-eye" />
      <circle cx="57" cy="56" r="1.8" className="p-eye" />
      <circle cx="43" cy="56" r="1.8" className="p-eye" />
      <path d="M43 38 Q40 50 41.5 62 L45 62 Q43.5 50 45.8 36 Z" className="p-hi" />
    </>
  ),
  // wafer castle rook
  3: (
    <>
      {Base}
      <path d="M38 74 L39 32 L36 32 L36 21 L42 21 L42 26 L47 26 L47 21 L53 21 L53 26 L58 26 L58 21 L64 21 L64 32 L61 32 L62 74 Z" />
      <path d="M38.6 40 h22.8 v4 h-22.8 z M38.2 52 h23.6 v4 h-23.6 z M37.8 64 h24.4 v4 h-24.4 z" className="p-band" />
      <circle cx="50" cy="34.5" r="2" className="p-eye" />
      <circle cx="44" cy="46.5" r="2" className="p-eye" />
      <circle cx="56" cy="46.5" r="2" className="p-eye" />
      <circle cx="50" cy="58.5" r="2" className="p-eye" />
      <path d="M41 33 L40 72 L43.4 72 L44 33 Z" className="p-hi" />
    </>
  ),
  // carousel steed
  1: (
    <>
      {Base}
      <g transform="translate(-6 0)">
        <path d="M76.4 77 L76.6 67 Q77.4 51.6 71.6 36.2 Q68.2 29.4 62 27.2 L58.7 17.2 C58.2 15.6 56.4 15.6 55.8 17.2 L53.3 24.9 L51.9 24.8 L48.8 14.7 C48.3 13.1 46.4 13.1 45.9 14.8 L43.6 26.4 L26.5 28.2 Q21.7 30.4 23.2 35.4 Q30.3 47.6 47.6 51.6 Q43.8 63.7 49.5 77 Z" />
        <circle cx="27.2" cy="33.2" r="1.7" className="p-eye" />
        <path d="M41.5 31.6 a2.6 2 -15 1 0 0.1 0" className="p-eye" />
        <path d="M23.6 38 Q28 40.6 32.6 41.4" fill="none" strokeWidth="2" />
        {/* candy-stripe mane */}
        <path d="M62.5 28.5 Q67.4 32.8 69.6 39.6 Q71.8 48 71.4 58 Q71.2 67 70 75.5 L74.2 75.8 Q75.6 62.5 74.4 50.5 Q73.2 39.5 68.8 32.6 Q66.4 29.4 64.6 28.2 Z" className="p-sh" />
        <path d="M63.5 30 L69 36.5 M65.8 36 L71 43 M67.6 43 L72.2 50.5 M68.8 50 L73 58 M69.4 58 L73.4 66 M69.6 66 L73 74" fill="none" strokeWidth="2.4" opacity="0.7" />
      </g>
    </>
  ),
  // soft-serve bishop
  2: (
    <>
      {Base}
      <path d="M43 74 Q45 68 44.5 62 L55.5 62 Q55 68 57 74 Z" />
      <path d="M42 62 L50 24 L58 62 Z" />
      <path d="M46 44 L54 44 M44.5 52 L55.5 52 M47.5 36 L52.5 36" fill="none" strokeWidth="2" opacity="0.6" />
      {/* swirl */}
      <path d="M44 26 Q43 19 50 17.5 Q57 16.5 57.5 22 Q57.8 26 53 26.5 Q49.5 26.6 49.5 23.5 Q49.5 21.4 52 21.4" fill="none" strokeWidth="3.2" />
      <circle cx="50" cy="13" r="3.2" className="p-eye" />
      <path d="M47.5 35 L44 60 L46.5 60 L49.4 34 Z" className="p-hi" />
    </>
  ),
  // lollipop queen
  4: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 26 C57 26 62.5 28.5 64.5 33 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L35.5 33 C37.5 28.5 43 26 50 26 Z" />
      {/* lollipop crown */}
      <circle cx="50" cy="14" r="9" />
      <path d="M50 5.5 Q55 8 54.5 14 Q54 19 50 19.5 Q46.5 19.8 46.5 16.5 Q46.5 13.8 49.4 13.8" fill="none" strokeWidth="2.6" />
      <path d="M48.7 22.5 h2.6 v5 h-2.6 z" />
      <circle cx="38" cy="24" r="2.6" />
      <circle cx="62" cy="24" r="2.6" />
      <path d="M41 32 L44.5 56 Q45.2 59.5 47.5 61 Q44 60 43 56 L39 33 Z" className="p-hi" />
    </>
  ),
  // candy-cane king
  5: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 30 C58 30 64 33 65.5 38 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L34.5 38 C36 33 42 30 50 30 Z" />
      <path d="M36.5 38.5 C39 34.5 44 32.2 50 32.2 C56 32.2 61 34.5 63.5 38.5 L62 31.5 C59 28 55 26.3 50 26.3 C45 26.3 41 28 38 31.5 Z" className="p-band" />
      {/* candy cane crook */}
      <path d="M47 27 L47 13 Q47 6.5 53 6.5 Q59 6.5 59 12 L55.4 12 Q55.4 10 53 10 Q50.6 10 50.6 13 L50.6 27 Z" />
      <path d="M47.6 24 L50 22.4 M47.6 19 L50 17.4 M48 13.5 L50.4 12.6 M50.8 9.4 Q52 8.2 53.6 8.6" fill="none" strokeWidth="2" opacity="0.65" />
      <circle cx="50" cy="42" r="3" className="p-eye" />
    </>
  ),
};

/* ============================= 12 · SAMURAI ============================= */

const samurai: GlyphSet = {
  // kasa pawn
  0: (
    <>
      {Base}
      <path d="M42 74 Q40 64 44 56 L56 56 Q60 64 58 74 Z" />
      <path d="M30 50 L50 26 L70 50 Q60 54 50 54 Q40 54 30 50 Z" />
      <path d="M50 26 L50 53" fill="none" strokeWidth="2" opacity="0.4" />
      <path d="M40 44 L50 31 L60 44" fill="none" strokeWidth="2" opacity="0.4" />
      <path d="M36 47 Q43 36 50 29 Q44 38 41 49 Z" className="p-hi" />
    </>
  ),
  // pagoda rook
  3: (
    <>
      {Base}
      <path d="M42 74 L43 60 L57 60 L58 74 Z" />
      <path d="M34 60 L40 52 L60 52 L66 60 Z" />
      <path d="M44 52 L45 40 L55 40 L56 52 Z" />
      <path d="M36 40 L42 32 L58 32 L64 40 Z" />
      <path d="M46 32 L46 26 L54 26 L54 32 Z" />
      <path d="M40 26 L50 18 L60 26 Z" />
      <path d="M50 12 L50 19" fill="none" strokeWidth="2.6" />
      <circle cx="50" cy="10.5" r="2" />
      <path d="M47 64 h6 v8 h-6 z" className="p-eye" />
      <path d="M38 58.5 L42 53 L46 53 L42.6 58.5 Z" className="p-hi" />
    </>
  ),
  // armored war steed
  1: (
    <>
      {Base}
      <g transform="translate(-6 0)">
        <path d="M76.4 77 L76.6 67 Q77.4 51.6 71.6 36.2 Q68.2 29.4 62 27.2 L58.7 17.2 C58.2 15.6 56.4 15.6 55.8 17.2 L53.3 24.9 L51.9 24.8 L48.8 14.7 C48.3 13.1 46.4 13.1 45.9 14.8 L43.6 26.4 L26.5 28.2 Q21.7 30.4 23.2 35.4 Q30.3 47.6 47.6 51.6 Q43.8 63.7 49.5 77 Z" />
        {/* chanfron armor plate */}
        <path d="M44 26.6 L27 28.4 Q23.4 30.4 24.8 34.4 L31 33.6 Q40 32.4 44.6 30.4 Z" className="p-band" />
        <circle cx="41.5" cy="34" r="2.2" className="p-eye" />
        <path d="M23.6 38 Q28 40.6 32.6 41.4" fill="none" strokeWidth="2" />
        {/* segmented topknot mane */}
        <path d="M62.5 28.5 Q67.4 32.8 69.6 39.6 Q71.8 48 71.4 58 Q71.2 67 70 75.5 L74.2 75.8 Q75.6 62.5 74.4 50.5 Q73.2 39.5 68.8 32.6 Q66.4 29.4 64.6 28.2 Z" className="p-sh" />
        <path d="M64 32 L70 36 M66 40 L71.6 43 M67.6 48 L72.6 50 M68.4 56 L73 57.4 M68.8 64 L73.2 64.8" fill="none" strokeWidth="2.2" opacity="0.65" />
      </g>
    </>
  ),
  // monk bishop
  2: (
    <>
      {Base}
      <path d="M43 74 Q45 68 44.5 62 L55.5 62 Q55 68 57 74 Z" />
      <path d="M50 20 C59.5 26 64 35 63.5 45 C63 54 57.5 60 50 60 C42.5 60 37 54 36.5 45 C36 35 40.5 26 50 20 Z" />
      {/* prayer beads */}
      <circle cx="42" cy="52" r="2" className="p-eye" />
      <circle cx="46" cy="55" r="2" className="p-eye" />
      <circle cx="50" cy="56" r="2" className="p-eye" />
      <circle cx="54" cy="55" r="2" className="p-eye" />
      <circle cx="58" cy="52" r="2" className="p-eye" />
      <path d="M47.8 30 L52.2 30 L52.2 42 L47.8 42 Z" className="p-eye" />
      <path d="M44 26 C39.5 32 37.8 39 38.4 45.5 C38.8 50 41 54 44.5 56.5 C41.8 53 40.6 49 40.5 45 C40.4 38.5 42.4 31.5 46 25 Z" className="p-hi" />
    </>
  ),
  // kanzashi queen
  4: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 26 C57 26 62.5 28.5 64.5 33 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L35.5 33 C37.5 28.5 43 26 50 26 Z" />
      {/* folding fan crown */}
      <path d="M50 25 L36 9 L41.5 7.5 L50 22 L50 25 Z" />
      <path d="M50 25 L43 6 L48 5 L50.8 21.5 Z" />
      <path d="M50 25 L57 6 L52 5 L49.2 21.5 Z" />
      <path d="M50 25 L64 9 L58.5 7.5 L50 22 Z" />
      <circle cx="50" cy="24" r="3" className="p-eye" />
      <path d="M41 32 L44.5 56 Q45.2 59.5 47.5 61 Q44 60 43 56 L39 33 Z" className="p-hi" />
    </>
  ),
  // kabuto king
  5: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 30 C58 30 64 33 65.5 38 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L34.5 38 C36 33 42 30 50 30 Z" />
      {/* kabuto helmet */}
      <path d="M36 30 Q36 18 50 17 Q64 18 64 30 Q57 33 50 33 Q43 33 36 30 Z" />
      <path d="M34 32 L40 26 L42 30 L38 34 Z M66 32 L60 26 L58 30 L62 34 Z" />
      {/* crescent maedate */}
      <path d="M42 14 Q44 5 50 3 Q56 5 58 14 Q54 9.5 50 9.5 Q46 9.5 42 14 Z" />
      <path d="M48.7 33 h2.6 v6 h-2.6 z" className="p-eye" />
      <path d="M40 28.5 Q41 20.5 47 18 Q43 22 42.6 28 Z" className="p-hi" />
    </>
  ),
};

/* ============================ 13 · STEAMPUNK ============================ */

const steampunk: GlyphSet = {
  // gear pawn
  0: (
    <>
      {Base}
      <path d="M41 74 Q39 67 43 63 L57 63 Q61 67 59 74 Z" />
      <path d="M47 24 L53 24 L54 29 L59 31 L63.5 28 L67 33.5 L63.5 37 L64 42 L68 45 L65 51 L60 50 L56.5 54 L57 59 L51 61 L48 56.5 L43 56 L39.5 60 L34.5 56 L36.5 51 L33.5 47 L28.5 47 L28 41 L33 39.5 L34.5 34.5 L31.5 30.5 L36 26.5 L40.5 29.5 L45.5 28 Z" />
      <circle cx="48" cy="42" r="7" className="p-eye" />
      <circle cx="48" cy="42" r="3" className="p-hi" />
    </>
  ),
  // clocktower rook
  3: (
    <>
      {Base}
      <path d="M39 74 L41 34 L37 34 L50 20 L63 34 L59 34 L61 74 Z" />
      <circle cx="50" cy="44" r="8.5" />
      <circle cx="50" cy="44" r="6.5" className="p-eye" />
      <path d="M50 44 L50 39.5 M50 44 L53.5 46" fill="none" strokeWidth="2" />
      <path d="M46 60 Q46 56 50 55.5 Q54 56 54 60 L54 68 L46 68 Z" className="p-eye" />
      <path d="M43 35 L41.6 72 L44.8 72 L45.8 35 Z" className="p-hi" />
    </>
  ),
  // brass automaton steed
  1: (
    <>
      {Base}
      <g transform="translate(-6 0)">
        <path d="M76.4 77 L76.6 67 Q77.4 51.6 71.6 36.2 Q68.2 29.4 62 27.2 L58.7 17.2 C58.2 15.6 56.4 15.6 55.8 17.2 L53.3 24.9 L51.9 24.8 L48.8 14.7 C48.3 13.1 46.4 13.1 45.9 14.8 L43.6 26.4 L26.5 28.2 Q21.7 30.4 23.2 35.4 Q30.3 47.6 47.6 51.6 Q43.8 63.7 49.5 77 Z" />
        {/* goggle eye */}
        <circle cx="41.5" cy="31.6" r="4.6" fill="none" strokeWidth="2.6" />
        <circle cx="41.5" cy="31.6" r="1.8" className="p-eye" />
        {/* rivets + plate seam */}
        <circle cx="55" cy="38" r="1.4" className="p-eye" />
        <circle cx="59" cy="48" r="1.4" className="p-eye" />
        <circle cx="61" cy="58" r="1.4" className="p-eye" />
        <circle cx="62" cy="68" r="1.4" className="p-eye" />
        <path d="M49 51 Q56 56 60 64" fill="none" strokeWidth="2" opacity="0.5" />
        <path d="M23.6 38 Q28 40.6 32.6 41.4" fill="none" strokeWidth="2" />
        <path d="M62.5 28.5 Q67.4 32.8 69.6 39.6 Q71.8 48 71.4 58 Q71.2 67 70 75.5 L74.2 75.8 Q75.6 62.5 74.4 50.5 Q73.2 39.5 68.8 32.6 Q66.4 29.4 64.6 28.2 Z" className="p-sh" />
      </g>
    </>
  ),
  // pressure-gauge bishop
  2: (
    <>
      {Base}
      <path d="M43 74 Q45 68 44.5 62 L55.5 62 Q55 68 57 74 Z" />
      <path d="M44 62 L44 34 Q44 26 50 24 Q56 26 56 34 L56 62 Z" />
      <circle cx="50" cy="38" r="7.5" />
      <circle cx="50" cy="38" r="5.5" className="p-eye" />
      <path d="M50 38 L46.5 34.5" fill="none" strokeWidth="2" />
      <path d="M46 50 h8 v3 h-8 z" className="p-band" />
      <path d="M50 24 L50 16 M46 16 L54 16" fill="none" strokeWidth="2.6" />
      <circle cx="50" cy="13" r="2.6" />
      <path d="M46 34 Q45.4 48 46 60 L48 60 Q47.6 48 48 33 Z" className="p-hi" />
    </>
  ),
  // cog-crown queen
  4: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 26 C57 26 62.5 28.5 64.5 33 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L35.5 33 C37.5 28.5 43 26 50 26 Z" />
      {/* half-cog crown */}
      <path d="M36 26 L36 19 L40 19 L40 13.5 L45 13.5 L45 8.5 L50 8.5 L55 8.5 L55 13.5 L60 13.5 L60 19 L64 19 L64 26 Q57 29.5 50 29.5 Q43 29.5 36 26 Z" />
      <circle cx="50" cy="19" r="4.4" className="p-eye" />
      <circle cx="50" cy="19" r="1.8" className="p-hi" />
      <path d="M41 32 L44.5 56 Q45.2 59.5 47.5 61 Q44 60 43 56 L39 33 Z" className="p-hi" />
    </>
  ),
  // top-hat gear king
  5: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 30 C58 30 64 33 65.5 38 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L34.5 38 C36 33 42 30 50 30 Z" />
      {/* top hat */}
      <path d="M35 28 Q35 25.6 38.5 25.4 L61.5 25.4 Q65 25.6 65 28 Q57 31 50 31 Q43 31 35 28 Z" />
      <path d="M41 25.4 L41.8 8.5 L58.2 8.5 L59 25.4 Z" />
      <path d="M41.4 17 h17.2 v4 h-17.2 z" className="p-band" />
      {/* pocketwatch */}
      <circle cx="50" cy="44" r="5.4" fill="none" strokeWidth="2.4" />
      <path d="M50 44 L50 40.8 M50 44 L52.4 45.4" fill="none" strokeWidth="1.8" />
      <path d="M43.5 9.5 L42.8 24 L45.6 24 L46.2 9.5 Z" className="p-hi" />
    </>
  ),
};

/* ============================= 14 · PIRATE ============================= */

const pirate: GlyphSet = {
  // cannonball with lit fuse
  0: (
    <>
      {Base}
      <path d="M40 74 Q38 68 42 64 L58 64 Q62 68 60 74 Z" />
      <circle cx="50" cy="47" r="15.5" />
      <path d="M52 32 Q54 26 51 21" fill="none" strokeWidth="2.6" />
      <path d="M51 21 L54 16.5 L55.5 21 L51.8 23 Z" />
      <circle cx="44.5" cy="41.5" r="4.6" className="p-hi" />
      <path d="M60 38 A15.5 15.5 0 0 1 60 56 A20 20 0 0 0 60 38 Z" className="p-sh" />
    </>
  ),
  // stern-castle rook
  3: (
    <>
      {Base}
      <path d="M37 74 L40 40 L36 40 L38 24 L44 26 L44 20 L50 23 L56 20 L56 26 L62 24 L64 40 L60 40 L63 74 Z" />
      {/* lantern */}
      <path d="M46 28 Q46 25 50 24.8 Q54 25 54 28 L54 33 L46 33 Z" className="p-eye" />
      {/* stern windows */}
      <circle cx="44" cy="50" r="2.6" className="p-eye" />
      <circle cx="50" cy="50" r="2.6" className="p-eye" />
      <circle cx="56" cy="50" r="2.6" className="p-eye" />
      <path d="M40 58 Q50 62 60 58 M40.5 66 Q50 70 59.5 66" fill="none" strokeWidth="2" opacity="0.55" />
      <path d="M42 41 L39.6 72 L43 72 L44.8 41 Z" className="p-hi" />
    </>
  ),
  // parrot knight
  1: (
    <>
      {Base}
      <path d="M42 77 Q39 66 40 54 Q41 42 47 34 Q43 33 40.5 30 Q37.5 26 38.5 21.5 Q43 19 47.5 20 Q50 13 58 11.5 Q66 10.5 70 16 Q73.5 21 71.5 28 Q75 34 74.5 42 Q74 54 68 63 Q63 71 56 74 Q58 75.8 57 77 Z" />
      {/* hooked beak */}
      <path d="M38.5 21.5 Q31 22 28 27 Q33 30.5 39 28.5 Q37.5 25 38.5 21.5 Z" />
      <path d="M28 27 Q30 31.5 35 32 Q33 29.5 32.5 27.6 Z" className="p-sh" />
      <circle cx="52" cy="21" r="2.8" className="p-eye" />
      {/* wing */}
      <path d="M52 40 Q62 38 67 44 Q64 47 58 47 Q64 49 66 54 Q61 56 56 53 Q60 58 58.5 63 Q52 61 49.5 54 Q47.5 47 52 40 Z" className="p-sh" />
      {/* head feathers */}
      <path d="M54 12.5 Q53 8 56 4.5 Q57.5 8 60 9.5 Z M61 11 Q61.5 6.5 65.5 4.5 Q65.5 8.5 67.5 11 Z" />
    </>
  ),
  // spyglass bishop
  2: (
    <>
      {Base}
      <path d="M43 74 Q45 68 44.5 62 L55.5 62 Q55 68 57 74 Z" />
      <path d="M45 62 L45 42 L55 42 L55 62 Z" />
      <path d="M46.5 42 L46.5 28 L53.5 28 L53.5 42 Z" />
      <path d="M47.8 28 L47.8 16 L52.2 16 L52.2 28 Z" />
      <path d="M45 47 h10 v3 h-10 z" className="p-band" />
      <path d="M46 33 h8 v2.6 h-8 z" className="p-band" />
      <circle cx="50" cy="13" r="3.4" />
      <circle cx="49" cy="12" r="1.3" className="p-hi" />
      <path d="M46.8 43 L46.8 60 L48.8 60 L48.8 43 Z" className="p-hi" />
    </>
  ),
  // cutlass queen
  4: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 26 C57 26 62.5 28.5 64.5 33 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L35.5 33 C37.5 28.5 43 26 50 26 Z" />
      {/* crossed cutlasses */}
      <path d="M38 8 Q46 14 56 22 L58.5 19.5 Q49 12.5 41 6 Q38.5 5.5 38 8 Z" />
      <path d="M62 8 Q54 14 44 22 L41.5 19.5 Q51 12.5 59 6 Q61.5 5.5 62 8 Z" />
      <path d="M37 25 Q44 21.5 50 21.5 Q56 21.5 63 25 Q56.5 28.5 50 28.5 Q43.5 28.5 37 25 Z" />
      <circle cx="50" cy="24.6" r="2.6" className="p-eye" />
      <path d="M41 32 L44.5 56 Q45.2 59.5 47.5 61 Q44 60 43 56 L39 33 Z" className="p-hi" />
    </>
  ),
  // captain king
  5: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 30 C58 30 64 33 65.5 38 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L34.5 38 C36 33 42 30 50 30 Z" />
      {/* bicorne hat */}
      <path d="M32 24 Q38 14 50 14 Q62 14 68 24 Q63 27.5 50 27.5 Q37 27.5 32 24 Z" />
      <path d="M36 21.5 Q42 24.6 50 24.6 Q58 24.6 64 21.5" fill="none" strokeWidth="2" opacity="0.5" />
      {/* skull & bones emblem */}
      <circle cx="50" cy="42" r="4.6" className="p-eye" />
      <path d="M43 48 L57 52 M57 48 L43 52" stroke="none" fill="none" />
      <path d="M44 47.4 L56 51.4 M56 47.4 L44 51.4" fill="none" strokeWidth="2.4" />
      <path d="M36 22 Q41 16.5 48 15 Q42.5 18.5 40 23.6 Z" className="p-hi" />
    </>
  ),
};

/* ============================= 15 · PHARAOH ============================= */

const pharaoh: GlyphSet = {
  // scarab pawn
  0: (
    <>
      {Base}
      <path d="M41 74 Q39 67 43 63 L57 63 Q61 67 59 74 Z" />
      <ellipse cx="50" cy="48" rx="14" ry="15" />
      <circle cx="50" cy="31" r="6" />
      <path d="M50 38 L50 62 M40 44 Q45 48 50 48 Q55 48 60 44" fill="none" strokeWidth="2.2" opacity="0.65" />
      <path d="M40 28 Q35 24 34.5 19 M60 28 Q65 24 65.5 19" fill="none" strokeWidth="2.4" />
      <path d="M42.5 42 Q41 50 43.5 58 Q40.5 52 41 44 Z" className="p-hi" />
    </>
  ),
  // pylon gate rook
  3: (
    <>
      {Base}
      <path d="M36 74 L40 30 L60 30 L64 74 Z" />
      <path d="M34 30 L36 22 L64 22 L66 30 Z" />
      <path d="M46 52 Q46 45 50 44 Q54 45 54 52 L54 66 L46 66 Z" className="p-eye" />
      <path d="M44 36 h12 v2.4 h-12 z" className="p-band" />
      <circle cx="50" cy="26" r="2" className="p-eye" />
      <path d="M42.5 31 L39 72 L42.4 72 L45.4 31 Z" className="p-hi" />
      <path d="M57.5 31 L61 72 L57.6 72 L54.6 31 Z" className="p-sh" />
    </>
  ),
  // Anubis knight
  1: (
    <>
      {Base}
      <g transform="translate(-4 0)">
        <path d="M74 77 L74.4 66 Q75.4 50 70 36 Q67 29 61 26.8 L62.8 12 Q62.9 9.6 60.4 10.6 L53.6 19.8 L50.4 19.8 L43.2 10.8 Q40.8 9.8 41 12.4 L43 26.6 L30 28 Q25.8 30 27 34.6 Q33.6 45.6 46.6 50.4 Q43 62.6 48.4 77 Z" />
        {/* long tall ears interiors */}
        <path d="M58.2 14.6 L57 24 L60.4 23 Z M45.6 15 L48 24 L44.6 23.4 Z" className="p-sh" />
        {/* eye + collar */}
        <path d="M40 31 a3 2 -12 1 0 0.1 0" className="p-eye" />
        <path d="M48 50.6 Q54 54 58 60 M50.8 48 Q57.6 50.6 62.4 55.4" fill="none" strokeWidth="2.4" opacity="0.6" />
        <path d="M27.4 36 Q31.6 39 36.4 40" fill="none" strokeWidth="2" />
        <path d="M61 28 Q66 32.4 68.2 39.4 Q70.4 48 70 58 Q69.8 67 68.6 75.4 L72.6 75.6 Q74 62.4 72.8 50.4 Q71.6 39.4 67.2 32.4 Q65 29.2 63.2 28 Z" className="p-sh" />
      </g>
    </>
  ),
  // obelisk bishop
  2: (
    <>
      {Base}
      <path d="M43 74 Q45 68 44.5 62 L55.5 62 Q55 68 57 74 Z" />
      <path d="M44.5 62 L47 18 L53 18 L55.5 62 Z" />
      <path d="M47 18 L50 8 L53 18 Z" />
      <path d="M48.6 28 L51.4 28 L51.4 40 L48.6 40 Z" className="p-eye" />
      <circle cx="50" cy="47" r="1.8" className="p-eye" />
      <path d="M47.4 52 h5.2 v2.2 h-5.2 z" className="p-eye" />
      <path d="M48 19 L46.2 60 L48 60 L49.4 19 Z" className="p-hi" />
    </>
  ),
  // sun-disc queen
  4: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 26 C57 26 62.5 28.5 64.5 33 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L35.5 33 C37.5 28.5 43 26 50 26 Z" />
      {/* horns + sun disc */}
      <path d="M38 25 Q33 18 34.5 9 Q38.5 13 42 14.5 Q40 19.5 39.5 25 Z" />
      <path d="M62 25 Q67 18 65.5 9 Q61.5 13 58 14.5 Q60 19.5 60.5 25 Z" />
      <circle cx="50" cy="15.5" r="7.5" />
      <path d="M38 25.5 Q44 22 50 22 Q56 22 62 25.5 Q56 28.6 50 28.6 Q44 28.6 38 25.5 Z" />
      <circle cx="47.6" cy="13" r="2.4" className="p-hi" />
      <path d="M41 32 L44.5 56 Q45.2 59.5 47.5 61 Q44 60 43 56 L39 33 Z" className="p-hi" />
    </>
  ),
  // pharaoh king
  5: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 30 C58 30 64 33 65.5 38 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L34.5 38 C36 33 42 30 50 30 Z" />
      {/* pschent double crown */}
      <path d="M38 28 L38 18 Q38 15 41 15 L59 15 Q62 15 62 18 L62 28 Q56 31 50 31 Q44 31 38 28 Z" />
      <path d="M45 15 Q45 6.5 50 5 Q55 6.5 55 15 Z" />
      {/* uraeus cobra */}
      <path d="M49 15 Q48 11.5 50.5 10 Q53 11 52 14" fill="none" strokeWidth="2" />
      {/* ankh */}
      <circle cx="50" cy="40" r="3" fill="none" strokeWidth="2.4" />
      <path d="M50 43 L50 52 M45.6 46.5 L54.4 46.5" fill="none" strokeWidth="2.4" />
      <path d="M40 19 L40 26.6 Q43 28.4 46 29.2 Q42.4 26.6 42.6 19 Z" className="p-hi" />
    </>
  ),
};

/* ========================== 16 · EMERALD DRAGON ========================== */

const dragon: GlyphSet = {
  // dragon egg
  0: (
    <>
      {Base}
      <path d="M41 74 Q39 67 43 63 L57 63 Q61 67 59 74 Z" />
      <path d="M50 24 Q62 34 62 48 Q62 60 50 63 Q38 60 38 48 Q38 34 50 24 Z" />
      <path d="M50 30 L54 36 L50 42 L46 36 Z M44 44 L48 50 L44 56 L40.5 50 Z M56 44 L60 50 L56 56 L52 50 Z" className="p-sh" />
      <path d="M44 34 Q40.5 42 41.5 52 Q39 44 42 33.6 Z" className="p-hi" />
    </>
  ),
  // dragon keep
  3: (
    <>
      {Base}
      <path d="M38 74 L40 36 L36 34 L37 20 L42 22 L43 16 L47 20 L50 13 L53 20 L57 16 L58 22 L63 20 L64 34 L60 36 L62 74 Z" />
      {/* wing buttresses */}
      <path d="M38 44 Q28 42 24 34 Q31 36 36 36 Q34 40 38 41 Z" />
      <path d="M62 44 Q72 42 76 34 Q69 36 64 36 Q66 40 62 41 Z" />
      <path d="M46 50 Q46 44 50 43 Q54 44 54 50 L54 58 L46 58 Z" className="p-eye" />
      <path d="M42 36 L40.4 72 L43.8 72 L45 37 Z" className="p-hi" />
    </>
  ),
  // dragon head knight
  1: (
    <>
      {Base}
      <g transform="translate(-5 0)">
        <path d="M75 77 L75.4 66 Q76.4 50 70.8 36 Q67.6 29 61.4 26.8 L64.4 18.6 Q65.4 15.6 62.4 16.6 L56.4 20.6 L57.4 12 Q57.4 9 54.8 11 L48.8 18.4 L44.4 26.4 L27.4 28.6 Q22.4 30.6 24 35.6 Q26.4 41 32.4 44.6 L28.4 44.4 Q31.4 49.6 38.8 51 Q43.4 51.8 48.4 51.6 Q44.4 63.6 49.8 77 Z" />
        {/* jaw + teeth */}
        <path d="M24.4 33.6 L29 35 L27 37.8 L32.4 38.4 L30.6 41.4 L35.8 41.6" fill="none" strokeWidth="2.2" />
        {/* eye slit */}
        <path d="M42 30 L47.4 31.6 L42.6 33.8 Z" className="p-eye" />
        {/* horns interior */}
        <path d="M61 19.4 L58.8 24.6 L62 23.8 Z M55 14.6 L52.6 20.8 L56 19.4 Z" className="p-sh" />
        {/* neck spines */}
        <path d="M61.4 26.8 L67 32 L63 33.6 L68.6 40 L64.8 41.2 L69.8 48.6 L66.4 49.6 L70.4 58 L67.4 58.6 L70 67 L67.8 67.4 L68.6 75.4 L72.8 75.6 Q74.4 62.4 73 50.4 Q71.6 39.4 67.4 32.6 Q64.8 29.4 63 28.2 Z" className="p-sh" />
        {/* scale hints */}
        <path d="M50 56 Q55 58 58 62 M48.6 62 Q53.6 64 56.6 68 M48.4 68 Q53 70 55.6 73.6" fill="none" strokeWidth="2" opacity="0.5" />
      </g>
    </>
  ),
  // talon bishop
  2: (
    <>
      {Base}
      <path d="M43 74 Q45 68 44.5 62 L55.5 62 Q55 68 57 74 Z" />
      <path d="M45 62 Q42 48 45.5 36 Q48 27 50 22 Q52 27 54.5 36 Q58 48 55 62 Z" />
      {/* curved talon tip */}
      <path d="M50 22 Q48 14 41 10.5 Q46 10 50.5 13 Q54 15.5 54.5 21 Q52.4 19.6 50 22 Z" />
      <path d="M48.6 34 L51.4 34 L51.4 46 L48.6 46 Z" className="p-eye" />
      <path d="M46 40 Q45 50 46.4 60 L48.4 60 Q47.4 50 48.4 38 Z" className="p-hi" />
    </>
  ),
  // wing-crown queen
  4: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 26 C57 26 62.5 28.5 64.5 33 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L35.5 33 C37.5 28.5 43 26 50 26 Z" />
      {/* bat-wing crown */}
      <path d="M46 24 Q38 22 35 15 Q34 9 39 7 Q39.5 11.5 43 13 Q42 16.5 45.5 18 Q45.5 21.5 48 23.4 Z" />
      <path d="M54 24 Q62 22 65 15 Q66 9 61 7 Q60.5 11.5 57 13 Q58 16.5 54.5 18 Q54.5 21.5 52 23.4 Z" />
      <circle cx="50" cy="20" r="3.6" />
      <circle cx="48.8" cy="18.8" r="1.4" className="p-hi" />
      <path d="M41 32 L44.5 56 Q45.2 59.5 47.5 61 Q44 60 43 56 L39 33 Z" className="p-hi" />
    </>
  ),
  // dragonfang king
  5: (
    <>
      {Base}
      <path d="M40 77 C38.5 71 41 66.5 42.5 61 L57.5 61 C59 66.5 61.5 71 60 77 Z" />
      <path d="M50 30 C58 30 64 33 65.5 38 L60 56 C59 60 55.5 62 50 62 C44.5 62 41 60 40 56 L34.5 38 C36 33 42 30 50 30 Z" />
      <path d="M36.5 38.5 C39 34.5 44 32.2 50 32.2 C56 32.2 61 34.5 63.5 38.5 L62 31.5 C59 28 55 26.3 50 26.3 C45 26.3 41 28 38 31.5 Z" className="p-band" />
      {/* fang crown */}
      <path d="M39 27 Q37 19 40.5 12 Q42.5 17 44.5 19 Q44 23 43 27 Z" />
      <path d="M61 27 Q63 19 59.5 12 Q57.5 17 55.5 19 Q56 23 57 27 Z" />
      <path d="M46.5 24 Q45.5 15 50 8 Q54.5 15 53.5 24 Q52 26 50 26 Q48 26 46.5 24 Z" />
      <circle cx="50" cy="42" r="2.6" className="p-eye" />
      <path d="M48 11.5 Q46.6 17 47.4 23 L49 24 Q48.4 17.5 49.6 11 Z" className="p-hi" />
    </>
  ),
};

export const THEME_GLYPHS: Record<number, GlyphSet> = {
  1: safari,
  2: cowboy,
  3: halloween,
  4: ocean,
  5: inferno,
  6: frost,
  7: cyber,
  8: royal,
  9: elven,
  10: galaxy,
  11: candy,
  12: samurai,
  13: steampunk,
  14: pirate,
  15: pharaoh,
  16: dragon,
  // variants — same hand-built sculpts, new materials
  17: royal,
  18: samurai,
  19: ocean,
  20: halloween,
};
