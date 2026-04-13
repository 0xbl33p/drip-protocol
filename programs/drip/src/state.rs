use anchor_lang::prelude::*;

/// Wrapper account that holds the raw percolator::RiskEngine bytes.
///
/// We use a raw byte array instead of Anchor's zero_copy because RiskEngine
/// is ~9MB and contains complex nested types (reserve cohort queues, enums)
/// that don't trivially satisfy bytemuck::Pod. Instead, we store the raw bytes
/// and cast to &mut RiskEngine using unsafe pointer reinterpretation — safe
/// because RiskEngine is #[repr(C)] with all fixed-size fields.
///
/// The account data layout is:
///   [8 bytes discriminator][N bytes RiskEngine]
/// where N = core::mem::size_of::<percolator::RiskEngine>()

/// Market metadata stored in a separate, smaller account (Borsh-serialized).
/// This holds human-readable info that the engine doesn't need.
#[account]
pub struct MarketMetadata {
    /// The market's RiskEngine account pubkey
    pub engine_account: Pubkey,

    /// Market creator (agent wallet)
    pub creator: Pubkey,

    /// Market name (max 64 bytes UTF-8)
    pub name: [u8; 64],

    /// Market category (0=narrative, 1=social, 2=influence, 3=meta, 4=price)
    pub category: u8,

    /// Oracle configuration
    pub oracle_account: Pubkey,

    /// Creation slot
    pub created_slot: u64,

    /// Bump seed for PDA
    pub bump: u8,
}

impl MarketMetadata {
    pub const LEN: usize = 8  // discriminator
        + 32  // engine_account
        + 32  // creator
        + 64  // name
        + 1   // category
        + 32  // oracle_account
        + 8   // created_slot
        + 1;  // bump
}

/// User account mapping: maps a wallet to its index in the RiskEngine account slab.
/// One per (market, user) pair.
#[account]
pub struct UserMapping {
    /// The market this mapping belongs to
    pub market: Pubkey,

    /// The user's wallet
    pub owner: Pubkey,

    /// The account index in the RiskEngine slab
    pub account_idx: u16,

    /// Bump seed
    pub bump: u8,
}

impl UserMapping {
    pub const LEN: usize = 8  // discriminator
        + 32  // market
        + 32  // owner
        + 2   // account_idx
        + 1;  // bump
}
