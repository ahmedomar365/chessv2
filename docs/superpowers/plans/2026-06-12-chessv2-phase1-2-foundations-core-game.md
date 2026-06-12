# ChessV2 Phases 1–2: Foundations + Core Real-Time Game — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two players can register at chessv2.com, queue, and play full real-time cooldown chess (tiered cooldowns, check/mate-freeze, win by king capture) on desktop and mobile, with all rules enforced by the SpacetimeDB module.

**Architecture:** Rust SpacetimeDB module on Maincloud is the single authority (auth, presence, pairing, move legality, cooldowns, check/mate freeze, game end). React+TS+Vite PWA client with an SVG board renders synced tables and sends intents. Static build deploys to aaPanel at chessv2.com.

**Tech Stack:** Rust + `spacetimedb` crate (module), `argon2` (password hashing), React 18 + TypeScript + Vite, `@clockworklabs/spacetimedb-sdk`, Playwright (E2E).

**Spec:** `docs/superpowers/specs/2026-06-12-chessv2-design.md`. Later phases (cards, social, ranked, economy, skins, platform) get their own plans.

**Conventions for every task:** run module tests with `cargo test` in `server/`; publish with `spacetime publish chessv2 --project-path server`; regenerate client bindings with `spacetime generate --lang typescript --out-dir client/src/module_bindings --project-path server` after ANY table/reducer change; never commit `.secrets`/`.env*`; commit after each green step with the `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` trailer.

---

### Task 1: Monorepo scaffold

**Files:**
- Create: `server/Cargo.toml`, `server/src/lib.rs` (stub)
- Create: `client/` via Vite react-ts template
- Modify: `README.md` (dev setup section)

- [ ] **Step 1: Create the Rust module crate**

`server/Cargo.toml`:

```toml
[package]
name = "chessv2-module"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
spacetimedb = "1"
argon2 = { version = "0.5", default-features = false, features = ["alloc", "password-hash"] }

[profile.release]
opt-level = "z"
```

`server/src/lib.rs` stub:

```rust
pub mod rules;

use spacetimedb::{reducer, ReducerContext};

#[reducer(init)]
pub fn init(_ctx: &ReducerContext) {}
```

with empty `server/src/rules.rs` (`//! Chess rules engine` placeholder module).

- [ ] **Step 2: Verify it builds for wasm**

Run: `cd server && cargo build --target wasm32-unknown-unknown --release` (install target first if needed: `rustup target add wasm32-unknown-unknown`). Expected: success.

- [ ] **Step 3: Scaffold the client**

```bash
cd /Users/ahmedomar/Documents/delta/ChessV2
npm create vite@latest client -- --template react-ts
cd client && npm install && npm install @clockworklabs/spacetimedb-sdk
npm run build   # expected: success
```

Delete Vite demo cruft (`App.css` contents, logo assets); keep a minimal `App.tsx` rendering `<h1>ChessV2</h1>`.

- [ ] **Step 4: Commit**

```bash
git add server client README.md && git commit -m "feat: scaffold monorepo (Rust module + React client)"
```

---

### Task 2: Chess rules engine (pure Rust, TDD)

The heart of the game. Pure functions, no SpacetimeDB types — fully unit-testable.

**Files:**
- Create: `server/src/rules.rs`
- Test: inline `#[cfg(test)]` module in `rules.rs`

- [ ] **Step 1: Define the core types and board**

```rust
//! Chess rules engine — pure, no DB types. Squares are 0..64, a1=0, h8=63.

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum PieceType { Pawn, Knight, Bishop, Rook, Queen, King }

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Color { White, Black }

impl Color { pub fn other(self) -> Color { if self == Color::White { Color::Black } else { Color::White } } }

#[derive(Clone, Debug)]
pub struct BoardPiece { pub ty: PieceType, pub color: Color, pub sq: u8, pub has_moved: bool }

#[derive(Clone, Default, Debug)]
pub struct Board { pub pieces: Vec<BoardPiece> }

#[derive(Debug, PartialEq)]
pub struct MoveOutcome {
    pub captured_sq: Option<u8>,
    pub rook_move: Option<(u8, u8)>, // castling: rook from→to
    pub promotes: bool,              // pawn reached last rank (auto-queen)
}

#[derive(Debug, PartialEq)]
pub enum MoveError { NoPiece, NotYours, BadDestination, PathBlocked, OwnPieceAtDest, IllegalForPiece, LeavesKingAttacked, BadCastle }

pub fn file(sq: u8) -> i8 { (sq % 8) as i8 }
pub fn rank(sq: u8) -> i8 { (sq / 8) as i8 }

impl Board {
    pub fn at(&self, sq: u8) -> Option<&BoardPiece> { self.pieces.iter().find(|p| p.sq == sq) }
    pub fn starting() -> Board { /* standard setup: back ranks + pawns for both colors */ }
}
```

