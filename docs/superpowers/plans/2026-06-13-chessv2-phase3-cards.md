# ChessV2 Phase 3: Cards & Time Gems — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Conventions (publish, bindings regen, commit trailer) as in the Phase 1–2 plan.

**Goal:** Both players bring a deck of 8 cards, hold a hand of 3, accrue time gems (1 per 5s, cap 10), and play all 8 spec cards with full server-side validation and animated client feedback.

**Key design decisions:**

- **Gems are computed, not ticked.** Public table `game_gems(game_id, account_id, base, anchor_ts)`: current = min(10, base + floor((now-anchor)/5s)). Spending recomputes and re-anchors. Client renders the same formula locally — zero network traffic for accrual.
- **Hands are private via a `#[view]`.** `game_card_state` (deck order, hand, discard) is a PRIVATE table; a public view `my_card_state(ctx)` returns only the sender's row. Opponents/spectators see plays via the public `effect_log`, never hands.
- **`effect_log` powers animations + spectators**: `(game_id, seq, ts, kind, actor_color, card, a_sq, b_sq)` — kinds: card_played, repel, guardian_save, rewind, freeze, reset, pawn_storm, swap, theft, shield_set.
- **Rewind needs exact state** → private `piece_snapshot(game_id, seq, ty, color, sq, has_moved)` written after every move AND every board-mutating card; restore = latest snapshot with ts ≤ now−20s (else starting position). Restored pieces get 3s cooldown; gems/hands/cooldown anchors are NOT reverted. Snapshots pruned on game end.
- **Barrier** sets `shielded` on the Piece row (public — shields are visible). In `move_piece`, a capture attempt on a shielded piece consumes the shield, cancels the move, and gives the attacker its full cooldown (it never leaves its square — the client animates the bounce from `effect_log` repel). **Guardian** is the same interception on the king when the defender holds Guardian in hand: 2× attacker cooldown, card consumed, replacement drawn.
- **Card legality:** playable while checked or mated (the comeback mechanic). Swap may not leave your own king attacked. Reset/Freeze/Storm/Theft never change check flags; Rewind and Swap trigger `refresh_check_flags`.
- **Default deck until Phase 6 economy:** every player gets all 8 cards, deck shuffled with `ctx.rng` at game start.

**Cards (id, cost):** 0 Barrier 3 · 1 Reset 2 · 2 Rewind 5 · 3 Guardian — (passive) · 4 Freeze 3 · 5 Pawn Storm 4 · 6 Swap 4 · 7 Time Theft 3.

### Task 1: Server — tables, dealing, gem math
- `cards.rs`: const card defs; pure `gems_now(base, anchor_us, now_us)` + `spend(...)` with cargo tests (cap, accrual, spend re-anchor).
- Tables: `game_gems` (public), `game_card_state` (private: deck Vec<u8>, hand Vec<u8>, discard Vec<u8>), `effect_log` (public), `piece_snapshot` (private); `shielded: bool` on Piece (default false).
- `#[view(accessor = my_card_state, public)]` returning sender's rows (one per live game).
- `start_game` deals: shuffled 8-card deck, draw 3, gems base 0 anchored at go-time. Initial snapshot seq 0.
- `finish_game` prunes snapshots + card state + gems.

### Task 2: Server — play_card + interceptions
- `play_card(game_id, hand_index, target_a: u8, target_b: u8)` (255 = none): validate live game, membership, hand slot, cost, target ownership/state per card; apply effect; discard + draw (reshuffle discard when deck empties); log effects; snapshot if board changed.
- `move_piece`: barrier/guardian interception before applying capture; snapshot after each applied move; mate flags can be lifted by later board changes (already recomputed each move).
- CLI smoke: reset-card on cooldown piece, barrier repel, freeze, theft, rewind restores a capture, guardian saves a mated king.

### Task 3: Client — gems, hand, targeting, effects
- `useTable` on `my_card_state` view + `game_gems` + `effect_log` (filtered by game).
- Gem meter: 10 diamond pips, fill animates from the computed formula (rAF).
- Hand: 3 card tiles (icon, name, cost; Guardian shows "passive"); disabled while unaffordable; tap → targeting mode (legal targets highlighted per card type: own pieces / cooling own / enemy / two own / none) → tap target(s) → `playCard`. Cancel by re-tap.
- Effects from `effect_log`: shield bubble (persistent on shielded pieces), repel bounce (attacker lunge-return), freeze tint + ice crack, reset flash, storm wave on pawns, swap arc, rewind ghost-dissolve (board re-renders from state anyway), "opponent played X" toast.
- Result of card errors → toast (not enough gems, bad target, etc.).

### Task 4: Verify, E2E, deploy
- Playwright: extend game spec — A plays pawn, uses Reset on it, immediately moves it again (proves reset); assert gem count decreased; B sees "played Reset" effect entry. 
- cargo + vitest + both Playwright projects green → deploy to chessv2.com → live spot-check.
