# ChessV2 Phase 6: Economy — Coins/Crowns, Collection, Loadouts, Shop, PayPal

> REQUIRED SUB-SKILL: superpowers:executing-plans. Conventions as in Phase 1–2 plan.

**Design:**
- `wallet` PRIVATE (account_id, coins, crowns) + `my_wallet` view. Coins on `finish_game`: win 100 (+10×streak, cap +50), loss 25, draw 40. New accounts start with 0/0.
- `card_ownership` (PRIVATE + `my_cards` view): account_id, card_id, copies (1–3). Registration seeds 1 of each.
- `loadout` (PRIVATE + `my_loadouts` view): account_id, loadout_id, name, cards Vec<u8> (exactly 8, per-card count ≤ owned copies), active flag. Registration seeds "Starter" = one of each, active. `save_loadout`, `set_active_loadout`, `delete_loadout` reducers; `start_game` deals from the active loadout.
- `buy_card_copy(card_id, currency)` — 200 coins or 40 crowns, max 3 copies.
- `skin_catalog` (public, seeded in init: 13 themes, 3 free) + `skin_ownership` (PRIVATE + view) + `equipped_skin` on player_profile. `buy_skin` (100 crowns), `equip_skin` (owned or free). Visual themes land in Phase 7; commerce now.
- **Crowns come ONLY from PayPal.** `purchase` table (paypal_order_id UNIQUE = idempotency). `grant_purchase(account_id, crowns, order_id)` callable ONLY by the payment-service operator identity, pinned via `set_operator(identity)` which itself is restricted to the hardcoded admin identity (the owner's CLI identity — public info, not a secret).
- **Payment service** (`payments/`, Node + Express, no framework bloat): POST `/api/pay/create-order` {pack: 0|1|2} → PayPal Orders API (packs: $0.99→100, $4.99→550, $9.99→1200 crowns); POST `/api/pay/capture` {orderId, accountId} → capture + verify (status COMPLETED, amount matches pack) → grant via SpacetimeDB HTTP API with operator token → returns granted crowns. Webhook `/api/pay/webhook` reconciles missed captures (best-effort v1). Env: PAYPAL_CLIENT_ID/SECRET (sandbox now), PAYPAL_ENV, STDB_OPERATOR_TOKEN. Deployed to the aaPanel server under pm2/systemd; nginx location `/api/pay/` added to the chessv2.com vhost (backup + `nginx -t` before reload — server hosts other sites).
- **Client:** wallet chips in lobby header; ShopScreen (Crowns packs via PayPal JS SDK buttons — sandbox client-id; card copies; skins list w/ buy+equip); CollectionScreen (loadout manager: 8 slots, tap-to-add from owned cards, rename, set active). Routes from lobby.
- Live-mode flip = env vars only, AFTER sandbox E2E proof. Default stays sandbox.

**Tasks:** 1) module economy tables/reducers + tests · 2) payment service + deploy + nginx · 3) client shop/collection/loadouts + PayPal buttons · 4) sandbox E2E purchase proof · commit/deploy.