`Board::starting()` builds the standard position (white back rank on squares 0–7, white pawns 8–15, black pawns 48–55, black back rank 56–63).

- [ ] **Step 2: Write failing tests for raw movement** (before implementing `is_legal_move`)

Cover, as separate `#[test]` fns: pawn single/double push (double only when unmoved), pawn blocked by any piece, pawn diagonal capture only when enemy present, knight L-jumps (incl. over pieces), bishop/rook/queen sliding + `PathBlocked`, king one step, `OwnPieceAtDest`, off-board/`BadDestination` (from==to). Example shape:

```rust
#[test]
fn pawn_cannot_push_through_blocker() {
    let mut b = Board::starting();
    b.pieces.push(BoardPiece { ty: PieceType::Knight, color: Color::Black, sq: 16, has_moved: true }); // a3
    assert_eq!(is_legal_move(&b, 8, 16, Color::White).unwrap_err(), MoveError::PathBlocked);
    assert_eq!(is_legal_move(&b, 8, 24, Color::White).unwrap_err(), MoveError::PathBlocked); // a2-a4 also blocked
}
```

Run: `cargo test` → expected: compile error / failures (functions missing).

- [ ] **Step 3: Implement movement + attack detection**

```rust
fn pseudo_legal(board: &Board, p: &BoardPiece, to: u8) -> Result<(), MoveError> { /* per-type geometry + path clearance via step-walking; pawns: forward pushes need empty squares, diagonals need enemy */ }

pub fn is_attacked(board: &Board, sq: u8, by: Color) -> bool {
    board.pieces.iter().filter(|p| p.color == by)
        .any(|p| attacks(board, p, sq))
}
// attacks() = pseudo_legal capture geometry (pawn diagonals only, ignore pawn pushes)

pub fn in_check(board: &Board, color: Color) -> bool {
    board.pieces.iter().find(|p| p.ty == PieceType::King && p.color == color)
        .map(|k| is_attacked(board, k.sq, color.other())).unwrap_or(false)
}
```

- [ ] **Step 4: Write failing tests for king safety, castling, mate-freeze**

- pinned piece cannot move (`LeavesKingAttacked`)
- any move while in check must resolve the check
- castling: legal kingside/queenside; rejected if king moved, rook moved, path blocked, king in check, king crosses attacked square
- promotion flag set when pawn reaches last rank
- `has_any_escape`: a back-rank-mate position returns false; same position with a defending rook available returns true
- `apply_move` mutates board correctly (capture removes piece, castle moves rook, promotion converts to queen, `has_moved` set)

- [ ] **Step 5: Implement `is_legal_move`, `apply_move`, `has_any_escape`**

```rust
pub fn is_legal_move(board: &Board, from: u8, to: u8, mover: Color) -> Result<MoveOutcome, MoveError> {
    // 1. piece exists & is mover's; 2. dest != from, on board, not own piece
    // 3. castling branch: king moving two files → validate full castle rules → MoveOutcome{rook_move}
    // 4. else pseudo_legal(); 5. simulate on a clone via apply_move; if in_check(mover) → LeavesKingAttacked
    // 6. MoveOutcome{captured_sq: enemy at dest, promotes: pawn at last rank}
}

pub fn apply_move(board: &mut Board, from: u8, to: u8, outcome: &MoveOutcome) { /* remove captured, move piece, rook_move, promote to Queen, set has_moved */ }

pub fn has_any_escape(board: &Board, color: Color) -> bool {
    // for every piece of `color`, for every square 0..64: is_legal_move ok? → true. (Ignores cooldowns by design: mate is positional.)
}
```

- [ ] **Step 6: Run `cargo test` → all green. Commit** `feat(server): chess rules engine with full legality, check, castling, mate detection`

---

### Task 3: Module schema, presence lifecycle, first publish

**Files:**
- Modify: `server/src/lib.rs`
- Create: `client/src/module_bindings/` (generated)

