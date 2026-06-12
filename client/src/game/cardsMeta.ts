/** Client-side card metadata — must mirror server/src/cards.rs. */

export type TargetKind = 'own' | 'own-cooling' | 'enemy' | 'own-two' | 'none' | 'passive';

export interface CardMeta {
  id: number;
  name: string;
  icon: string;
  cost: number | null;
  target: TargetKind;
  blurb: string;
}

export const CARDS: Record<number, CardMeta> = {
  0: { id: 0, name: 'Barrier', icon: '🛡', cost: 3, target: 'own', blurb: 'Shield a piece — the next attacker is repelled' },
  1: { id: 1, name: 'Reset', icon: '♻', cost: 2, target: 'own-cooling', blurb: 'A cooling piece becomes instantly ready' },
  2: { id: 2, name: 'Rewind', icon: '⏪', cost: 5, target: 'none', blurb: 'The board returns to 20 seconds ago' },
  3: { id: 3, name: 'Guardian', icon: '👼', cost: null, target: 'passive', blurb: 'While in hand: auto-saves your king once' },
  4: { id: 4, name: 'Freeze', icon: '🧊', cost: 3, target: 'enemy', blurb: '+8s cooldown on an enemy piece' },
  5: { id: 5, name: 'Pawn Storm', icon: '⚡', cost: 4, target: 'none', blurb: 'All your pawns become instantly ready' },
  6: { id: 6, name: 'Swap', icon: '🔄', cost: 4, target: 'own-two', blurb: 'Swap two of your ready pieces' },
  7: { id: 7, name: 'Time Theft', icon: '⏳', cost: 3, target: 'none', blurb: 'Steal 2 gems from your opponent' },
};

export const GEM_PERIOD_MS = 5000;
export const GEM_CAP = 10;

export function gemsNow(base: number, anchorMs: number, nowMs: number): number {
  const elapsed = Math.max(0, nowMs - anchorMs);
  return Math.min(GEM_CAP, base + Math.floor(elapsed / GEM_PERIOD_MS));
}

/** Fraction of progress toward the next gem (0..1), 0 at cap. */
export function gemProgress(base: number, anchorMs: number, nowMs: number): number {
  if (gemsNow(base, anchorMs, nowMs) >= GEM_CAP) return 0;
  const elapsed = Math.max(0, nowMs - anchorMs);
  return (elapsed % GEM_PERIOD_MS) / GEM_PERIOD_MS;
}
