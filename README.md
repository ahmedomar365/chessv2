# ChessV2 — real-time chess

**Play at [chessv2.com](https://chessv2.com)** · no turns · every piece on its own cooldown · cards powered by time gems

> ⚠️ Accounts are username + password only. There is **no password recovery** — save your password somewhere safe.

## The game

- **Real-time chess**: any piece that is off cooldown can move — pawns 3s, knights/bishops 5s, rooks/kings 7s, queen 10s.
- **Check & mate-freeze**: while checked you may only play escaping moves; mated = frozen, but the game ends only when the **king is captured** — a card can still save you.
- **Cards & time gems** (1 gem / 5s, cap 10): Barrier 🛡, Reset ♻, Rewind ⏪ (20s board rewind), Guardian 👼 (passive king-save), Freeze 🧊, Pawn Storm ⚡, Swap 🔄, Time Theft ⏳. Deck of 8, max 3 copies per card, hand of 3.
- **Ranked ELO**, leaderboard, profiles with rating graphs, full **replays with move grading** (the judge).
- **Social**: global chat, in-game chat, direct & open challenges, League-style **live spectating** with separate spectator chat.
- **Practice bot** (TimeKeeper), interactive tutorial, installable **PWA**, full mobile support.
- **13 themes** (3 free) + card copies via dual currency: Coins (earned) / Crowns (PayPal).

## Architecture

```
server/    Rust SpacetimeDB module — ALL rules server-side (movement, cooldowns,
           check/mate, cards, ELO, chat, economy). Cheating is impossible by construction.
client/    React + TypeScript + Vite PWA. SVG board, SpacetimeDB React bindings.
payments/  Node payment service (PayPal bridge) — verifies captures server-side,
           grants Crowns via an operator-only reducer, idempotent by order id.
assets/    3D theme showcase scenes (Three.js).
scripts/   deploy-client.sh — build + rsync to the web root.
```

- Real-time backend: [SpacetimeDB Maincloud](https://spacetimedb.com) (module name `chessv2`)
- Web client: static hosting (aaPanel/Apache) at chessv2.com, `/api/pay/` proxied to the payment service
- Payments: PayPal (sandbox until live-flip via env)

## Development

```bash
# server module
cd server && cargo test                      # rules/auth/elo/cards unit tests
spacetime publish chessv2 --module-path server
spacetime generate --lang typescript --module-path server --out-dir client/src/module_bindings

# client
cd client && npm run dev                     # against live Maincloud
npx vitest run                               # legality mirror + judge tests
npx playwright test                          # 2-player + social E2E (desktop & mobile)

# deploy
./scripts/deploy-client.sh                   # uses git-ignored .deploy.env
```

## Security notes

This repo is **public**: credentials (`.secrets`, `.env*`, `.deploy.env`) are git-ignored and must never be committed. Passwords are argon2id-hashed inside the module; hands/wallets/decks are private tables exposed only through per-identity views; Crowns can only be granted by the pinned payment-service identity after server-side PayPal verification.