- [ ] **Step 1: Define tables + lifecycle reducers**

```rust
use spacetimedb::{table, reducer, ReducerContext, Identity, Timestamp, Table, ScheduleAt};

#[table(name = account)] // PRIVATE — holds pass_hash
pub struct Account {
    #[primary_key] #[auto_inc] pub account_id: u64,
    #[unique] pub username_lower: String,
    pub username: String,
    pub pass_hash: String,
    pub created_at: Timestamp,
}

#[table(name = session, public)] // who is online & which account an identity is logged into
pub struct Session {
    #[primary_key] pub identity: Identity,
    pub account_id: u64, // 0 = connected but not logged in
    pub username: String,
    pub online: bool,
    pub status: u8, // 0 lobby, 1 in_game, 2 spectating
}

#[table(name = game, public)]
pub struct Game {
    #[primary_key] #[auto_inc] pub game_id: u64,
    pub white_id: u64, pub black_id: u64,
    pub white_name: String, pub black_name: String,
    pub phase: u8,            // 0 countdown, 1 live, 2 finished
    pub started_at: Timestamp,
    pub result: u8,           // 0 none, 1 white wins, 2 black wins, 3 draw
    pub result_reason: u8,    // 0 none, 1 king captured, 2 resign, 3 forfeit, 4 agreement
    pub white_in_check: bool, pub black_in_check: bool,
    pub white_mated: bool, pub black_mated: bool,
}

#[table(name = piece, public)]
pub struct Piece {
    #[primary_key] #[auto_inc] pub piece_id: u64,
    #[index(btree)] pub game_id: u64,
    pub ty: u8, pub color: u8, pub sq: u8,
    pub has_moved: bool,
    pub cooldown_until: Timestamp,
}

#[table(name = move_log, public)]
pub struct MoveLog {
    #[primary_key] #[auto_inc] pub move_id: u64,
    #[index(btree)] pub game_id: u64,
    pub seq: u32, pub ts: Timestamp,
    pub color: u8, pub from_sq: u8, pub to_sq: u8,
    pub captured_ty: u8, // 255 = none
    pub board_after: String, // 64-char snapshot, '.' empty, pnbrqk/PNBRQK
}

#[table(name = queue_entry, public)]
pub struct QueueEntry { #[primary_key] pub account_id: u64, pub username: String, pub queued_at: Timestamp }

#[reducer(client_connected)]
pub fn client_connected(ctx: &ReducerContext) { /* upsert Session{identity: ctx.sender, online: true}, keep account_id if rejoining */ }

#[reducer(client_disconnected)]
pub fn client_disconnected(ctx: &ReducerContext) { /* set online=false; if logged in & in live game → schedule forfeit (Task 5); remove from queue */ }
```

Conversion helpers between `u8` codes and `rules::PieceType`/`Color` live next to the tables (`fn ty_to_u8`, `fn u8_to_ty`, etc.), plus `fn board_from_pieces(game_id, ctx) -> rules::Board` and `fn snapshot_string(board) -> String`.

- [ ] **Step 2: Publish & generate bindings**

```bash
spacetime publish chessv2 --project-path server          # creates the Maincloud DB on first publish
spacetime generate --lang typescript --out-dir client/src/module_bindings --project-path server
cd client && npm run build                               # bindings compile
```

Expected: publish OK; `spacetime list` now shows `chessv2`; client builds.

- [ ] **Step 3: Commit** `feat(server): schema v1 (accounts, sessions, games, pieces, moves, queue) + presence lifecycle`

---

### Task 4: Auth — register & login (argon2)

**Files:**
- Create: `server/src/auth.rs` (pure hash helpers + validation)
- Modify: `server/src/lib.rs` (reducers)

- [ ] **Step 1: Failing tests for username validation + hash roundtrip**

```rust
#[test] fn username_rules() {
    assert!(validate_username("ab").is_err());            // too short
    assert!(validate_username("a".repeat(17).as_str()).is_err());
    assert!(validate_username("bad name!").is_err());     // charset
    assert!(validate_username("Good_Name1").is_ok());
}
#[test] fn hash_roundtrip() {
    let h = hash_password("hunter22", b"0123456789abcdef");
    assert!(verify_password("hunter22", &h));
    assert!(!verify_password("wrong", &h));
}
```

- [ ] **Step 2: Implement helpers**

