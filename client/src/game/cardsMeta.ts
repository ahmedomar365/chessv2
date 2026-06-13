/** Client-side card metadata — must mirror server/src/cards.rs. */

export type TargetKind =
  | 'own'
  | 'own-cooling'
  | 'enemy'
  | 'own-two'
  | 'none'
  | 'passive'
  | 'empty-home'
  | 'own-pawn'
  | 'any';

export type Rarity = 'common' | 'rare' | 'epic';

export interface CardMeta {
  id: number;
  name: string;
  icon: string;
  cost: number | null;
  target: TargetKind;
  blurb: string;
  rarity: Rarity;
}

export const CARDS: Record<number, CardMeta> = {
  0: { id: 0, name: 'Barrier', icon: '🛡', cost: 3, target: 'own', rarity: 'common', blurb: 'Shield a piece. The next attacker is repelled and fully exhausted.' },
  1: { id: 1, name: 'Reset', icon: '♻', cost: 2, target: 'own-cooling', rarity: 'common', blurb: 'A cooling piece becomes instantly ready.' },
  2: { id: 2, name: 'Rewind', icon: '⏪', cost: 5, target: 'none', rarity: 'epic', blurb: 'The entire board returns to 20 seconds ago. Fallen pieces rise again.' },
  3: { id: 3, name: 'Guardian', icon: '👼', cost: null, target: 'passive', rarity: 'epic', blurb: 'Passive: when your king would fall, the attacker is hurled back. Consumed.' },
  4: { id: 4, name: 'Freeze', icon: '🧊', cost: 3, target: 'enemy', rarity: 'common', blurb: 'Lock an enemy piece for 8 extra seconds.' },
  5: { id: 5, name: 'Pawn Storm', icon: '⚡', cost: 4, target: 'none', rarity: 'rare', blurb: 'Every one of your pawns becomes instantly ready.' },
  6: { id: 6, name: 'Swap', icon: '🔄', cost: 4, target: 'own-two', rarity: 'rare', blurb: 'Two of your ready pieces trade places.' },
  7: { id: 7, name: 'Time Theft', icon: '⏳', cost: 3, target: 'none', rarity: 'rare', blurb: 'Steal 2 gems from your opponent.' },
  8: { id: 8, name: 'Revive', icon: '🕊', cost: 5, target: 'empty-home', rarity: 'epic', blurb: 'Your most recently fallen piece returns on one of your two home ranks.' },
  9: { id: 9, name: 'Duplicate', icon: '👥', cost: 4, target: 'own-pawn', rarity: 'rare', blurb: 'A pawn splits in two — its copy appears beside it.' },
  10: { id: 10, name: 'Overclock', icon: '⚙', cost: 4, target: 'none', rarity: 'rare', blurb: 'All of your cooldowns are instantly halved.' },
  11: { id: 11, name: 'Stasis', icon: '🔮', cost: 4, target: 'any', rarity: 'epic', blurb: 'Any piece is locked in time for 8s — it cannot move or be captured.' },
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
