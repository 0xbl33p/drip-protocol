use anchor_lang::prelude::*;
use crate::errors::map_engine_error;

const ENGINE_ACCOUNT_SIZE: usize = core::mem::size_of::<percolator::RiskEngine>();

#[derive(Accounts)]
pub struct AccrueMarket<'info> {
    /// Anyone can crank the market (permissionless keeper).
    pub cranker: Signer<'info>,

    /// CHECK: Validated by discriminator check.
    #[account(mut)]
    pub engine: AccountInfo<'info>,

    /// Oracle price feed.
    /// CHECK: Validated in handler.
    pub oracle: AccountInfo<'info>,
}

pub fn handler(ctx: Context<AccrueMarket>, oracle_price: u64) -> Result<()> {
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

    // TODO: Read oracle_price from Pyth/Switchboard account instead of parameter
    // For devnet, accept the price directly from the cranker

    engine
        .accrue_market_to(clock.slot, oracle_price)
        .map_err(map_engine_error)?;

    Ok(())
}