```rust
use argon2::{Argon2, Algorithm, Version, Params, PasswordHash, PasswordHasher, PasswordVerifier};
use argon2::password_hash::SaltString;

// Tuned for wasm: 8 MiB, t=2. If publish/energy limits complain, drop m_cost to 4096.
fn argon() -> Argon2<'static> { Argon2::new(Algorithm::Argon2id, Version::V0x13, Params::new(8192, 2, 1, None).unwrap()) }

pub fn hash_password(pw: &str, salt16: &[u8]) -> String {
    let salt = SaltString::encode_b64(salt16).unwrap();
    argon().hash_password(pw.as_bytes(), &salt).unwrap().to_string()
}
pub fn verify_password(pw: &str, stored: &str) -> bool {
    PasswordHash::new(stored).map(|h| argon().verify_password(pw.as_bytes(), &h).is_ok()).unwrap_or(false)
}
pub fn validate_username(u: &str) -> Result<(), String> { /* 3–16 chars, [A-Za-z0-9_] */ }
```

Run `cargo test` → green.

- [ ] **Step 3: Reducers** (salt from `ctx.rng()` bytes — uniqueness is what matters; password min 6 chars; login NEVER creates)

```rust
#[reducer]
pub fn register(ctx: &ReducerContext, username: String, password: String) -> Result<(), String> {
    auth::validate_username(&username)?;
    if password.len() < 6 { return Err("Password must be at least 6 characters".into()); }
    let lower = username.to_lowercase();
    if ctx.db.account().username_lower().find(&lower).is_some() { return Err("Username already taken".into()); }
    let mut salt = [0u8; 16]; ctx.rng().fill_bytes(&mut salt);
    let acc = ctx.db.account().insert(Account { account_id: 0, username_lower: lower, username: username.clone(), pass_hash: auth::hash_password(&password, &salt), created_at: ctx.timestamp });
    bind_session(ctx, acc.account_id, &username); // sets Session.account_id + username for ctx.sender
    Ok(())
}

#[reducer]
pub fn login(ctx: &ReducerContext, username: String, password: String) -> Result<(), String> {
    let acc = ctx.db.account().username_lower().find(&username.to_lowercase())
        .ok_or("Account does not exist")?;                      // explicitly NO auto-create
    if !auth::verify_password(&password, &acc.pass_hash) { return Err("Wrong password".into()); }
    bind_session(ctx, acc.account_id, &acc.username);
    Ok(())
}

#[reducer]
pub fn logout(ctx: &ReducerContext) { /* Session.account_id = 0, leave queue */ }
```

- [ ] **Step 4: Publish, regenerate bindings, smoke-test from CLI**

```bash
spacetime publish chessv2 --project-path server
spacetime call chessv2 register '"tester1"' '"secret1"'
spacetime sql chessv2 'SELECT username FROM session'   # expect tester1 bound
```

- [ ] **Step 5: Commit** `feat(server): register/login with argon2, no auto-create, no recovery`

---

### Task 5: Game lifecycle — queue pairing, countdown, move reducer, end conditions

**Files:**
- Modify: `server/src/lib.rs`
- Create: `server/src/game.rs` (reducer bodies + helpers)

- [ ] **Step 1: Queue + pairing**

```rust
#[reducer]
pub fn join_queue(ctx: &ReducerContext) -> Result<(), String> {
    let s = logged_in(ctx)?;                                 // helper: Session with account_id != 0, not already in a live game
    if let Some(op) = ctx.db.queue_entry().iter().find(|q| q.account_id != s.account_id) {
        ctx.db.queue_entry().account_id().delete(&op.account_id);
        start_game(ctx, op.account_id, &op.username, s.account_id, &s.username); // earlier-queued player is white
    } else {
        ctx.db.queue_entry().insert(QueueEntry { account_id: s.account_id, username: s.username.clone(), queued_at: ctx.timestamp });
    }
    Ok(())
}
```

`start_game` inserts `Game{phase: 0 countdown}`, all 32 `Piece` rows from `rules::Board::starting()` with `cooldown_until = ctx.timestamp + 3s` — countdown and initial cooldown are the same thing; a scheduled row flips `phase=1` at +3s:

```rust
#[table(name = game_start_timer, scheduled(begin_game))]
pub struct GameStartTimer { #[primary_key] #[auto_inc] pub scheduled_id: u64, pub scheduled_at: ScheduleAt, pub game_id: u64 }
```

