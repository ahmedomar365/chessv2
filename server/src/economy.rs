//! Economy: wallets (Coins/Crowns), card collection, loadouts, skins, purchases.

use spacetimedb::{reducer, table, view, Identity, ReducerContext, Table, Timestamp, ViewContext};

use crate::cards;
use crate::game::logged_in;
use crate::module::*;

/// Owner/admin identity (the project owner's CLI identity — public info).
/// Only this identity may rotate the payment-service operator.
pub const ADMIN_HEX: &str = "c20017ef02a0106628068c0e7e07aaa9c2159d27e0dbbacdb3b90bf121d96091";

pub const CARD_COPY_COINS: u64 = 200;
pub const CARD_COPY_CROWNS: u64 = 40;
pub const SKIN_CROWNS: u64 = 100;
pub const MAX_COPIES: u8 = 3;
pub const DECK_SIZE: usize = 8;

// ---------------- tables ----------------

/// PRIVATE — player currencies.
#[table(accessor = wallet)]
pub struct Wallet {
    #[primary_key]
    pub account_id: u64,
    pub coins: u64,
    pub crowns: u64,
}

/// PRIVATE — card collection.
#[table(accessor = card_ownership)]
pub struct CardOwnership {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    #[index(btree)]
    pub account_id: u64,
    pub card_id: u8,
    pub copies: u8,
}

/// PRIVATE — saved loadouts.
#[table(accessor = loadout)]
pub struct Loadout {
    #[primary_key]
    #[auto_inc]
    pub loadout_id: u64,
    #[index(btree)]
    pub account_id: u64,
    pub name: String,
    pub cards: Vec<u8>,
    pub active: bool,
}

/// Public skin catalog (seeded at init).
#[table(accessor = skin_catalog, public)]
pub struct SkinCatalog {
    #[primary_key]
    pub skin_id: u8,
    pub name: String,
    pub free: bool,
    pub price_crowns: u64,
}

/// PRIVATE — owned skins.
#[table(accessor = skin_ownership)]
pub struct SkinOwnership {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    #[index(btree)]
    pub account_id: u64,
    pub skin_id: u8,
}

/// Payment-service operator identity (settable only by ADMIN).
#[table(accessor = operator_config)]
pub struct OperatorConfig {
    #[primary_key]
    pub key: u8,
    pub operator: Identity,
}

/// Completed PayPal purchases — order id uniqueness = idempotency.
#[table(accessor = purchase)]
pub struct Purchase {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    #[unique]
    pub paypal_order_id: String,
    #[index(btree)]
    pub account_id: u64,
    pub crowns: u64,
    pub ts: Timestamp,
}

// ---------------- views ----------------

#[view(accessor = my_wallet, public)]
fn my_wallet(ctx: &ViewContext) -> Option<Wallet> {
    let s = ctx.db.session().identity().find(ctx.sender())?;
    if s.account_id == 0 {
        return None;
    }
    ctx.db.wallet().account_id().find(s.account_id)
}

#[view(accessor = my_cards, public)]
fn my_cards(ctx: &ViewContext) -> Vec<CardOwnership> {
    match ctx.db.session().identity().find(ctx.sender()) {
        Some(s) if s.account_id != 0 => ctx.db.card_ownership().account_id().filter(s.account_id).collect(),
        _ => Vec::new(),
    }
}

#[view(accessor = my_loadouts, public)]
fn my_loadouts(ctx: &ViewContext) -> Vec<Loadout> {
    match ctx.db.session().identity().find(ctx.sender()) {
        Some(s) if s.account_id != 0 => ctx.db.loadout().account_id().filter(s.account_id).collect(),
        _ => Vec::new(),
    }
}

#[view(accessor = my_skins, public)]
fn my_skins(ctx: &ViewContext) -> Vec<SkinOwnership> {
    match ctx.db.session().identity().find(ctx.sender()) {
        Some(s) if s.account_id != 0 => ctx.db.skin_ownership().account_id().filter(s.account_id).collect(),
        _ => Vec::new(),
    }
}

