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

pub fn validate_username(u: &str) -> Result<(), String> {
    if u.len() < 3 || u.len() > 16 {
        return Err("Username must be 3-16 characters".into());
    }
    if !u.chars().all(|c| c.is_ascii_alphanumeric() || c == '_') {
        return Err("Username may only contain letters, numbers, and _".into());
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