Also `leave_queue` reducer. Sessions of both players get `status=1`.

- [ ] **Step 2: The move reducer — the core of the whole game**

```rust
#[reducer]
pub fn move_piece(ctx: &ReducerContext, game_id: u64, from_sq: u8, to_sq: u8) -> Result<(), String> {
    let s = logged_in(ctx)?;
    let game = ctx.db.game().game_id().find(&game_id).ok_or("No such game")?;
    if game.phase != 1 { return Err("Game is not live".into()); }
    let my_color = color_of(&game, s.account_id)?;           // rules::Color; Err if not a player
    if mated(&game, my_color) { /* fall through: mate-freeze blocks ALL moves */ return Err("FROZEN_MATED".into()); }

    let board = board_from_pieces(ctx, game_id);
    let piece_row = ctx.db.piece().game_id().filter(&game_id).find(|p| p.sq == from_sq).ok_or("No piece there")?;
    if u8_to_color(piece_row.color) != my_color { return Err("Not your piece".into()); }
    if piece_row.cooldown_until > ctx.timestamp { return Err("COOLDOWN".into()); }

    let outcome = rules::is_legal_move(&board, from_sq, to_sq, my_color).map_err(|e| format!("{e:?}"))?;
    // NOTE: is_legal_move already enforces check-freeze — any move leaving own king attacked is illegal,
    // which simultaneously covers pins, moving into check, and "only escaping moves while checked".

    // King capture = game over (checked BEFORE applying, so we know the reason)
    let captured_king = outcome.captured_sq.and_then(|cs| board.at(cs)).map(|p| p.ty == rules::PieceType::King).unwrap_or(false);

    apply_move_to_tables(ctx, game_id, &outcome, from_sq, to_sq, ctx.timestamp + cooldown_of(piece_row.ty)); // delete captured row, update mover (sq, has_moved, cooldown, promotion ty), move castle rook (rook gets its cooldown too)
    log_move(ctx, &game, from_sq, to_sq, &outcome);

    if captured_king { finish_game(ctx, game_id, winner_of(my_color), 1 /* king captured */); return Ok(()); }
    refresh_check_flags(ctx, game_id);  // recompute in_check + mated (rules::has_any_escape) for BOTH colors, update Game row
    Ok(())
}
```

Cooldowns (`cooldown_of`): pawn 3s, knight 5s, bishop 5s, rook 7s, king 7s, queen 10s — `const` table in `game.rs`.

**Check-freeze subtlety:** when in check, `is_legal_move`'s king-safety simulation only admits escaping moves — no extra code path needed. The `mated` flag adds the full freeze (cards can lift it in Phase 3).

- [ ] **Step 3: Resign / draw / forfeit**

```rust
#[reducer] pub fn resign(ctx: &ReducerContext, game_id: u64) -> Result<(), String> { /* finish_game(..., winner = other color, reason 2) */ }
#[reducer] pub fn offer_draw(ctx: &ReducerContext, game_id: u64) -> Result<(), String> { /* set flag on Game (add white_draw_offer/black_draw_offer bools); both set → finish_game(draw, 4) */ }

#[table(name = forfeit_timer, scheduled(forfeit_check))]
pub struct ForfeitTimer { #[primary_key] #[auto_inc] pub scheduled_id: u64, pub scheduled_at: ScheduleAt, pub game_id: u64, pub account_id: u64 }
// client_disconnected: if in live game → insert at now+60s. client_connected/login: delete pending timers for account.
// forfeit_check: if game still live AND that account's session still offline → finish_game(other side wins, reason 3).
```

`finish_game` sets phase=2/result/reason, resets both sessions to status 0, deletes pending timers. King-vs-king auto-draw check runs in `refresh_check_flags`.

- [ ] **Step 4: Module tests for game helpers**

Pure parts (`cooldown_of`, snapshot string, check-flag computation on a `rules::Board`) get `cargo test` coverage; reducer flows get verified live in Step 5.

- [ ] **Step 5: Publish + CLI smoke test of a full game**

```bash
spacetime publish chessv2 --project-path server
# two anonymous CLI identities: register two users, join_queue twice, then:
spacetime call chessv2 move_piece 1 12 28   # e2-e4 (white) — expect OK after countdown
spacetime call chessv2 move_piece 1 12 28   # immediate retry — expect COOLDOWN error
spacetime sql chessv2 'SELECT phase, white_in_check FROM game'
```

