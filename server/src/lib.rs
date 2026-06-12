pub mod rules;

use spacetimedb::{reducer, ReducerContext};

#[reducer(init)]
pub fn init(_ctx: &ReducerContext) {}
