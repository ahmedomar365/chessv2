/**
 * Post-game move grading ("the judge") — adapted to real-time chess.
 *
 * Classical engines assume turn order, which doesn't exist here. Instead each
 * move is graded by the mover's MATERIAL SWING over the 5 seconds that follow
 * it (from the authoritative move_log board snapshots): a capture that stands
 * is good; a piece that gets snapped back without compensation is a blunder.
 */

export interface JudgeMove {
  seq: number;
  tsMs: number;
  color: number;
  fromSq: number;
  toSq: number;
  boardAfter: string;
}

export type Grade = 'brilliant' | 'good' | 'solid' | 'inaccuracy' | 'blunder';

export interface GradedMove extends JudgeMove {
  grade: Grade;
  delta: number;
}

const VAL: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const WINDOW_MS = 5000;

export const START_SNAPSHOT =
  'RNBQKBNR' + 'PPPPPPPP' + '........'.repeat(4) + 'pppppppp' + 'rnbqkbnr';

/** Material balance from `color`'s perspective (own minus enemy). */
export function balance(snapshot: string, color: number): number {
  let own = 0;
  let enemy = 0;
  for (const ch of snapshot) {
    if (ch === '.') continue;
    const v = VAL[ch.toLowerCase()] ?? 0;
    const isWhite = ch === ch.toUpperCase();
    if ((color === 0) === isWhite) own += v;
    else enemy += v;
  }
  return own - enemy;
}

export function gradeMoves(moves: JudgeMove[]): GradedMove[] {
  const sorted = [...moves].sort((a, b) => a.seq - b.seq);
  return sorted.map((m, i) => {
    const before = i === 0 ? START_SNAPSHOT : sorted[i - 1].boardAfter;
    // last snapshot inside the settle window
    let settle = m.boardAfter;
    for (let j = i + 1; j < sorted.length && sorted[j].tsMs <= m.tsMs + WINDOW_MS; j++) {
      settle = sorted[j].boardAfter;
    }
    const delta = balance(settle, m.color) - balance(before, m.color);
    let grade: Grade;
    if (delta >= 3) grade = 'brilliant';
    else if (delta >= 1) grade = 'good';
    else if (delta === 0) grade = 'solid';
    else if (delta > -3) grade = 'inaccuracy';
    else grade = 'blunder';
    return { ...m, grade, delta };
  });
}

const GRADE_SCORE: Record<Grade, number> = {
  brilliant: 1,
  good: 1,
  solid: 0.85,
  inaccuracy: 0.4,
  blunder: 0,
};

/** Accuracy 0-100 for one player's moves. */
export function accuracy(graded: GradedMove[], color: number): number {
  const mine = graded.filter((g) => g.color === color);
  if (mine.length === 0) return 100;
  const sum = mine.reduce((acc, g) => acc + GRADE_SCORE[g.grade], 0);
  return Math.round((sum / mine.length) * 100);
}