- [ ] **Step 6: Commit** `feat(server): full game lifecycle — pairing, countdown, real-time moves, check/mate-freeze, king capture, resign/draw/forfeit`

---

### Task 6: Client foundation — connection, auth screens, app shell

**Files:**
- Create: `client/src/stdb.tsx` (connection provider + hooks)
- Create: `client/src/screens/AuthScreen.tsx`, `client/src/screens/Lobby.tsx` (shell)
- Modify: `client/src/App.tsx`, `client/src/main.tsx`, `client/index.html`

- [ ] **Step 1: Connection provider**

```tsx
// stdb.tsx — owns the DbConnection singleton + React context
import { DbConnection } from './module_bindings';

const HOST = import.meta.env.VITE_STDB_HOST ?? 'wss://maincloud.spacetimedb.com';
const MODULE = import.meta.env.VITE_STDB_MODULE ?? 'chessv2';

export function connect(onReady: (conn: DbConnection) => void) {
  DbConnection.builder()
    .withUri(HOST).withModuleName(MODULE)
    .withToken(localStorage.getItem('stdb_token') ?? '')
    .onConnect((conn, _id, token) => {
      localStorage.setItem('stdb_token', token);
      conn.subscriptionBuilder().onApplied(() => onReady(conn))
        .subscribe(['SELECT * FROM session', 'SELECT * FROM game', 'SELECT * FROM piece',
                    'SELECT * FROM move_log', 'SELECT * FROM queue_entry']);
    })
    .onConnectError((_e) => {/* retry with backoff, surface banner */})
    .build();
}
```

Provide `useSession()` (my session row via `conn.identity`), `useTable(name, filter)` (subscribes to row insert/update/delete events, returns array — single generic hook used by every screen).

- [ ] **Step 2: Auth screen** — one card, username + password fields, two buttons **Log in** / **Create account** calling `conn.reducers.login/register`; error text from reducer failure callbacks; the warning box: *"⚠️ No password recovery exists. Save your password somewhere safe."* Mobile-first layout (single column, large inputs).

- [ ] **Step 3: App shell & routing** — tiny state router (`auth → lobby → game`) driven by session row: logged out → AuthScreen; logged in + session.status==1 + live game containing me → GameScreen; else Lobby. PWA basics now: `manifest.json` (name ChessV2, standalone, theme color), viewport meta, app icon placeholder.

- [ ] **Step 4: Lobby v0** — online players list (sessions where `online && account_id != 0`), **Play** button → `join_queue` (shows "Searching…" while my queue_entry exists, **Cancel** → `leave_queue`), auto-navigates when a game row with me appears.

- [ ] **Step 5: Verify in two browsers** — `npm run dev`, register two users (normal + incognito), both press Play, both land in a (blank) game screen. Commit `feat(client): connection layer, auth, lobby with live presence and queueing`

---

### Task 7: The board — SVG rendering, moves, cooldowns, game end

**Files:**
- Create: `client/src/game/GameScreen.tsx`, `client/src/game/BoardSvg.tsx`, `client/src/game/pieces.tsx` (classic SVG set), `client/src/game/legal.ts` (client-side move hints)
- Test: `client/src/game/legal.test.ts` (vitest)

- [ ] **Step 1: Classic piece set** — `pieces.tsx` exports `<PieceGlyph ty color/>`: 6 hand-tuned SVG glyphs (clean, bold silhouettes, white/black variants with outline for contrast on any square). This component interface is the seam where Phase-7 skins plug in.

- [ ] **Step 2: Board component** — `BoardSvg` renders a 0 0 800 800 viewBox: 64 squares, rank/file labels, pieces at `piece.sq` with 150ms CSS transform transitions (pieces glide), board flipped when playing black. Pointer events on squares; selected piece shows legal-target dots from `legal.ts`.

- [ ] **Step 3: Client-side legality mirror (`legal.ts`, TDD with vitest)** — port of `rules.rs` move geometry + king-safety (for UX hints only; server remains authority). `npm i -D vitest`; tests mirror the Rust cases (pawn block, pin, castle, check-escape filter). Run `npx vitest run` → green.

