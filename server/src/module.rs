//! SpacetimeDB tables and reducers (wasm-only; pure logic lives in rules/auth).

use spacetimedb::{reducer, ReducerContext};

#[reducer(init)]
pub fn init(_ctx: &ReducerContext) {}
