use anchor_lang::prelude::*;

declare_id!("3i1KUa7S1FjRx34SzqRAKAYsp3S8AJkCB3x7odjua7kL");

#[program]
pub mod circuit_drops {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Circuit Drops initialized");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
