import { describe, expect, it } from 'vitest';
import { inCheck, isLegal, legalTargets, type LPiece } from './legal';

const s = (n: string) => (n.charCodeAt(1) - 49) * 8 + (n.charCodeAt(0) - 97);

const P = (ty: number, color: number, sq: string, hasMoved = false): LPiece => ({
  ty,
  color,
  sq: s(sq),
  hasMoved,
});

function startBoard(): LPiece[] {
  const back = [3, 1, 2, 4, 5, 2, 1, 3];
  const out: LPiece[] = [];
  back.forEach((ty, f) => {
    out.push({ ty, color: 0, sq: f, hasMoved: false });
    out.push({ ty, color: 1, sq: 56 + f, hasMoved: false });
  });
  for (let f = 0; f < 8; f++) {
    out.push({ ty: 0, color: 0, sq: 8 + f, hasMoved: false });
    out.push({ ty: 0, color: 1, sq: 48 + f, hasMoved: false });
  }
  return out;
}

describe('pawns', () => {
  it('single and double push from start', () => {
    const b = startBoard();
    expect(isLegal(b, s('e2'), s('e3'), 0)).toBe(true);
    expect(isLegal(b, s('e2'), s('e4'), 0)).toBe(true);
    expect(isLegal(b, s('e7'), s('e5'), 1)).toBe(true);
  });
  it('cannot push through or capture forward', () => {
    const b = [...startBoard(), P(1, 1, 'e3', true)];
    expect(isLegal(b, s('e2'), s('e3'), 0)).toBe(false);
    expect(isLegal(b, s('e2'), s('e4'), 0)).toBe(false);
  });
  it('captures diagonally only with an enemy present', () => {
    const b = startBoard();
    expect(isLegal(b, s('e2'), s('d3'), 0)).toBe(false);
    expect(isLegal([...b, P(1, 1, 'd3', true)], s('e2'), s('d3'), 0)).toBe(true);
  });
});

describe('king safety', () => {
  it('pinned piece cannot move off the pin line', () => {
    const b = [P(5, 0, 'e1'), P(3, 0, 'e2', true), P(3, 1, 'e8', true), P(5, 1, 'a8', true)];
    expect(isLegal(b, s('e2'), s('d2'), 0)).toBe(false);
    expect(isLegal(b, s('e2'), s('e5'), 0)).toBe(true);
  });
  it('while in check only resolving moves are legal', () => {
    const b = [
      P(5, 0, 'e1'),
      P(0, 0, 'a2'),
      P(3, 0, 'd4', true),
      P(3, 1, 'e8', true),
      P(5, 1, 'a8', true),
    ];
    expect(inCheck(b, 0)).toBe(true);
    expect(isLegal(b, s('a2'), s('a3'), 0)).toBe(false); // ignores the check
    expect(isLegal(b, s('e1'), s('d1'), 0)).toBe(true); // steps out
    expect(isLegal(b, s('d4'), s('e4'), 0)).toBe(true); // blocks
  });
});

describe('castling', () => {
  it('kingside works when clear and safe', () => {
    const b = [P(5, 0, 'e1'), P(3, 0, 'h1'), P(5, 1, 'e8')];
    expect(isLegal(b, s('e1'), s('g1'), 0)).toBe(true);
  });
  it('rejected through check or when moved', () => {
    const moved = [P(5, 0, 'e1', true), P(3, 0, 'h1'), P(5, 1, 'e8')];
    expect(isLegal(moved, s('e1'), s('g1'), 0)).toBe(false);
    const covered = [P(5, 0, 'e1'), P(3, 0, 'h1'), P(3, 1, 'f8', true), P(5, 1, 'a8', true)];
    expect(isLegal(covered, s('e1'), s('g1'), 0)).toBe(false);
  });
});

describe('legalTargets', () => {
  it('knight from start has two jumps', () => {
    const targets = legalTargets(startBoard(), s('g1'), 0);
    expect(targets.sort((a, b) => a - b)).toEqual([s('f3'), s('h3')].sort((a, b) => a - b));
  });
});
