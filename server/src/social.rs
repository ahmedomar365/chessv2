//! Social features: chat (global / in-game / spectator), challenges, spectating.

use spacetimedb::{reducer, table, ReducerContext, Table, Timestamp};

use crate::game::{live_game_of, logged_in, start_game_pair};
use crate::module::*;

const CHAT_MAX_LEN: usize = 200;
const CHAT_THROTTLE_MICROS: i64 = 2_000_000;
const GLOBAL_HISTORY_CAP: usize = 200;

#[table(accessor = chat_message, public)]
pub struct ChatMessage {
    #[primary_key]
    #[auto_inc]
    pub msg_id: u64,
    /// 0 global lobby, 1 game players, 2 game spectators
    #[index(btree)]
    pub channel: u8,
    #[index(btree)]
    pub game_id: u64,
    pub account_id: u64,
    pub username: String,
    pub text: String,
    pub ts: Timestamp,
}

/// PRIVATE — per-account chat rate limiting.
#[table(accessor = chat_throttle)]
pub struct ChatThrottle {
    #[primary_key]
    pub account_id: u64,
    pub last_ts: Timestamp,
}

#[table(accessor = challenge, public)]
pub struct Challenge {
    #[primary_key]
    #[auto_inc]
    pub challenge_id: u64,
    #[index(btree)]
    pub from_id: u64,
    pub from_name: String,
    /// 0 = open challenge (anyone may accept)
    #[index(btree)]
    pub to_id: u64,
    pub to_name: String,
    pub created: Timestamp,
}

#[table(accessor = spectator, public)]
pub struct Spectator {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    #[index(btree)]
    pub game_id: u64,
    #[index(btree)]
    pub account_id: u64,
    pub username: String,
}

/// Common TLDs / shortener endings used to detect bare domains.
const LINK_TLDS: [&str; 42] = [
    "com", "net", "org", "io", "gg", "ly", "me", "co", "xyz", "link", "app", "dev", "gl", "info",
    "biz", "ru", "cn", "tk", "club", "online", "site", "shop", "store", "live", "tv", "to", "cc",
    "ws", "ml", "ga", "cf", "icu", "top", "fun", "click", "buzz", "page", "win", "vip", "pro",
    "download", "stream",
];

/// TLDs distinctive enough to flag even when split off as their own word
/// ("kemono .cr", "site . com"). Excludes common English words (to/me/co/in).
const BARE_TLDS: [&str; 16] = [
    "com", "net", "org", "cr", "xyz", "info", "online", "site", "shop", "click", "buzz", "top",
    "ru", "cn", "xxx", "su",
];

/// Adult / scam spam terms — a message containing any (after stripping spaces,
/// punctuation, and zero-width chars) is rejected outright.
const HARD_SPAM: [&str; 14] = [
    "youporn", "porn", "kemono", "onlyfans", "xvideos", "xnxx", "pornhub", "hentai", "escort",
    "camgirl", "sexcam", "nudes", "leakedof", "teenvids",
];

/// Strip zero-width / bidi / invisible characters used to break up banned words.
fn strip_invisible(s: &str) -> String {
    s.chars()
        .filter(|c| {
            !matches!(*c,
                '\u{00ad}' | '\u{200b}'..='\u{200f}' | '\u{202a}'..='\u{202e}'
                | '\u{2060}' | '\u{2066}'..='\u{2069}' | '\u{feff}')
        })
        .collect()
}

/// Lowercase, drop everything but letters/digits (collapses spacing & punctuation).
fn alnum_lower(s: &str) -> String {
    strip_invisible(s).chars().filter(|c| c.is_ascii_alphanumeric()).flat_map(|c| c.to_lowercase()).collect()
}

/// Trim non-alphanumerics off both ends of a token; lowercase.
fn token_core(tok: &str) -> String {
    tok.trim_matches(|c: char| !c.is_ascii_alphanumeric()).to_lowercase()
}

/// Hard block: adult/scam spam that survives spacing/zero-width evasions.
fn spam_blocked(text: &str) -> bool {
    let n = alnum_lower(text);
    HARD_SPAM.iter().any(|t| n.contains(t))
}

