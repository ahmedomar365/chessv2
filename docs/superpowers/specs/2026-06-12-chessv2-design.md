# ChessV2 — Design Spec

**Date:** 2026-06-12
**Status:** Approved by owner (sections reviewed individually)
**Live URL:** https://chessv2.com
**Repo:** https://github.com/ahmedomar365/chessv2 (PUBLIC — see Security)

## 1. Overview

ChessV2 is a real-time chess game: there are no turns — every piece has its own
cooldown and may move whenever ready. Players bring a deck of cards powered by
in-match time gems (shield a piece, reset a cooldown, rewind the board, …).
Around the game sits a full platform: accounts, ELO ranking, lobby with live
presence, direct/open challenges, quick match, global chat, League-style
spectating, replays with move grading, profiles, a tutorial, and a cosmetic
skin shop (13 themes, 3 free) monetized via PayPal with a dual-currency
economy (free Coins / paid Crowns).

Mobile-first: the client is a PWA that must be fully playable on phones.

## 2. Goals & non-goals

**Goals (launch):**
- Real-time cooldown chess with the card system, fully server-authoritative.
- Social platform: presence, global chat, challenges, quick match, spectating.
- Ranked ELO + leaderboard; post-game judge report; replays; profiles.
- Tutorial and practice bot.
- Skin shop with PayPal (sandbox first, then live), dual currency, card copies.
- Full mobile support (PWA), hosted at chessv2.com on aaPanel.

**Non-goals (post-launch roadmap):**
- Tournaments, daily puzzles, friends list, additional game modes/variants,
  mobile app-store builds. The data model must not preclude these.

## 3. Architecture

One public monorepo with three deployables:

```
chessv2/
├── client/     React + TypeScript + Vite SPA (PWA) → static build → aaPanel (chessv2.com)
├── server/     SpacetimeDB module (Rust) → published to SpacetimeDB Maincloud
├── payments/   Node.js payment-verification service → runs on owner's server (SSH), reverse-proxied at chessv2.com/api/pay
├── assets/     Theme sources (2D piece sets, Three.js 3D preview scenes)
└── docs/       Specs and plans
```

### 3.1 SpacetimeDB module (Rust) — single source of truth

All rules execute inside reducers; clients only send intents. The module owns:
move legality, cooldowns, check/mate freeze, card effects, gem accrual, win
detection, ELO updates, chat, presence, challenges, matchmaking, entitlements,
currency balances. Scheduled reducers drive time-based logic (game start
countdown, gem ticks, disconnect forfeit timers, matchmaking sweep).

Rationale: cheating is impossible by construction; the client is a view.

### 3.2 Client (React + TS + Vite, PWA)

- SpacetimeDB TypeScript SDK; table subscriptions feed React state directly
  (lobby, chat, board, spectate all live-update with no extra plumbing).
- The game board is an SVG layer inside a React component: crisp at any size,
  touch-friendly, and all animations (cooldown sweeps, barrier shields, repel
  bounces, rewind ghosting) are SVG/CSS — smooth on phones.
- Shop previews: live animated 2D board demo per theme plus an interactive 3D
  Three.js inspect view (in the style of the existing safari/cowboy assets).
- Static build deployed to aaPanel at chessv2.com.

### 3.3 Payment service (Node.js, on owner's server)

Exists because the PayPal secret cannot ship in a public client/repo and
SpacetimeDB modules cannot call external APIs.

- Endpoints: `POST /api/pay/create-order`, `POST /api/pay/capture-order`,
  `POST /api/pay/webhook`.
- Flow: client opens PayPal popup (PayPal JS SDK v6) → service creates the
  order → on approval the service captures it and verifies amount/currency
  against the catalog → service calls a privileged SpacetimeDB reducer
  (`grant_purchase`) using a server-only identity → entitlement appears live.
- PayPal webhooks (PAYMENT.CAPTURE.COMPLETED etc.) are backup reconciliation
  (player closed tab mid-purchase). Idempotent by PayPal order ID: a recorded
  order ID is never granted twice.
- Runs with sandbox credentials until end-to-end verified, then flipped to
  live via env var. Credentials live only in a git-ignored `.env` on the
  server (sourced from the local `.secrets`, never committed).

## 4. Accounts & auth

