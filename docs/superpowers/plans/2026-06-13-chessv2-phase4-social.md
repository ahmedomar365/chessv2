# ChessV2 Phase 4: Social — Chat, Challenges, Spectating

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Conventions as in Phase 1–2 plan.

**Goal:** Global lobby chat, in-game + spectator chat, direct & open challenges, and a League-style live-game spectate browser.

**Design:**
- `chat_message` (public): `(msg_id, channel u8 [0 global, 1 game-players, 2 game-spectators], game_id, account_id, username, text, ts)`. Reducer `send_chat(channel, game_id, text)`: requires login; 200-char cap; 1 msg/2s per account (last_chat_ts on session... store in private `chat_throttle` table); profanity soft-filter (replace listed words with ***); only players may write channel 1, only spectators channel 2. History capped: on insert, delete global messages beyond the latest 200 (lazy prune); per-game chat pruned in finish_game? keep for replays — prune with snapshots.
- `challenge` (public): `(challenge_id, from_id, from_name, to_id [0 = open], to_name, created)`. Reducers: `create_challenge(to_account_id)` (0 = open challenge; reject if either party in game; one outstanding challenge per creator — replace), `accept_challenge(id)` (validates both free → start_game(challenger=white)), `decline_challenge(id)` (target or creator deletes). Challenges auto-delete when either party enters a game (cleanup in start_game) or creator disconnects fully.
- `spectator` (public): `(id, game_id, account_id, username)`. Reducers `spectate(game_id)` / `stop_spectating()`. Session status → 2 while spectating. finish_game clears spectators (status back to 0). Client subscribes to the game's tables (already public) — spectator GameScreen variant: white-POV board, no hand/controls, both gem meters, spectator count, spectator chat.
- Lobby UI: three panels under the play zone — Players (with Challenge button + incoming-challenge accept/decline banners), Live games (vs-card list sorted by recency → Watch), Global chat (collapsible, message list + input). Mobile: stacked, chat bottom-sheet style.
- GameScreen: chat toggle button in header → slide-up chat drawer (players see channel 1; spectators see channel 2 + read channel 1? No — spectators read/write 2 only; players read/write 1 only).

**Tasks:** 1) server tables+reducers+CLI smoke · 2) lobby UI (chat/challenges/games) · 3) spectator mode + in-game chat · 4) E2E (challenge flow + spectate + chat) · deploy.
