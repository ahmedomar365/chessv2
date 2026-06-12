pub mod auth;
pub mod cards;
pub mod rules;

#[cfg(target_arch = "wasm32")]
mod game;
#[cfg(target_arch = "wasm32")]
mod module;
