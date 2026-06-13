# ChessV2 Phase 8: Platform & Polish — Tutorial, Bot, PWA, Anti-cheat

> REQUIRED SUB-SKILL: superpowers:executing-plans. Conventions as in Phase 1–2 plan.

**Design:**
- **Practice bot (server):** reserved account "TimeKeeper" created in init (no password — login impossible: pass_hash sentinel "!bot"). `play_bot` reducer starts an UNRATED game vs the bot. Scheduled `bot_timer` (every 1600ms ± jitter via rng, per bot game) picks a move with humanized priorities: escape check > best capture (MVV-LVA) > developing/random legal move, only with off-cooldown pieces; ~20% of ticks "think" (skip). Timer self-cancels when the game ends. Bot ignores cards (v1) — fair for practice.
- **Tutorial (client):** 6-step interactive overlay (replayable from lobby "How to play"): welcome → move pieces anytime (animated cooldown ring demo) → tiered cooldowns table → check & mate-freeze (king capture wins!) → gems & cards (hand demo) → ranked/cards economy. Mini themed SVG illustrations; auto-shown once (localStorage `chessv2_tutorial_seen`).
- **PWA:** manifest.json (standalone, theme #0b0d13, maskable icons), apple-touch-icon, minimal service worker (cache-first for hashed assets, network-first for index.html). Icons rasterized from the gem-rook SVG via headless browser screenshot.
- **Anti-cheat:** server-side per-game minimum inter-move spacing per player (120ms — generous for humans, blocks scripted bursts) + `flagged_account` table counting violations (visible to admin via SQL). Move legality/cooldowns already make material cheating impossible.
- Final: full test sweep, README feature list, deploy, live spot-check.
