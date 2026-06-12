import { describe, expect, it } from 'vitest';
import { accuracy, balance, gradeMoves, START_SNAPSHOT, type JudgeMove } from './judge';

const set = (snap: string, sq: number, ch: string) => snap.slice(0, sq) + ch + snap.slice(sq + 1);

describe('balance', () => {
  it('start position is even', () => {
    expect(balance(START_SNAPSHOT, 0)).toBe(0);
    expect(balance(START_SNAPSHOT, 1)).toBe(0);
  });
  it('counts a missing enemy pawn as +1', () => {
    const snap = set(START_SNAPSHOT, 52, '.'); // black e7 pawn gone
    expect(balance(snap, 0)).toBe(1);
    expect(balance(snap, 1)).toBe(-1);
  });
});

describe('gradeMoves', () => {
  it('a clean standing capture is good', () => {
    let s1 = set(set(START_SNAPSHOT, 12, '.'), 28, 'P'); // white e4
    const moves: JudgeMove[] = [
      { seq: 0, tsMs: 0, color: 0, fromSq: 12, toSq: 28, boardAfter: s1 },
      // white captures black d-pawn moments later (simplified snapshot)
      { seq: 1, tsMs: 1000, color: 0, fromSq: 28, toSq: 51, boardAfter: set(set(s1, 28, '.'), 51, 'P') },
    ];
    const graded = gradeMoves(moves);
    expect(graded[1].delta).toBe(1);
    expect(graded[1].grade).toBe('good');
  });

  it('losing your queen in the window is a blunder', () => {
    const out = set(set(START_SNAPSHOT, 3, '.'), 31, 'Q'); // white queen to h4
    const taken = set(out, 31, '.'); // queen captured
    const moves: JudgeMove[] = [
      { seq: 0, tsMs: 0, color: 0, fromSq: 3, toSq: 31, boardAfter: out },
      { seq: 1, tsMs: 2000, color: 1, fromSq: 30, toSq: 31, boardAfter: taken },
    ];
    const graded = gradeMoves(moves);
    expect(graded[0].grade).toBe('blunder');
  });

  it('a quiet move is solid and captures outside the window do not count', () => {
    const s1 = set(set(START_SNAPSHOT, 12, '.'), 28, 'P');
    const s2 = set(s1, 28, '.'); // pawn captured LATER
    const moves: JudgeMove[] = [
      { seq: 0, tsMs: 0, color: 0, fromSq: 12, toSq: 28, boardAfter: s1 },
      { seq: 1, tsMs: 9000, color: 1, fromSq: 35, toSq: 28, boardAfter: s2 },
    ];
    const graded = gradeMoves(moves);
    expect(graded[0].grade).toBe('solid');
  });
});

describe('accuracy', () => {
  it('all solid = 85, blunders drag it down', () => {
    const s1 = set(set(START_SNAPSHOT, 12, '.'), 28, 'P');
    const moves: JudgeMove[] = [{ seq: 0, tsMs: 0, color: 0, fromSq: 12, toSq: 28, boardAfter: s1 }];
    expect(accuracy(gradeMoves(moves), 0)).toBe(85);
    expect(accuracy(gradeMoves(moves), 1)).toBe(100); // no moves
  });
});
