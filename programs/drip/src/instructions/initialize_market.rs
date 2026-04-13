use anchor_lang::prelude::*;
use crate::state::MarketMetadata;

/// Size of the RiskEngine account data.
/// This must match core::mem::size_of::<percolator::RiskEngine>().
/// With MAX_ACCOUNTS=64 (test feature), this is much smaller (~300KB).
/// Production (MAX_ACCOUNTS=2048) would be ~9.05MB.
const ENGINE_ACCOUNT_SIZE: usize = core::mem::size_of::<percolator::RiskEngine>();

#[derive(Accounts)]
#[instruction(name: [u8; 64], category: u8)]
pub struct InitializeMarket<'info> {
    /// The market creator (agent wallet). Pays for account creation.
    #[account(mut)]
    pub creator: Signer<'info>,

    /// The RiskEngine account — raw bytes, not Anchor-managed.
    /// We allocate it manually because it's too large for Anchor's init.
    /// CHECK: Initialized in the instruction handler.
    #[account(
        init,
        payer = creator,
        space = 8 + ENGINE_ACCOUNT_SIZE,
        seeds = [b"engine", creator.key().as_ref(), &name],
        bump,
    )]
    pub engine: AccountInfo<'info>,

    /// Market metadata (smaller, Borsh-serialized)
    #[account(
        init,
        payer = creator,
        space = MarketMetadata::LEN,
        seeds = [b"metadata", engine.key().as_ref()],
        bump,
    )]
    pub metadata: Account<'info, MarketMetadata>,

    /// Oracle price feed account
    /// CHECK: Validated in instruction handler
    pub oracle: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitializeMarket>,
    name: [u8; 64],
    category: u8,
    params: InitMarketParams,
) -> Result<()> {
    // Initialize the RiskEngine in the raw account data
    let engine_info = &ctx.accounts.engine;
    let mut engine_data = engine_info.try_borrow_mut_data()?;

    // Skip 8-byte discriminator (write our own marker)
    let discriminator: [u8; 8] = [0xD0, 0x52, 0x49, 0x50, 0x45, 0x4E, 0x47, 0x00]; // "DRIPENG\0"
    engine_data[..8].copy_from_slice(&discriminator);

    // Cast the remaining bytes to RiskEngine and initialize
    let engine_bytes = &mut engine_data[8..8 + ENGINE_ACCOUNT_SIZE];
    let engine: &mut percolator::RiskEngine =
        unsafe { &mut *(engine_bytes.as_mut_ptr() as *mut percolator::RiskEngine) };

    // Initialize in-place to avoid 280KB+ stack allocation.
    // RiskEngine::init_in_place zeroes and sets all fields on the already-allocated account data.
    let risk_params = percolator::RiskParams {
        maintenance_margin_bps: params.maintenance_margin_bps,
        initial_margin_bps: params.initial_margin_bps,
        trading_fee_bps: params.trading_fee_bps,
        max_accounts: params.max_accounts,
        new_account_fee: percolator::U128::new(params.new_account_fee),
        max_crank_staleness_slots: params.max_crank_staleness_slots,
        liquidation_fee_bps: params.liquidation_fee_bps,
        liquidation_fee_cap: percolator::U128::new(params.liquidation_fee_cap),
        min_liquidation_abs: percolator::U128::new(params.min_liquidation_abs),
        min_initial_deposit: percolator::U128::new(params.min_initial_deposit),
        min_nonzero_mm_req: params.min_nonzero_mm_req,
        min_nonzero_im_req: params.min_nonzero_im_req,
        insurance_floor: percolator::U128::new(params.insurance_floor),
        h_min: params.h_min,
        h_max: params.h_max,
        resolve_price_deviation_bps: params.resolve_price_deviation_bps,
    };

    let clock = Clock::get()?;
    engine.init_in_place(risk_params, clock.slot, 1); // init_oracle_price=1 (set properly on first accrue)

    // Set metadata
    let metadata = &mut ctx.accounts.metadata;
    metadata.engine_account = ctx.accounts.engine.key();
    metadata.creator = ctx.accounts.creator.key();
    metadata.name = name;
    metadata.category = category;
    metadata.oracle_account = ctx.accounts.oracle.key();
    metadata.created_slot = Clock::get()?.slot;
    metadata.bump = ctx.bumps.metadata;

    Ok(())
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct InitMarketParams {
    pub maintenance_margin_bps: u64,
    pub initial_margin_bps: u64,
    pub trading_fee_bps: u64,
    pub max_accounts: u64,
    pub new_account_fee: u128,
    pub max_crank_staleness_slots: u64,
    pub liquidation_fee_bps: u64,
    pub liquidation_fee_cap: u128,
    pub min_liquidation_abs: u128,
    pub min_initial_deposit: u128,
    pub min_nonzero_mm_req: u128,
    pub min_nonzero_im_req: u128,
    pub insurance_floor: u128,
    pub h_min: u64,
    pub h_max: u64,
    pub resolve_price_deviation_bps: u64,
}