// ---------------- seeding helpers ----------------

/// Called from register(): starter collection, wallet, loadout.
pub fn seed_new_account(ctx: &ReducerContext, account_id: u64) {
    ctx.db.wallet().insert(Wallet { account_id, coins: 0, crowns: 0 });
    for card_id in cards::ALL_CARDS {
        ctx.db.card_ownership().insert(CardOwnership { id: 0, account_id, card_id, copies: 1 });
    }
    ctx.db.loadout().insert(Loadout {
        loadout_id: 0,
        account_id,
        name: "Starter".into(),
        cards: cards::DECK.to_vec(),
        active: true,
    });
}

/// Delete all economy data for an account (called by admin_delete_account).
pub fn purge_account(ctx: &ReducerContext, account_id: u64) {
    ctx.db.wallet().account_id().delete(account_id);
    let cards: Vec<u64> = ctx.db.card_ownership().account_id().filter(account_id).map(|c| c.id).collect();
    for cid in cards { ctx.db.card_ownership().id().delete(cid); }
    let loadouts: Vec<u64> = ctx.db.loadout().account_id().filter(account_id).map(|l| l.loadout_id).collect();
    for lid in loadouts { ctx.db.loadout().loadout_id().delete(lid); }
    let skins: Vec<u64> = ctx.db.skin_ownership().account_id().filter(account_id).map(|s| s.id).collect();
    for sid in skins { ctx.db.skin_ownership().id().delete(sid); }
}

/// Grants 1 copy of any card released after the account was created.
/// Idempotent — called on every session bind.
pub fn backfill_collection(ctx: &ReducerContext, account_id: u64) {
    for card_id in cards::ALL_CARDS {
        let has = ctx.db.card_ownership().account_id().filter(account_id).any(|c| c.card_id == card_id);
        if !has {
            ctx.db.card_ownership().insert(CardOwnership { id: 0, account_id, card_id, copies: 1 });
        }
    }
}

/// Skin catalog (id, name, free, price). Variants (shared sculpts, new
/// materials) are priced lower than full skins. Idempotent.
pub fn seed_skins(ctx: &ReducerContext) {
    let themes: [(&str, bool, u64); 21] = [
        ("Classic", true, 0),
        ("Safari", true, 0),
        ("Cowboy", true, 0),
        ("Haunted Halloween", false, 100),
        ("Deep Ocean", false, 100),
        ("Inferno", false, 100),
        ("Frostbite", false, 100),
        ("Cyber Neon", false, 100),
        ("Royal Gold", false, 100),
        ("Elven Forest", false, 100),
        ("Galaxy", false, 100),
        ("Candyland", false, 100),
        ("Samurai", false, 100),
        ("Steampunk", false, 100),
        ("Pirate", false, 100),
        ("Pharaoh", false, 100),
        ("Emerald Dragon", false, 100),
        ("Royal Obsidian", false, 60),
        ("Sakura", false, 60),
        ("Abyss", false, 60),
        ("Blood Moon", false, 60),
    ];
    for (i, (name, free, price)) in themes.iter().enumerate() {
        if ctx.db.skin_catalog().skin_id().find(i as u8).is_none() {
            ctx.db.skin_catalog().insert(SkinCatalog {
                skin_id: i as u8,
                name: name.to_string(),
                free: *free,
                price_crowns: *price,
            });
        }
    }
}

/// ADMIN ONLY: seed any newly released skins into the live catalog.
#[reducer]
pub fn reseed_skins(ctx: &ReducerContext) -> Result<(), String> {
    let admin = Identity::from_hex(ADMIN_HEX).map_err(|_| "bad admin constant")?;
    if ctx.sender() != admin {
        return Err("Forbidden".into());
    }
    seed_skins(ctx);
    Ok(())
}

/// Coin rewards on game end (rated or not — playing earns).
pub fn award_coins(ctx: &ReducerContext, account_id: u64, amount: u64) {
    if let Some(mut w) = ctx.db.wallet().account_id().find(account_id) {
        w.coins += amount;
        ctx.db.wallet().account_id().update(w);
    }
}

