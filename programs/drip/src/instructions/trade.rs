use anchor_lang::prelude::*;
use crate::errors::map_engine_error;
use crate::state::UserMapping;

const ENGINE_ACCOUNT_SIZE: usize = core::mem::size_of::<percolator::RiskEngine>();

#[derive(Accounts)]
pub struct ExecuteTrade<'info> {
    #[account(mut)]
    pub trader: Signer<'info>,

    /// CHECK: Validated by discriminator check.
    #[account(mut)]
    pub engine: AccountInfo<'info>,

    /// Trader's account mapping
    #[account(
        seeds = [b"user", engine.key().as_ref(), trader.key().as_ref()],
        bump = trader_mapping.bump,
    )]
    pub trader_mapping: Account<'info, UserMapping>,

    /// Counterparty (LP) account mapping
    /// CHECK: The LP account index is validated by the engine.
    pub counterparty_mapping: Account<'info, UserMapping>,
}

pub fn handler(
    ctx: Context<ExecuteTrade>,
    size_q: i128,
    exec_price: u64,
    funding_rate_e9: i128,
    h_lock: u64,
) -> Result<()> {
    let engine_info = &ctx.accounts.engine;
    let mut engine_data = engine_info.try_borrow_mut_data()?;

    let disc = &engine_data[..8];
    require!(
        disc == [0xD0, 0x52, 0x49, 0x50, 0x45, 0x4E, 0x47, 0x00],
        crate::errors::DripError::CorruptState
    );

    let engine_bytes = &mut engine_data[8..8 + ENGINE_ACCOUNT_SIZE];
    let engine: &mut percolator::RiskEngine =
        unsafe { &mut *(engine_bytes.as_mut_ptr() as *mut percolator::RiskEngine) };

    let clock = Clock::get()?;
    let oracle_price = engine.last_oracle_price;
    let trader_idx = ctx.accounts.trader_mapping.account_idx;
    let lp_idx = ctx.accounts.counterparty_mapping.account_idx;

    engine
        .execute_trade_not_atomic(
            trader_idx,
            lp_idx,
            oracle_price,
            clock.slot,
            size_q,
            exec_price,
            funding_rate_e9,
            h_lock,
        )
        .map_err(map_engine_error)?;

    Ok(())
}