/// Does this token look like a URL or bare domain?
fn looks_like_link(tok: &str) -> bool {
    let l = strip_invisible(tok).to_lowercase();
    if l.contains("://") || l.starts_with("www.") {
        return true;
    }
    let mut i = 0;
    while let Some(rel) = l[i..].find('.') {
        let dot = i + rel;
        let before_alnum = dot > 0
            && l[..dot].chars().last().map(|c| c.is_ascii_alphanumeric()).unwrap_or(false);
        let after = &l[dot + 1..];
        let run: String = after.chars().take_while(|c| c.is_ascii_alphabetic()).collect();
        if before_alnum && run.len() >= 2 {
            let next = after.as_bytes().get(run.len()).copied();
            if next == Some(b'/') || LINK_TLDS.contains(&run.as_str()) {
                return true;
            }
        }
        i = dot + 1;
    }
    false
}

/// True if any token (or token pair like "kemono .cr") forms a link/domain.
fn contains_link(text: &str) -> bool {
    let mut norm = strip_invisible(text);
    for pat in [" dot ", " DOT ", "(dot)", "(DOT)", "[dot]", "[.]", "(.)", "{.}"] {
        norm = norm.replace(pat, ".");
    }
    norm = norm.replace("hxxp", "http").replace("hXXp", "http");
    let toks: Vec<&str> = norm.split_whitespace().collect();
    for (i, tok) in toks.iter().enumerate() {
        let c = token_core(tok);
        if looks_like_link(tok) || looks_like_link(&c) {
            return true;
        }
        // split domain: "<word> com" / "<word> .cr"
        if BARE_TLDS.contains(&c.as_str())
            && i > 0
            && token_core(toks[i - 1]).len() >= 3
            && token_core(toks[i - 1]).chars().all(|ch| ch.is_ascii_alphanumeric())
        {
            return true;
        }
    }
    false
}

/// Mask ALL links/domains in chat to curb spam, after undoing common evasions.
/// No domain is whitelisted — players have no reason to post links.
fn strip_links(text: &str) -> String {
    let mut norm = strip_invisible(text);
    for pat in [" dot ", " DOT ", "(dot)", "(DOT)", "[dot]", "[.]", "(.)", "{.}"] {
        norm = norm.replace(pat, ".");
    }
    norm = norm.replace("hxxp", "http").replace("hXXp", "http");

    let toks: Vec<&str> = norm.split_whitespace().collect();
    let mut out: Vec<String> = Vec::new();
    for (i, tok) in toks.iter().enumerate() {
        let c = token_core(tok);
        let bare = BARE_TLDS.contains(&c.as_str())
            && i > 0
            && token_core(toks[i - 1]).len() >= 3
            && token_core(toks[i - 1]).chars().all(|ch| ch.is_ascii_alphanumeric());
        if looks_like_link(tok) || looks_like_link(&c) || bare {
            if bare {
                if let Some(last) = out.last_mut() {
                    *last = "⟨link removed⟩".to_string();
                }
            }
            out.push("⟨link removed⟩".to_string());
        } else {
            out.push((*tok).to_string());
        }
    }
    out.join(" ")
}

/// Mask profanity robustly via rustrict (handles leetspeak, spacing, accents).
/// Censors profane/offensive/sexual words to asterisks; never blocks.
fn clean_text(text: &str) -> String {
    use rustrict::CensorStr;
    text.censor()
}

/// ADMIN ONLY: delete existing chat messages that contain links or spam
/// (cleans up anything posted before/around the filter being strengthened).
#[reducer]
pub fn admin_purge_link_chat(ctx: &ReducerContext) -> Result<(), String> {
    let admin = spacetimedb::Identity::from_hex(crate::economy::ADMIN_HEX).map_err(|_| "bad admin")?;
    if ctx.sender() != admin {
        return Err("Forbidden".into());
    }
    let ids: Vec<u64> = ctx.db.chat_message().iter()
        .filter(|m| spam_blocked(&m.text) || contains_link(&m.text) || m.text.contains("⟨link removed⟩"))
        .map(|m| m.msg_id)
        .collect();
    for id in ids {
        ctx.db.chat_message().msg_id().delete(id);
    }
    Ok(())
}