/// The active loadout's deck for dealing (falls back to one-of-each).
pub fn active_deck(ctx: &ReducerContext, account_id: u64) -> Vec<u8> {
    ctx.db.loadout().account_id().filter(account_id)
        .find(|l| l.active)
        .map(|l| l.cards)
        .filter(|c| c.len() == DECK_SIZE)
        .unwrap_or_else(|| cards::DECK.to_vec())
}

// ---------------- reducers ----------------

#[reducer]
pub fn buy_card_copy(ctx: &ReducerContext, card_id: u8, with_crowns: bool) -> Result<(), String> {
    let s = logged_in(ctx)?;
    if cards::cost_of(card_id) == 255 && card_id != cards::CARD_GUARDIAN {
        return Err("Unknown card".into());
    }
    let mut own = ctx.db.card_ownership().account_id().filter(s.account_id)
        .find(|c| c.card_id == card_id)
        .ok_or("You do not own this card")?;
    if own.copies >= MAX_COPIES {
        return Err("Maximum 3 copies".into());
    }
    let mut w = ctx.db.wallet().account_id().find(s.account_id).ok_or("No wallet")?;
    if with_crowns {
        if w.crowns < CARD_COPY_CROWNS {
            return Err("Not enough Crowns".into());
        }
        w.crowns -= CARD_COPY_CROWNS;
    } else {
        if w.coins < CARD_COPY_COINS {
            return Err("Not enough Coins".into());
        }
        w.coins -= CARD_COPY_COINS;
    }
    own.copies += 1;
    ctx.db.wallet().account_id().update(w);
    ctx.db.card_ownership().id().update(own);
    Ok(())
}

#[reducer]
pub fn save_loadout(ctx: &ReducerContext, loadout_id: u64, name: String, deck: Vec<u8>) -> Result<(), String> {
    let s = logged_in(ctx)?;
    if deck.len() != DECK_SIZE {
        return Err(format!("A deck must contain exactly {DECK_SIZE} cards"));
    }
    if name.trim().is_empty() || name.chars().count() > 24 {
        return Err("Loadout name must be 1-24 characters".into());
    }
    // per-card count must not exceed owned copies
    for card_id in cards::ALL_CARDS {
        let used = deck.iter().filter(|&&c| c == card_id).count() as u8;
        if used == 0 {
            continue;
        }
        let owned = ctx.db.card_ownership().account_id().filter(s.account_id)
            .find(|c| c.card_id == card_id)
            .map(|c| c.copies)
            .unwrap_or(0);
        if used > owned {
            return Err("You don't own enough copies of a card in this deck".into());
        }
    }
    if deck.iter().any(|c| !cards::ALL_CARDS.contains(c)) {
        return Err("Unknown card in deck".into());
    }
    if loadout_id == 0 {
        let count = ctx.db.loadout().account_id().filter(s.account_id).count();
        if count >= 10 {
            return Err("Maximum 10 loadouts".into());
        }
        ctx.db.loadout().insert(Loadout {
            loadout_id: 0,
            account_id: s.account_id,
            name: name.trim().to_string(),
            cards: deck,
            active: false,
        });
    } else {
        let mut l = ctx.db.loadout().loadout_id().find(loadout_id).ok_or("No such loadout")?;
        if l.account_id != s.account_id {
            return Err("Not your loadout".into());
        }
        l.name = name.trim().to_string();
        l.cards = deck;
        ctx.db.loadout().loadout_id().update(l);
    }
    Ok(())
}

#[reducer]
pub fn set_active_loadout(ctx: &ReducerContext, loadout_id: u64) -> Result<(), String> {
    let s = logged_in(ctx)?;
    let target = ctx.db.loadout().loadout_id().find(loadout_id).ok_or("No such loadout")?;
    if target.account_id != s.account_id {
        return Err("Not your loadout".into());
    }
    let rows: Vec<Loadout> = ctx.db.loadout().account_id().filter(s.account_id).collect();
    for mut l in rows {
        let want = l.loadout_id == loadout_id;
        if l.active != want {
            l.active = want;
            ctx.db.loadout().loadout_id().update(l);
        }
    }
    Ok(())
}

