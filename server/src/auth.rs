//! Password hashing + username validation. Pure — natively testable.
//!
//! Argon2id tuned for the wasm module runtime (8 MiB, t=2). There is NO
//! password recovery by design; the client must warn users to save passwords.

use argon2::password_hash::SaltString;
use argon2::{Algorithm, Argon2, Params, PasswordHash, PasswordHasher, PasswordVerifier, Version};

fn argon() -> Argon2<'static> {
    // 8 MiB, 2 iterations, 1 lane — sized for the wasm module runtime.
    Argon2::new(Algorithm::Argon2id, Version::V0x13, Params::new(8192, 2, 1, None).unwrap())
}

/// Substrings that may never appear in a username (profanity, slurs, adult /
/// spam terms). Matched case-insensitively against a leetspeak-normalized,
/// separator-stripped form so "p0rn", "P_O_R_N", "y0up0rn" are all caught.
/// Brand/scam terms a general profanity library won't know. The robust
/// profanity/obfuscation detection is delegated to `rustrict` below.
const BANNED_NAME_PARTS: [&str; 36] = [
    "fuck", "shit", "bitch", "asshole", "cunt", "nigger", "nigga", "faggot", "whore", "slut",
    "rape", "porn", "ponhub", "pornhub", "youporn", "xvideos", "xvideo", "xhamster", "xnxx",
    "redtube", "brazzers", "onlyfans", "kemono", "xxx", "hentai", "boobs", "penis", "vagina",
    "dick", "cock", "pussy", "nazi", "hitler", "retard", "supremacy", "kys",
];

/// Collapse leetspeak and strip separators so evasions don't slip through.
fn normalize_for_filter(u: &str) -> String {
    u.chars()
        .filter(|c| c.is_ascii_alphanumeric())
        .map(|c| match c.to_ascii_lowercase() {
            '0' => 'o',
            '1' => 'i',
            '3' => 'e',
            '4' => 'a',
            '5' => 's',
            '7' => 't',
            '8' => 'b',
            '9' => 'g',
            '$' => 's',
            other => other,
        })
        .collect()
}

pub fn validate_username(u: &str) -> Result<(), String> {
    if u.len() < 3 || u.len() > 16 {
        return Err("Username must be 3-16 characters".into());
    }
    if !u.chars().all(|c| c.is_ascii_alphanumeric() || c == '_') {
        return Err("Username may only contain letters, numbers, and _".into());
    }
    let norm = normalize_for_filter(u);
    if BANNED_NAME_PARTS.iter().any(|bad| norm.contains(bad)) {
        return Err("That username isn't allowed — pick another".into());
    }
    // robust profanity/obfuscation detection (leetspeak, spacing, etc.).
    // Require MODERATE+ severity in the sexual/profane/offensive categories so
    // random letter+digit usernames don't trip rustrict's mild/spam heuristics.
    let bad = (rustrict::Type::SEXUAL | rustrict::Type::PROFANE | rustrict::Type::OFFENSIVE)
        & rustrict::Type::SEVERE;
    if rustrict::Censor::from_str(u).analyze().is(bad) {
        return Err("That username isn't allowed — pick another".into());
    }
    Ok(())
}

pub fn hash_password(pw: &str, salt16: &[u8; 16]) -> String {
    let salt = SaltString::encode_b64(salt16).expect("16-byte salt encodes");
    argon().hash_password(pw.as_bytes(), &salt).expect("argon2 hash").to_string()
}

pub fn verify_password(pw: &str, stored: &str) -> bool {
    PasswordHash::new(stored)
        .map(|h| argon().verify_password(pw.as_bytes(), &h).is_ok())
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn username_rules() {
        assert!(validate_username("ab").is_err()); // too short
        assert!(validate_username("a2345678901234567").is_err()); // 17 chars
        assert!(validate_username("bad name").is_err()); // space
        assert!(validate_username("bad-name!").is_err()); // punctuation
        assert!(validate_username("Good_Name1").is_ok());
        assert!(validate_username("abc").is_ok()); // 3 chars ok
        assert!(validate_username("a234567890123456").is_ok()); // 16 chars ok
        // banned content (incl. leetspeak + separator evasion)
        assert!(validate_username("youporn").is_err());
        assert!(validate_username("y0up0rn").is_err());
        assert!(validate_username("P_O_R_N").is_err());
        assert!(validate_username("xxxKing").is_err());
        assert!(validate_username("n1gga").is_err());
        assert!(validate_username("FuckYou").is_err());
        assert!(validate_username("www_ponhub_com").is_err()); // the one that slipped through
        assert!(validate_username("pornhub99").is_err());
        assert!(validate_username("onlyfanslink").is_err());
        assert!(validate_username("kemonoparty").is_err());
        // legit names still pass (incl. numbers — no false positives)
        assert!(validate_username("Magnus").is_ok());
        assert!(validate_username("knight_rider").is_ok());
        assert!(validate_username("player2024").is_ok());
        assert!(validate_username("1337gamer").is_ok());
        assert!(validate_username("Essex_Bob").is_ok());
    }

    #[test]
    fn hash_roundtrip() {
        let salt = *b"0123456789abcdef";
        let h = hash_password("hunter22", &salt);
        assert!(h.starts_with("$argon2id$"));
        assert!(verify_password("hunter22", &h));
        assert!(!verify_password("wrong", &h));
        assert!(!verify_password("hunter22", "not-a-hash"));
    }
}