#[reducer]
pub fn send_chat(ctx: &ReducerContext, channel: u8, game_id: u64, text: String) -> Result<(), String> {
    let s = logged_in(ctx)?;
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return Err("Empty message".into());
    }
    if trimmed.chars().count() > CHAT_MAX_LEN {
        return Err("Message too long".into());
    }
    // hard block adult/scam spam (survives spacing & zero-width evasions)
    if spam_blocked(trimmed) {
        return Err("BLOCKED".into());
    }
    // throttle
    if let Some(t) = ctx.db.chat_throttle().account_id().find(s.account_id) {
        if ctx.timestamp.to_micros_since_unix_epoch() - t.last_ts.to_micros_since_unix_epoch()
            < CHAT_THROTTLE_MICROS
        {
            return Err("You're sending messages too fast".into());
        }
        ctx.db.chat_throttle().account_id().update(ChatThrottle {
            account_id: s.account_id,
            last_ts: ctx.timestamp,
        });
    } else {
        ctx.db.chat_throttle().insert(ChatThrottle { account_id: s.account_id, last_ts: ctx.timestamp });
    }

    match channel {
        0 => {
            // anti-spam gate: only players who've finished a game may use the
            // global lobby chat. (In-game and spectator chat stay open.)
            let played = ctx.db.player_profile().account_id().find(s.account_id)
                .map(|p| p.games > 0)
                .unwrap_or(false);
            if !played {
                return Err("NEED_GAME".into());
            }
        }
        1 => {
            let g = ctx.db.game().game_id().find(game_id).ok_or("No such game")?;
            if g.white_id != s.account_id && g.black_id != s.account_id {
                return Err("Only players may use game chat".into());
            }
        }
        2 => {
            let is_spec = ctx.db.spectator().game_id().filter(game_id).any(|sp| sp.account_id == s.account_id);
            if !is_spec {
                return Err("Only spectators may use spectator chat".into());
            }
        }
        _ => return Err("Bad channel".into()),
    }

    ctx.db.chat_message().insert(ChatMessage {
        msg_id: 0,
        channel,
        game_id: if channel == 0 { 0 } else { game_id },
        account_id: s.account_id,
        username: s.username.clone(),
        text: clean_text(&strip_links(trimmed)),
        ts: ctx.timestamp,
    });

    // lazy prune of global history
    if channel == 0 {
        let mut ids: Vec<u64> = ctx.db.chat_message().channel().filter(0u8).map(|m| m.msg_id).collect();
        if ids.len() > GLOBAL_HISTORY_CAP {
            ids.sort_unstable();
            for id in &ids[..ids.len() - GLOBAL_HISTORY_CAP] {
                ctx.db.chat_message().msg_id().delete(*id);
            }
        }
    }
    Ok(())
}

/// to_account_id = 0 creates an OPEN challenge anyone can accept.
#[reducer]
pub fn create_challenge(ctx: &ReducerContext, to_account_id: u64) -> Result<(), String> {
    let s = logged_in(ctx)?;
    if to_account_id == s.account_id {
        return Err("You cannot challenge yourself".into());
    }
    if live_game_of(ctx, s.account_id).is_some() {
        return Err("You are already in a game".into());
    }
    let to_name = if to_account_id == 0 {
        String::new()
    } else {
        let target = ctx.db.session().account_id().filter(to_account_id).next().ok_or("Player not found")?;
        if live_game_of(ctx, to_account_id).is_some() {
            return Err("That player is already in a game".into());
        }
        target.username
    };
    // one outstanding challenge per creator — replace any existing
    let old: Vec<u64> = ctx.db.challenge().from_id().filter(s.account_id).map(|c| c.challenge_id).collect();
    for id in old {
        ctx.db.challenge().challenge_id().delete(id);
    }
    ctx.db.challenge().insert(Challenge {
        challenge_id: 0,
        from_id: s.account_id,
        from_name: s.username.clone(),
        to_id: to_account_id,
        to_name,
        created: ctx.timestamp,
    });
    Ok(())
}