#[reducer]
pub fn delete_loadout(ctx: &ReducerContext, loadout_id: u64) -> Result<(), String> {
    let s = logged_in(ctx)?;
    let l = ctx.db.loadout().loadout_id().find(loadout_id).ok_or("No such loadout")?;
    if l.account_id != s.account_id {
        return Err("Not your loadout".into());
    }
    if l.active {
        return Err("Cannot delete the active loadout".into());
    }
    ctx.db.loadout().loadout_id().delete(loadout_id);
    Ok(())
}

#[reducer]
pub fn buy_skin(ctx: &ReducerContext, skin_id: u8) -> Result<(), String> {
    let s = logged_in(ctx)?;
    let skin = ctx.db.skin_catalog().skin_id().find(skin_id).ok_or("No such skin")?;
    if skin.free {
        return Err("That theme is free — just equip it".into());
    }
    if ctx.db.skin_ownership().account_id().filter(s.account_id).any(|o| o.skin_id == skin_id) {
        return Err("Already owned".into());
    }
    let mut w = ctx.db.wallet().account_id().find(s.account_id).ok_or("No wallet")?;
    if w.crowns < skin.price_crowns {
        return Err("Not enough Crowns".into());
    }
    w.crowns -= skin.price_crowns;
    ctx.db.wallet().account_id().update(w);
    ctx.db.skin_ownership().insert(SkinOwnership { id: 0, account_id: s.account_id, skin_id });
    Ok(())
}

#[reducer]
pub fn equip_skin(ctx: &ReducerContext, skin_id: u8) -> Result<(), String> {
    let s = logged_in(ctx)?;
    let skin = ctx.db.skin_catalog().skin_id().find(skin_id).ok_or("No such skin")?;
    let owned = skin.free
        || ctx.db.skin_ownership().account_id().filter(s.account_id).any(|o| o.skin_id == skin_id);
    if !owned {
        return Err("You don't own this theme".into());
    }
    let mut p = ctx.db.player_profile().account_id().find(s.account_id).ok_or("No profile")?;
    p.equipped_skin = skin_id;
    ctx.db.player_profile().account_id().update(p);
    Ok(())
}

/// ADMIN ONLY: pin the payment-service operator identity.
#[reducer]
pub fn set_operator(ctx: &ReducerContext, operator: Identity) -> Result<(), String> {
    let admin = Identity::from_hex(ADMIN_HEX).map_err(|_| "bad admin constant")?;
    if ctx.sender() != admin {
        return Err("Forbidden".into());
    }
    if ctx.db.operator_config().key().find(0u8).is_some() {
        ctx.db.operator_config().key().update(OperatorConfig { key: 0, operator });
    } else {
        ctx.db.operator_config().insert(OperatorConfig { key: 0, operator });
    }
    Ok(())
}

/// PAYMENT SERVICE ONLY: grant crowns for a verified PayPal capture.
/// Idempotent: a given order id is granted at most once.
#[reducer]
pub fn grant_purchase(ctx: &ReducerContext, account_id: u64, crowns: u64, paypal_order_id: String) -> Result<(), String> {
    let op = ctx.db.operator_config().key().find(0u8).ok_or("No operator configured")?;
    if ctx.sender() != op.operator {
        return Err("Forbidden".into());
    }
    if paypal_order_id.is_empty() || crowns == 0 || crowns > 100_000 {
        return Err("Bad grant".into());
    }
    if ctx.db.purchase().paypal_order_id().find(&paypal_order_id).is_some() {
        return Ok(()); // already granted — idempotent success
    }
    let mut w = ctx.db.wallet().account_id().find(account_id).ok_or("No such account wallet")?;
    w.crowns += crowns;
    ctx.db.wallet().account_id().update(w);
    ctx.db.purchase().insert(Purchase {
        id: 0,
        paypal_order_id,
        account_id,
        crowns,
        ts: ctx.timestamp,
    });
    Ok(())
}
