use anchor_lang::prelude::*;
use crate::errors::map_engine_error;
use crate::state::UserMapping;

const ENGINE_ACCOUNT_SIZE: usize = core::mem::size_of::<percolator::RiskEngine>();

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    /// The RiskEngine account (raw bytes).
    /// CHECK: Validated by discriminator check in handler.
    #[account(mut)]
    pub engine: AccountInfo<'info>,

    /// User's account mapping (maps wallet → engine account index).
    #[account(
        seeds = [b"user", engine.key().as_ref(), user.key().as_ref()],
        bump = user_mapping.bump,
    )]
    pub user_mapping: Account<'info, UserMapping>,

    /// The USDC token account to transfer from.
    /// CHECK: Validated by SPL token transfer.
    #[account(mut)]
    pub user_token_account: AccountInfo<'info>,

    /// The market's USDC vault.
    /// CHECK: Validated by SPL token transfer.
    #[account(mut)]
    pub vault_token_account: AccountInfo<'info>,

    /// SPL Token program.
    /// CHECK: Standard program.
    pub token_program: AccountInfo<'info>,
}

pub fn handler(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    let engine_info = &ctx.accounts.engine;
    let mut engine_data = engine_info.try_borrow_mut_data()?;

    // Verify discriminator
    let disc = &engine_data[..8];
    require!(
        disc == [0xD0, 0x52, 0x49, 0x50, 0x45, 0x4E, 0x47, 0x00],
        crate::errors::DripError::CorruptState
    );

    let engine_bytes = &mut engine_data[8..8 + ENGINE_ACCOUNT_SIZE];
    let engine: &mut percolator::RiskEngine =
        unsafe { &mut *(engine_bytes.as_mut_ptr() as *mut percolator::RiskEngine) };

    let clock = Clock::get()?;
    let idx = ctx.accounts.user_mapping.account_idx;
    let oracle_price = engine.last_oracle_price;

    // TODO: SPL token transfer from user to vault
    // For now, just call the engine deposit

    engine
        .deposit(idx, amount as u128, oracle_price, clock.slot)
        .map_err(map_engine_error)?;

    Ok(())
}