- [ ] **Step 4: Cooldown + status overlays** —
  - cooldown: radial wipe overlay on each piece driven by `cooldown_until` (`requestAnimationFrame`, client clock offset estimated from server `Timestamp` on game start; purely cosmetic — server enforces truth)
  - countdown: big 3-2-1 over the board (`game.phase==0`)
  - check: pulsing red ring on your king; mate-freeze: board dims + "MATED — your king is trapped!" banner (cards will rescue here in Phase 3)
  - move rejection (server error callback): brief shake on the piece + toast (e.g. "Still on cooldown")

- [ ] **Step 5: Move sending** — tap piece → tap target (drag also works: pointerdown/move/up): optimistic glide, call `conn.reducers.movePiece(gameId, from, to)`, reconcile on table update/rejection. Opponent moves animate from table updates.

- [ ] **Step 6: Game end + in-game controls** — header: both usernames + **Resign** / **Offer draw** buttons (confirm tap). On `phase==2`: result modal ("👑 King captured — you win/lose!", resign/forfeit/draw variants) with **Back to lobby**. Reconnect mid-game (refresh the tab) must land back in the live game with correct state.

- [ ] **Step 7: Two-browser full playthrough** — play to king capture; verify cooldown rejections, check-freeze (try a non-escaping move while checked → rejected), forfeit by closing one tab for 60s. Commit `feat(client): playable real-time board with cooldowns, check/mate UX, game end`

---

### Task 8: E2E smoke + mobile pass

**Files:**
- Create: `client/e2e/game.spec.ts`, `client/playwright.config.ts`

- [ ] **Step 1: Playwright setup** — `npm i -D @playwright/test && npx playwright install chromium`. Config: baseURL `http://localhost:5173`, one chromium project + one `devices['iPhone 14']` project.

- [ ] **Step 2: The smoke test** — two browser contexts: register `e2e_a_<runid>` / `e2e_b_<runid>` (runid from `Date.now()` so reruns don't collide), both queue, wait for boards, ctx A plays e2-e4 (click square e2 then e4), assert piece appears on e4 in ctx B within 2s, assert immediate second move with the same pawn is rejected (toast visible), A resigns, both see result modal. Run: `npx playwright test` → green.

- [ ] **Step 3: Mobile viewport audit** — run the iPhone project; fix anything broken: board fits portrait width, touch targets ≥44px, no horizontal scroll, auth/lobby/game all usable. Commit `test: E2E two-player smoke + mobile viewport pass`

---

### Task 9: Production deploy to chessv2.com

**Files:**
- Create: `client/.env.production` (only public values: module name/host — safe for repo)
- Create: `scripts/deploy-client.sh`

- [ ] **Step 1: Build** — `cd client && npm run build` → `dist/`.

- [ ] **Step 2: Deploy script** — `scripts/deploy-client.sh`: rsync `client/dist/` to the aaPanel web root for chessv2.com over SSH (key already configured on the machine; host/user/path read from git-ignored `.deploy.env`, with a committed `.deploy.env.example`). Run it.

- [ ] **Step 3: Verify production** — open https://chessv2.com on desktop + phone: register, play a real game between phone and desktop. Check WSS connection to Maincloud works from production origin.

- [ ] **Step 4: Commit + push** `feat: production deploy pipeline (aaPanel)` — then `git push`. **Verify once more that no secret files are tracked:** `git ls-files | grep -iE 'secret|\.env$|\.env\.' ` → only `*.example` files.

---

## Self-review notes (done at write time)

- **Spec coverage (phases 1–2 only):** auth ✓, presence ✓, pairing ✓ (quick-match ELO widening deferred to Phase 4 social plan — FIFO queue is the Phase-2 stand-in), movement/cooldowns ✓, check/mate-freeze ✓, king-capture end ✓, resign/draw/forfeit ✓, reconnect ✓, mobile ✓, deploy ✓. Cards/gems, chat, spectate, ELO, judge, economy, skins, tutorial: later phase plans by design.
- **Type consistency:** `u8` codes ↔ `rules` enums via the helpers in Task 3; `move_piece` uses `Timestamp` arithmetic consistently (`ctx.timestamp + Duration`).
- **Known risk:** exact SpacetimeDB SDK API names (builder methods, generated reducer casing) drift between versions — executor must follow the *generated* bindings and current `spacetimedb` crate docs, adjusting call sites, not the architecture. Argon2 params may need lowering if Maincloud energy limits trip (fallback noted in Task 4).
