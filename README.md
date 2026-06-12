# chessv2

Real-time chess — every piece has its own cooldown, no turns. Play cards powered by time gems to protect pieces, reset cooldowns, or rewind the board. Ranked ELO, live spectating, global chat, and themed piece skins.

**Play at [chessv2.com](https://chessv2.com)**

> ⚠️ Accounts are username + password only. There is **no password recovery** — save your password somewhere safe.

## Tech

- **Real-time backend:** [SpacetimeDB](https://spacetimedb.com)
- **Web client:** hosted on chessv2.com (full mobile support)
- **Payments:** PayPal (skin shop)

## Development

```
server/    Rust SpacetimeDB module (all game rules, auth, state) — publish: spacetime publish chessv2 --module-path server
client/    React + TypeScript + Vite PWA — npm run dev / npm run build
assets/    Theme asset sources (3D preview scenes)
docs/      Design specs and implementation plans
```

After any change to tables/reducers, regenerate client bindings:
`spacetime generate --lang typescript --module-path server --out-dir client/src/module_bindings`

## Security note

This repo is public. Credentials (PayPal keys, SSH keys, `.secrets`, `.env`) are git-ignored and must never be committed.
