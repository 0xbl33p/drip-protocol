use anchor_lang::prelude::*;
use crate::errors::map_engine_error;

const ENGINE_ACCOUNT_SIZE: usize = core::mem::size_of::<percolator::RiskEngine>();

#[derive(Accounts)]
pub struct Liquidate<'info> {
    /// Anyone can liquidate (permissionless keeper).
    pub liquidator: Signer<'info>,

    /// CHECK: Validated by discriminator check.
    #[account(mut)]
    pub engine: AccountInfo<'info>,
}

pub fn handler(
    ctx: Context<Liquidate>,
    account_idx: u16,
    oracle_price: u64,
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

    engine
        .liquidate_at_oracle_not_atomic(
            account_idx,
            clock.slot,
            oracle_price,
            percolator::LiquidationPolicy::FullClose,
            funding_rate_e9,
            h_lock,
        )
        .map_err(map_engine_error)?;

    Ok(())
}
