# ChessV2 Phase 5: Ranked (ELO), Judge, Replays, Profiles

> REQUIRED SUB-SKILL: superpowers:executing-plans. Conventions as in Phase 1–2 plan.

**Design:**
- `player_profile` (public): account_id (unique), username, rating (start 1200), games, wins, losses, draws, streak (current win streak), peak. Created at register.
- `rating_history` (public): account_id, ts, rating — appended on every rated finish; powers profile graphs.
- `rated: bool` on Game. Quick match → rated. Challenges → rated (v1; casual toggle is later polish). ELO: K=32 while games<30 else 16; standard expected-score formula; draws 0.5. Applied in `finish_game` for rated games only; updates both profiles + history + streaks.
- Matchmaking: `join_queue` picks the *nearest-rating* waiting opponent (not FIFO).
- **Judge (client-side)**: from the authoritative `move_log` (each row has ts, captured_ty, board_after): per move, mover's material swing over the following 5s window → Brilliant (≥+3) / Good (>0) / Solid (0) / Inaccuracy (−1..−2) / Blunder (≤−3); accuracy % = weighted. Shown on the post-game result modal ("View report") and in replays.
- **Replays**: finished games persist (game + move_log + effect_log). Profile match history → ReplayScreen: board reconstructed per move from board_after snapshots; controls: ⏮ ◀ ▶ ⏭ + auto-play at real timing (capped 2s/step); judge grade overlay per move.
- **Profiles**: ProfileScreen for any player: rating + svg sparkline, W/L/D, streak, peak, last 20 games (result, vs, date, → Replay). Entry: tapping names in lobby/leaderboard; own profile button in header.
- **Leaderboard**: lobby panel — top 100 by rating with rank numbers; own row pinned.

**Tasks:** 1) server (profile/elo/history/rated/nearest pairing) + tests for elo math · 2) client leaderboard + profiles + sparkline · 3) judge module (TS, vitest) + report UI · 4) replay screen · 5) E2E (rated game updates both ratings; replay opens) · deploy.