- One auth screen: username + password. Two explicit actions: **Log in** and
  **Create account**. Login NEVER auto-creates an account.
- Username: 3–16 chars, `[a-zA-Z0-9_]`, unique case-insensitively.
- Passwords argon2-hashed inside the module; never stored/logged in plain.
- Prominent note at registration and login: **"There is no password recovery.
  Save your password somewhere safe."**
- Session: on successful login the connection's SpacetimeDB identity is bound
  to the account; the client persists its token so users stay signed in.
  Multiple devices may be logged in; only one active game per account.

## 5. Game rules (real-time chess)

### 5.1 Movement & cooldowns

- Standard chess starting position. No turns: any of your pieces whose
  cooldown is ready may move, using normal chess movement for its type
  (paths must be clear except knights; no capturing your own pieces).
- The server resolves move intents atomically in arrival order; a move is
  validated against the board state at the instant it is processed.
- Per-type cooldown after moving (tunable constants):
  pawn 3s · knight 5s · bishop 5s · rook 7s · king 7s · queen 10s.
- Match start: synchronized countdown, then every piece starts on a 3s cooldown.
- Castling: classic conditions (king+rook unmoved, path clear, king not in
  check, king does not cross an attacked square — evaluated at that instant);
  both pieces receive their cooldowns. En passant is dropped (requires turn
  order). Pawns auto-promote to queen.

### 5.2 Check, mate, and game end

- If your king is attacked (check), only moves that result in your king not
  being attacked are legal; all other pieces are frozen.
- If no escaping move exists positionally (ignoring cooldowns), you are
  **mated**: fully frozen. The game does NOT end yet.
- **The game ends when a king is captured.** The mated player may still be
  saved by a card (Rewind, Barrier, Guardian) before the opponent's attacker
  comes off cooldown and takes the king. If the position changes so the mate
  no longer holds, the player unfreezes.
- Resign button. Draw by mutual agreement; auto-draw on king-vs-king.
- Disconnects: 60s grace to reconnect, else forfeit. Both disconnected → draw.

### 5.3 In-match economy: time gems & cards

- Time gems accrue automatically: 1 gem / 5s, cap 10 (tunable).
- Deck = chosen loadout: 8 cards, max 3 copies of any single card.
- Hand of 3; playing a card draws a replacement; when the deck empties, the
  discard pile reshuffles into a new deck (gems are the real limiter).
- Card visibility: your hand is private. Cards are public to opponent and
  spectators only at the moment they are played.

### 5.4 Initial card set (all effects server-side; numbers tunable)

| Card | Gem cost | Effect |
|------|----------|--------|
| 🛡️ Barrier | 3 | Shield one of your pieces. The next enemy piece that attempts to capture it is repelled back to the square it came from and receives its full cooldown. One charge, no time limit. Shield is visible to everyone. |
| ♻️ Reset | 2 | Target your piece: cooldown completes instantly. |
| ⏪ Rewind | 5 | The board is restored to its snapshot of 20s ago (implemented as a board-snapshot restore, so captures are revived and promotions undone automatically). Gems, hands, and played cards are NOT reverted. Every piece that moved back gets a 3s cooldown. |
| 👼 Guardian | — (passive) | Cannot be played manually. While in hand: if your king would be captured, it auto-triggers — the attacker is repelled to its origin square and receives 2× its full cooldown. Consumed on trigger (a replacement is drawn). |
| 🧊 Freeze | 3 | Target enemy piece: +8s added to its cooldown (starts one if ready). |
| ⚡ Pawn Storm | 4 | All of your pawns' cooldowns complete instantly. |
| 🔄 Swap | 4 | Swap the positions of two of your own pieces (neither may be on cooldown; both go on their cooldowns after). Cannot be used to escape check unless it actually escapes check (normal legality applies). |
| ⏳ Time Theft | 3 | Steal 2 gems from your opponent (capped by what they have). |

Card-play legality: while in check or fully frozen by mate, cards may still
be played (they are the comeback mechanic). Rewind that results in your king
still mated leaves you frozen. All targeting validated server-side.

## 6. Meta economy

- **Coins (free):** earned per game — win 100, loss 25, +10 per current win
  streak (cap +50). Tunable.
