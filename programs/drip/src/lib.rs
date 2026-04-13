use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("5RcVjz4q7y4ZC5wtxBRTHHYHszMVYLY6Gsv5LYpk33X8");

#[program]
pub mod drip {
    use super::*;

    /// Initialize a new perpetual market with the given risk parameters.
    /// Called by an agent to create a new market.
    pub fn initialize_market(
        ctx: Context<InitializeMarket>,
        name: [u8; 64],
        category: u8,
        params: InitMarketParams,
    ) -> Result<()> {
        instructions::initialize_market::handler(ctx, name, category, params)
    }

    /// Deposit USDC into a user's account in a market.
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        instructions::deposit::handler(ctx, amount)
    }

    /// Withdraw USDC from a user's account.
    pub fn withdraw(
        ctx: Context<Withdraw>,
        amount: u64,
        funding_rate_e9: i128,
        h_lock: u64,
    ) -> Result<()> {
        instructions::withdraw::handler(ctx, amount, funding_rate_e9, h_lock)
    }

    /// Execute a bilateral trade between a trader and a counterparty (LP).
    pub fn execute_trade(
        ctx: Context<ExecuteTrade>,
        size_q: i128,
        exec_price: u64,
        funding_rate_e9: i128,
        h_lock: u64,
    ) -> Result<()> {
        instructions::trade::handler(ctx, size_q, exec_price, funding_rate_e9, h_lock)
    }

    /// Accrue market state (mark-to-market + funding). Permissionless keeper operation.
    pub fn accrue_market(ctx: Context<AccrueMarket>, oracle_price: u64) -> Result<()> {
        instructions::accrue_market::handler(ctx, oracle_price)
    }

    /// Liquidate an undercollateralized account. Permissionless keeper operation.
    pub fn liquidate(
        ctx: Context<Liquidate>,
        account_idx: u16,
        oracle_price: u64,
        funding_rate_e9: i128,
        h_lock: u64,
    ) -> Result<()> {
        instructions::liquidate::handler(ctx, account_idx, oracle_price, funding_rate_e9, h_lock)
    }
}
