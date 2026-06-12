//! ELO math — pure, natively testable.

/// K-factor: provisional while young account.
pub fn k_factor(games_played: u32) -> f64 {
    if games_played < 30 { 32.0 } else { 16.0 }
}

/// Returns (new_a, new_b). `score_a`: 1.0 win, 0.5 draw, 0.0 loss for player A.
pub fn update(rating_a: i32, games_a: u32, rating_b: i32, games_b: u32, score_a: f64) -> (i32, i32) {
    let ea = 1.0 / (1.0 + 10f64.powf((rating_b - rating_a) as f64 / 400.0));
    let eb = 1.0 - ea;
    let na = rating_a as f64 + k_factor(games_a) * (score_a - ea);
    let nb = rating_b as f64 + k_factor(games_b) * ((1.0 - score_a) - eb);
    (na.round() as i32, nb.round() as i32)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn equal_ratings_win_moves_16_provisional_32() {
        let (a, b) = update(1200, 0, 1200, 0, 1.0);
        assert_eq!((a, b), (1216, 1184));
        let (a, b) = update(1200, 50, 1200, 50, 1.0);
        assert_eq!((a, b), (1208, 1192));
    }

    #[test]
    fn upset_win_pays_more() {
        let (a, _) = update(1200, 50, 1400, 50, 1.0);
        assert!(a - 1200 > 8, "beating a stronger player should pay > half K");
        let (c, _) = update(1400, 50, 1200, 50, 1.0);
        assert!(c - 1400 < 8, "beating a weaker player pays < half K");
    }

    #[test]
    fn draw_drains_higher_rated() {
        let (a, b) = update(1400, 50, 1200, 50, 0.5);
        assert!(a < 1400);
        assert!(b > 1200);
    }

    #[test]
    fn zero_sum_when_same_k() {
        let (a, b) = update(1300, 50, 1250, 50, 1.0);
        assert_eq!(a - 1300 + (b - 1250), 0);
    }
}
