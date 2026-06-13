//! Card definitions and time-gem math. Pure — natively testable.

pub const GEM_PERIOD_MICROS: i64 = 5_000_000;
pub const GEM_CAP: u8 = 10;

pub const CARD_BARRIER: u8 = 0;
pub const CARD_RESET: u8 = 1;
pub const CARD_REWIND: u8 = 2;
pub const CARD_GUARDIAN: u8 = 3;
pub const CARD_FREEZE: u8 = 4;
pub const CARD_PAWN_STORM: u8 = 5;
pub const CARD_SWAP: u8 = 6;
pub const CARD_TIME_THEFT: u8 = 7;
pub const CARD_REVIVE: u8 = 8;
pub const CARD_DUPLICATE: u8 = 9;
pub const CARD_OVERCLOCK: u8 = 10;
pub const CARD_STASIS: u8 = 11;

/// Default starter loadout (deck size 8).
pub const DECK: [u8; 8] = [0, 1, 2, 3, 4, 5, 6, 7];
/// Every card in the game (collection).
pub const ALL_CARDS: [u8; 12] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
pub const HAND_SIZE: usize = 3;

/// Gem cost per card. Guardian is passive (255 = unplayable).
pub fn cost_of(card: u8) -> u8 {
    match card {
        CARD_BARRIER => 3,
        CARD_RESET => 2,
        CARD_REWIND => 5,
        CARD_GUARDIAN => 255,
        CARD_FREEZE => 3,
        CARD_PAWN_STORM => 4,
        CARD_SWAP => 4,
        CARD_TIME_THEFT => 3,
        CARD_REVIVE => 5,
        CARD_DUPLICATE => 4,
        CARD_OVERCLOCK => 4,
        CARD_STASIS => 4,
        _ => 255,
    }
}

/// Current gems given a base count and the time it was anchored.
pub fn gems_now(base: u8, anchor_micros: i64, now_micros: i64) -> u8 {
    let elapsed = (now_micros - anchor_micros).max(0);
    let accrued = (elapsed / GEM_PERIOD_MICROS) as i64;
    (base as i64 + accrued).min(GEM_CAP as i64) as u8
}

/// Spend `cost` gems: returns the new (base, anchor) or None if unaffordable.
/// Re-anchoring preserves partial progress toward the next gem.
pub fn spend(base: u8, anchor_micros: i64, now_micros: i64, cost: u8) -> Option<(u8, i64)> {
    let have = gems_now(base, anchor_micros, now_micros);
    if have < cost {
        return None;
    }
    let new_base = have - cost;
    let elapsed = (now_micros - anchor_micros).max(0);
    let partial = if have >= GEM_CAP { 0 } else { elapsed % GEM_PERIOD_MICROS };
    Some((new_base, now_micros - partial))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn gems_accrue_and_cap() {
        assert_eq!(gems_now(0, 0, 0), 0);
        assert_eq!(gems_now(0, 0, 4_999_999), 0);
        assert_eq!(gems_now(0, 0, 5_000_000), 1);
        assert_eq!(gems_now(0, 0, 23_000_000), 4);
        assert_eq!(gems_now(0, 0, 500_000_000), GEM_CAP);
        assert_eq!(gems_now(8, 0, 20_000_000), GEM_CAP); // 8 + 4 capped
    }

    #[test]
    fn spend_rejects_when_short() {
        assert_eq!(spend(0, 0, 9_000_000, 2), None); // only 1 gem
    }

    #[test]
    fn spend_preserves_partial_progress() {
        // 7s elapsed → 1 gem + 2s progress; spend 1 → base 0, anchor 2s back
        let (base, anchor) = spend(0, 0, 7_000_000, 1).unwrap();
        assert_eq!(base, 0);
        assert_eq!(anchor, 5_000_000);
        // 3 more seconds → next gem arrives exactly at 10s mark
        assert_eq!(gems_now(base, anchor, 9_999_999), 0);
        assert_eq!(gems_now(base, anchor, 10_000_000), 1);
    }

    #[test]
    fn spend_at_cap_resets_progress() {
        // at cap, partial progress is meaningless (it wasn't accruing)
        let (base, anchor) = spend(GEM_CAP, 0, 60_000_000, 3).unwrap();
        assert_eq!(base, 7);
        assert_eq!(anchor, 60_000_000);
    }

    #[test]
    fn costs_match_spec() {
        assert_eq!(cost_of(CARD_BARRIER), 3);
        assert_eq!(cost_of(CARD_RESET), 2);
        assert_eq!(cost_of(CARD_REWIND), 5);
        assert_eq!(cost_of(CARD_GUARDIAN), 255);
        assert_eq!(cost_of(CARD_FREEZE), 3);
        assert_eq!(cost_of(CARD_PAWN_STORM), 4);
        assert_eq!(cost_of(CARD_SWAP), 4);
        assert_eq!(cost_of(CARD_TIME_THEFT), 3);
    }
}
