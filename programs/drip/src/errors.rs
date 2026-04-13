use anchor_lang::prelude::*;

/// Map percolator::RiskError to Anchor error codes (6000+)
#[error_code]
pub enum DripError {
    #[msg("Insufficient balance for this operation")]
    InsufficientBalance,        // 6000

    #[msg("Account is undercollateralized")]
    Undercollateralized,        // 6001

    #[msg("Unauthorized: signer does not own this account")]
    Unauthorized,               // 6002

    #[msg("Arithmetic overflow in engine computation")]
    EngineOverflow,             // 6003

    #[msg("Account not found in the risk engine")]
    AccountNotFound,            // 6004

    #[msg("Side is blocked (DrainOnly or ResetPending)")]
    SideBlocked,                // 6005

    #[msg("Corrupt engine state detected")]
    CorruptState,               // 6006

    #[msg("Market is not in Live mode")]
    MarketNotLive,              // 6007

    #[msg("Market is not in Resolved mode")]
    MarketNotResolved,          // 6008

    #[msg("Oracle price is stale or invalid")]
    InvalidOraclePrice,         // 6009

    #[msg("Oracle confidence interval too wide")]
    OracleConfidenceTooWide,    // 6010

    #[msg("Position size mismatch")]
    PositionSizeMismatch,       // 6011

    #[msg("Invalid account kind for this operation")]
    AccountKindMismatch,        // 6012

    #[msg("Invalid matching engine")]
    InvalidMatchingEngine,      // 6013

    #[msg("PnL not warmed up yet")]
    PnlNotWarmedUp,             // 6014

    #[msg("Engine operation failed")]
    EngineError,                // 6015
}

/// Convert percolator RiskError to anchor Error
pub fn map_engine_error(e: percolator::RiskError) -> anchor_lang::error::Error {
    let drip_err = match e {
        percolator::RiskError::InsufficientBalance => DripError::InsufficientBalance,
        percolator::RiskError::Undercollateralized => DripError::Undercollateralized,
        percolator::RiskError::Unauthorized => DripError::Unauthorized,
        percolator::RiskError::Overflow => DripError::EngineOverflow,
        percolator::RiskError::AccountNotFound => DripError::AccountNotFound,
        percolator::RiskError::SideBlocked => DripError::SideBlocked,
        percolator::RiskError::CorruptState => DripError::CorruptState,
        percolator::RiskError::PositionSizeMismatch => DripError::PositionSizeMismatch,
        percolator::RiskError::AccountKindMismatch => DripError::AccountKindMismatch,
        percolator::RiskError::InvalidMatchingEngine => DripError::InvalidMatchingEngine,
        percolator::RiskError::PnlNotWarmedUp => DripError::PnlNotWarmedUp,
        percolator::RiskError::NotAnLPAccount => DripError::AccountKindMismatch,
    };
    anchor_lang::error::Error::from(anchor_lang::error::AnchorError {
        error_name: format!("{:?}", drip_err),
        error_code_number: drip_err.into(),
        error_msg: drip_err.to_string(),
        error_origin: None,
        compared_values: None,
    })
}