- **Crowns (paid):** PayPal packs — $0.99 → 100, $4.99 → 550, $9.99 → 1200.
- New accounts: 1 copy of every card + preset loadouts (sensible defaults).
- Extra card copies (to max 3): 200 Coins or 40 Crowns per copy.
- Loadout manager: several saved loadouts (LoL rune-page style), pick one in
  the pre-game screen; a default is always valid so quick match never blocks.
- All gameplay content is earnable free; Crowns are a shortcut + cosmetics.

## 7. Skins & shop

- A skin = a full visual theme (board + both sides' pieces). Your own view
  renders entirely in YOUR equipped theme (opponent's choice doesn't affect
  you; spectators see their own equipped theme).
- **13 themes. Free (3):** Classic, Safari, Cowboy (the two existing asset
  sets join the free tier). **Paid (10) at 100 Crowns (≈ $0.99) each:**
  Haunted Halloween, Deep Ocean, Inferno, Frostbite, Cyber Neon, Royal Gold,
  Elven Forest, Galaxy, Candyland, Samurai.
- Readability rule: every themed piece must be instantly recognizable as its
  chess role at mobile sizes (the Halloween rook is a haunted tower but it
  still reads as a rook). Same silhouette language across themes.
- In-game rendering: 2D vector (SVG) piece sets per theme.
- Shop: each theme has a live animated 2D board demo ("pieces in action") and
  an interactive 3D Three.js inspect view in the style of the existing
  safari/cowboy assets. Buy with Crowns; equip from profile or shop.

## 8. Social

- **Presence/lobby:** all online players, live, with status (lobby / in game
  / spectating) and rating. One active connection per player counts once.
- **Global chat:** lobby-wide, rate-limited (e.g. 1 msg/2s), profanity filter,
  per-user mute. Messages capped in length; history capped (e.g. last 200).
- **In-game chat:** between the two players. **Spectator chat:** separate
  channel visible only to spectators (no coaching).
- **Challenges:** direct challenge (target gets accept/decline notification),
  open challenge board (anyone may accept), and quick match queue (pairs by
  ELO, ±150 widening over time). Challenges may be rated or casual.
- **Spectate browser:** list of live games sorted by average ELO — "featured"
  top matches League-style. One click to watch: live board, both ratings, gem
  counts, cards as they are played (never hands), spectator count.

## 9. Ranked & ELO

- Start 1200. K=32 for first 30 rated games (provisional), then K=16.
- Updated by the module at game end (win/loss/draw). Rating history stored
  for profile graphs.
- Quick match is always rated; challenges choose rated/casual at creation.
- Leaderboard: top 100 + your own rank always shown.

## 10. Judge & anti-cheat

- Every move is persisted with timestamp and resulting board snapshot
  (also powers Rewind and replays).
- **Judge:** post-game, each move is graded (Brilliant / Good / Inaccuracy /
  Blunder) plus an overall accuracy %, using a material + threat heuristic
  adapted to real-time play (value captured/lost, pieces left hanging,
  escapes found). Computed client-side on the results screen from the
  authoritative move log; shown in replays too.
- **Anti-cheat:** server-authoritative rules make illegal moves impossible.
  Additionally: per-player command rate caps, minimum human-plausible action
  spacing, and automation heuristics (sustained sub-human reaction times,
  perfectly periodic actions) flag accounts on an internal review table.

## 11. Platform features

- **Tutorial:** interactive guided first game — movement → cooldowns → check
  & mate-freeze → gems & cards. Triggered on first login, replayable.
- **Practice bot:** simple server-side bot (move selection by shallow
  heuristic with humanized timing) to warm up against; unrated.
- **Replays:** any finished game replayable move-by-move (timeline scrubber,
  real-time or stepped) with judge grades overlaid.
- **Profiles:** rating + graph, games played, win rate, streaks, favorite
  cards, equipped skin, match history (→ replays).
- Post-launch roadmap: tournaments, daily puzzles, friends, more cards/themes.

## 12. Mobile (PWA)

- Installable PWA (manifest + service worker), fullscreen standalone mode.
- Portrait layout: board top, hand + gems bottom; landscape: side panels.
- Tap-tap and drag-to-move both supported; legal-move highlighting; touch
  targets ≥ 44px; all animations transform/opacity (GPU-friendly).
- Must remain fully playable on a mid-range phone over mobile data.

## 13. Data model sketch (SpacetimeDB tables)

`account` (identity, username, pass_hash, created) · `session` ·
`player_state` (status, rating, coins, crowns, equipped_skin, streak) ·
`card_catalog` · `card_ownership` (copies) · `loadout` / `loadout_card` ·
`skin_catalog` · `skin_ownership` · `game` (players, state, started, result) ·
`piece` (game, type, color, square, cooldown_until, shielded) ·
`move_log` (game, seq, ts, from, to, capture, snapshot) ·
`game_card_state` (deck order, hand, discard, gems, gem_ts) ·
`chat_message` (channel: global/game/spectator) · `challenge` ·
`queue_entry` · `spectator` · `purchase` (paypal_order_id UNIQUE, status) ·
`rating_history` · `flagged_account` · scheduler tables for ticks/timeouts.

Exact schema finalized during implementation planning.

## 14. Error handling

- Client intents that fail validation (cooldown not ready, illegal move,
  insufficient gems, bad target) are rejected by the reducer with a typed
  error; client shows a subtle shake/toast, never desyncs (server state wins).
- Optimistic UI is allowed for the local player's move animation but must
  reconcile to server state on rejection.
- Payment failures: order create/capture errors surface a clear retry UI;
  webhook reconciliation guarantees eventual grant for captured payments;
  every grant idempotent by PayPal order ID.
- Reconnect: client resubscribes and rebuilds state from tables (the server
  is always the truth); in-game reconnect within 60s resumes seamlessly.

## 15. Testing

- **Module (Rust):** unit tests for move legality (per piece type, paths,
  pins, castling), check/mate-freeze detection, every card effect (including
  Rewind windows and Guardian triggers), gem accrual, ELO math, win/draw
  conditions, forfeit timers.
- **Payments:** integration tests against PayPal sandbox — create/capture,
  wrong-amount rejection, webhook replay, double-grant prevention.
- **Client:** component tests for board interaction + legal-move display;
  E2E smoke (Playwright): register → login → quick match vs second client →
  move → card → win → ELO change → replay exists.
- Performance check on a throttled mobile profile (Lighthouse + manual).

## 16. Security (public repo!)

- Secrets NEVER in the repo: `.secrets`, `.env*` are git-ignored (already
  enforced; verified with `git check-ignore`). Provide `.env.example`
  templates with placeholder values only.
- PayPal secret + privileged SpacetimeDB identity live only on the owner's
  server. The privileged grant reducer rejects all other identities.
- Passwords argon2-hashed in the module. No password recovery by design —
  the UI warns users to save their password.
- Rate limits on auth attempts (per identity/IP-equivalent) to slow guessing.

## 17. Build phases (each ends with something working)

1. **Foundations:** monorepo scaffolding, SpacetimeDB module skeleton + auth
   (register/login/sessions), lobby presence list, deploy pipeline to
   Maincloud + aaPanel.
2. **Core game:** board UI, server-validated movement, cooldowns, check/
   mate-freeze, king capture, resign/draw/forfeit. Two browsers can play.
3. **Cards:** gems, deck/hand/draw, all 8 cards with animations.
4. **Social:** global chat, direct + open challenges, quick match, spectate
   browser + spectator chat.
5. **Ranked & review:** ELO + leaderboard, judge grading, replays, profiles.
6. **Economy:** Coins/Crowns, card copies, loadout manager, shop UI, PayPal
   sandbox end-to-end, then live flip.
7. **Skins:** 13 themes (2D sets), 3D shop previews, equipping.
8. **Platform & polish:** tutorial, practice bot, PWA install, mobile polish,
   anti-cheat heuristics, production hardening, launch.

## 18. Tunable constants (initial values)

Cooldowns P3/N5/B5/R7/K7/Q10 s · start countdown 3s · gem rate 1/5s cap 10 ·
hand 3 · deck 8 · max copies 3 · rewind window 20s · reconnect grace 60s ·
coin rewards 100/25 (+streak) · card copy 200c/40cr · skin 100cr ·
crown packs 100/550/1200 per $0.99/$4.99/$9.99 · ELO 1200 start, K 32→16.