#[reducer]
pub fn accept_challenge(ctx: &ReducerContext, challenge_id: u64) -> Result<(), String> {
    let s = logged_in(ctx)?;
    let c = ctx.db.challenge().challenge_id().find(challenge_id).ok_or("Challenge is gone")?;
    if c.from_id == s.account_id {
        return Err("You created this challenge".into());
    }
    if c.to_id != 0 && c.to_id != s.account_id {
        return Err("This challenge is not for you".into());
    }
    if live_game_of(ctx, s.account_id).is_some() || live_game_of(ctx, c.from_id).is_some() {
        return Err("A player is already in a game".into());
    }
    ctx.db.challenge().challenge_id().delete(challenge_id);
    start_game_pair(ctx, c.from_id, &c.from_name, s.account_id, &s.username);
    Ok(())
}

#[reducer]
pub fn decline_challenge(ctx: &ReducerContext, challenge_id: u64) -> Result<(), String> {
    let s = logged_in(ctx)?;
    let c = ctx.db.challenge().challenge_id().find(challenge_id).ok_or("Challenge is gone")?;
    if c.from_id != s.account_id && c.to_id != s.account_id {
        return Err("Not your challenge".into());
    }
    ctx.db.challenge().challenge_id().delete(challenge_id);
    Ok(())
}

#[reducer]
pub fn spectate(ctx: &ReducerContext, game_id: u64) -> Result<(), String> {
    let s = logged_in(ctx)?;
    let g = ctx.db.game().game_id().find(game_id).ok_or("No such game")?;
    if g.phase == 2 {
        return Err("Game already finished".into());
    }
    if g.white_id == s.account_id || g.black_id == s.account_id {
        return Err("You are playing this game".into());
    }
    if live_game_of(ctx, s.account_id).is_some() {
        return Err("You are in a game".into());
    }
    stop_spectating_inner(ctx, s.account_id);
    ctx.db.spectator().insert(Spectator {
        id: 0,
        game_id,
        account_id: s.account_id,
        username: s.username.clone(),
    });
    set_session_status(ctx, s.account_id, 2);
    Ok(())
}

#[reducer]
pub fn stop_spectating(ctx: &ReducerContext) -> Result<(), String> {
    let s = logged_in(ctx)?;
    stop_spectating_inner(ctx, s.account_id);
    set_session_status(ctx, s.account_id, 0);
    Ok(())
}

pub fn stop_spectating_inner(ctx: &ReducerContext, account_id: u64) {
    let ids: Vec<u64> = ctx.db.spectator().account_id().filter(account_id).map(|s| s.id).collect();
    for id in ids {
        ctx.db.spectator().id().delete(id);
    }
}

fn set_session_status(ctx: &ReducerContext, account_id: u64, status: u8) {
    let rows: Vec<Session> = ctx.db.session().account_id().filter(account_id).collect();
    for mut s in rows {
        s.status = status;
        ctx.db.session().identity().update(s);
    }
}

/// Delete all social data for an account (called by admin_delete_account).
pub fn purge_account(ctx: &ReducerContext, account_id: u64) {
    let specs: Vec<u64> = ctx.db.spectator().account_id().filter(account_id).map(|s| s.id).collect();
    for sid in specs {
        ctx.db.spectator().id().delete(sid);
    }
    clear_challenges_for(ctx, account_id);
}

/// Cleanup hooks used by game lifecycle.
pub fn clear_challenges_for(ctx: &ReducerContext, account_id: u64) {
    let ids: Vec<u64> = ctx.db.challenge().from_id().filter(account_id).map(|c| c.challenge_id)
        .chain(ctx.db.challenge().to_id().filter(account_id).map(|c| c.challenge_id))
        .collect();
    for id in ids {
        ctx.db.challenge().challenge_id().delete(id);
    }
}

#[cfg(test)]
mod tests {
    // clean_text is the only pure logic here; it is exercised indirectly and
    // simple enough to verify by inspection — integration covered by CLI smoke.
}
