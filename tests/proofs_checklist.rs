//! Kani proofs addressing formal verification checklist gaps.
//! Each proof targets a specific checklist item (A/B/E/F/G).

#![cfg(kani)]

mod common;
use common::*;

// ############################################################################
// A2: 0 <= R_i <= max(PNL_i, 0) after set_pnl
// ############################################################################

/// set_pnl always maintains 0 <= R_i <= max(PNL_i, 0) for any PNL transition.
#[kani::proof]
#[kani::unwind(34)]
#[kani::solver(cadical)]
fn proof_a2_reserve_bounds_after_set_pnl() {
    let mut engine = RiskEngine::new(zero_fee_params());
    let idx = engine.add_user(0).unwrap();
    engine.deposit(idx, 500_000, DEFAULT_ORACLE, DEFAULT_SLOT).unwrap();

    let init_pnl: i128 = kani::any();
    kani::assume(init_pnl >= -100_000 && init_pnl <= 100_000);
    engine.set_pnl(idx as usize, init_pnl);

    let r1 = engine.accounts[idx as usize].reserved_pnl;
    let pos1 = core::cmp::max(engine.accounts[idx as usize].pnl, 0) as u128;
    assert!(r1 <= pos1, "A2: R_i <= max(PNL_i,0) after first set");

    let new_pnl: i128 = kani::any();
    kani::assume(new_pnl > -200_000 && new_pnl < 200_000);
    kani::assume(new_pnl != i128::MIN);
    kani::assume(new_pnl <= MAX_ACCOUNT_POSITIVE_PNL as i128 || new_pnl <= 0);
    engine.set_pnl(idx as usize, new_pnl);

    let r2 = engine.accounts[idx as usize].reserved_pnl;
    let pos2 = core::cmp::max(engine.accounts[idx as usize].pnl, 0) as u128;
    assert!(r2 <= pos2, "A2: R_i <= max(PNL_i,0) after transition");

    kani::cover!(init_pnl > 0 && new_pnl > init_pnl, "positive increase");
    kani::cover!(init_pnl > 0 && new_pnl < 0, "positive to negative");
    kani::cover!(init_pnl < 0 && new_pnl > 0, "negative to positive");
}

// ############################################################################
// A7: fee_credits ∈ [-(i128::MAX), 0] after trade fees
// ############################################################################

/// After a trade, fee_credits stays in valid range.
#[kani::proof]
#[kani::unwind(34)]
#[kani::solver(cadical)]
fn proof_a7_fee_credits_bounds_after_trade() {
    let mut engine = RiskEngine::new(default_params()); // trading_fee_bps=10
    let a = engine.add_user(1000).unwrap();
    let b = engine.add_user(1000).unwrap();
    // Tiny capital so fee exceeds capital → routes through fee_credits
    engine.deposit(a, 100, DEFAULT_ORACLE, DEFAULT_SLOT).unwrap();
    engine.deposit(b, 500_000, DEFAULT_ORACLE, DEFAULT_SLOT).unwrap();

    let size: i128 = kani::any();
    kani::assume(size > 0 && size <= 10 * POS_SCALE as i128);

    let result = engine.execute_trade_not_atomic(
        a, b, DEFAULT_ORACLE, DEFAULT_SLOT, size, DEFAULT_ORACLE, 0i128, 0);

    if result.is_ok() {
        let fc = engine.accounts[a as usize].fee_credits.get();
        assert!(fc <= 0, "A7: fee_credits <= 0");
        assert!(fc != i128::MIN, "A7: fee_credits != i128::MIN");
        assert!(fc >= -(i128::MAX), "A7: fee_credits >= -(i128::MAX)");
    }

    kani::cover!(result.is_ok(), "trade with fee debt");
}

// ############################################################################
// F2: Insurance floor respected after absorb_protocol_loss
// ############################################################################

/// absorb_protocol_loss never drops I below I_floor.
#[kani::proof]
#[kani::unwind(34)]
#[kani::solver(cadical)]
fn proof_f2_insurance_floor_after_absorb() {
    let mut engine = RiskEngine::new(zero_fee_params());
    let idx = engine.add_user(0).unwrap();
    engine.deposit(idx, 100_000, DEFAULT_ORACLE, DEFAULT_SLOT).unwrap();

    let ins_bal: u128 = kani::any();
    kani::assume(ins_bal >= 1 && ins_bal <= 100_000);
    let floor: u128 = kani::any();
    kani::assume(floor > 0 && floor <= ins_bal);
    engine.insurance_fund.balance = U128::new(ins_bal);
    engine.params.insurance_floor = U128::new(floor);
    engine.vault = U128::new(engine.vault.get() + ins_bal);

    let loss: u128 = kani::any();
    kani::assume(loss > 0 && loss <= 100_000);

    engine.absorb_protocol_loss(loss);

    assert!(engine.insurance_fund.balance.get() >= floor,
        "F2: I must remain >= I_floor after absorb_protocol_loss");

    kani::cover!(loss > ins_bal.saturating_sub(floor), "loss exceeds available above floor");
    kani::cover!(loss <= ins_bal.saturating_sub(floor), "loss fits above floor");
}

// ############################################################################
// F8: Loss seniority in touch (losses before fees)
// ############################################################################

/// After touch on a crashed position, losses reduce capital (senior to fees).
#[kani::proof]
#[kani::unwind(34)]
#[kani::solver(cadical)]
fn proof_f8_loss_seniority_in_touch() {
    let mut engine = RiskEngine::new(zero_fee_params());
    let a = engine.add_user(0).unwrap();
    let b = engine.add_user(0).unwrap();
    engine.deposit(a, 500_000, DEFAULT_ORACLE, DEFAULT_SLOT).unwrap();
    engine.deposit(b, 500_000, DEFAULT_ORACLE, DEFAULT_SLOT).unwrap();

    let size = (50 * POS_SCALE) as i128;
    engine.execute_trade_not_atomic(a, b, DEFAULT_ORACLE, DEFAULT_SLOT, size, DEFAULT_ORACLE, 0i128, 0).unwrap();

    let capital_before = engine.accounts[a as usize].capital.get();

    // Price crash → negative PnL for long
    let slot2 = DEFAULT_SLOT + 10;
    let mut ctx = InstructionContext::new_with_h_lock(0);
    let _ = engine.accrue_market_to(slot2, 800);
    engine.current_slot = slot2;
    let _ = engine.touch_account_live_local(a as usize, &mut ctx);
    engine.finalize_touched_accounts_post_live(&ctx);

    let capital_after = engine.accounts[a as usize].capital.get();
    assert!(capital_after <= capital_before,
        "F8: capital must not increase after touch on crashed position");
    assert!(engine.check_conservation(), "conservation after touch");

    kani::cover!(capital_after < capital_before, "losses reduced capital");
}

// ############################################################################
// B7: OI_long == OI_short after trade (symbolic size)
// ############################################################################

#[kani::proof]
#[kani::unwind(34)]
#[kani::solver(cadical)]
fn proof_b7_oi_balance_after_trade() {
    let mut engine = RiskEngine::new(zero_fee_params());
    let a = engine.add_user(0).unwrap();
    let b = engine.add_user(0).unwrap();
    engine.deposit(a, 500_000, DEFAULT_ORACLE, DEFAULT_SLOT).unwrap();
    engine.deposit(b, 500_000, DEFAULT_ORACLE, DEFAULT_SLOT).unwrap();

    let size: i128 = kani::any();
    kani::assume(size > 0 && size <= 100 * POS_SCALE as i128);

    let result = engine.execute_trade_not_atomic(
        a, b, DEFAULT_ORACLE, DEFAULT_SLOT, size, DEFAULT_ORACLE, 0i128, 0);
    if result.is_ok() {
        assert!(engine.oi_eff_long_q == engine.oi_eff_short_q,
            "B7: OI_long == OI_short after trade");
    }

    kani::cover!(result.is_ok(), "trade with OI balance");
}

// ############################################################################
// B1: Conservation after trade with fees
// ############################################################################

#[kani::proof]
#[kani::unwind(34)]
#[kani::solver(cadical)]
fn proof_b1_conservation_after_trade_with_fees() {
    let mut engine = RiskEngine::new(default_params());
    let a = engine.add_user(1000).unwrap();
    let b = engine.add_user(1000).unwrap();
    engine.deposit(a, 100_000, DEFAULT_ORACLE, DEFAULT_SLOT).unwrap();
    engine.deposit(b, 100_000, DEFAULT_ORACLE, DEFAULT_SLOT).unwrap();
    assert!(engine.check_conservation());

    let size: i128 = kani::any();
    kani::assume(size > 0 && size <= 50 * POS_SCALE as i128);

    let result = engine.execute_trade_not_atomic(
        a, b, DEFAULT_ORACLE, DEFAULT_SLOT, size, DEFAULT_ORACLE, 0i128, 0);
    if result.is_ok() {
        assert!(engine.check_conservation(),
            "B1: conservation after trade with fees");
    }

    kani::cover!(result.is_ok(), "fee trade conserves");
}

// ############################################################################
// E8: Position bound enforcement
// ############################################################################

#[kani::proof]
#[kani::unwind(34)]
#[kani::solver(cadical)]
fn proof_e8_position_bound_enforcement() {
    let mut engine = RiskEngine::new(zero_fee_params());
    let a = engine.add_user(0).unwrap();
    let b = engine.add_user(0).unwrap();
    engine.deposit(a, 10_000_000_000, DEFAULT_ORACLE, DEFAULT_SLOT).unwrap();
    engine.deposit(b, 10_000_000_000, DEFAULT_ORACLE, DEFAULT_SLOT).unwrap();

    let oversize = (MAX_POSITION_ABS_Q + 1) as i128;
    let result = engine.execute_trade_not_atomic(
        a, b, DEFAULT_ORACLE, DEFAULT_SLOT, oversize, DEFAULT_ORACLE, 0i128, 0);
    assert!(result.is_err(), "E8: oversize trade must be rejected");

    kani::cover!(true, "oversize rejected");
}

// ############################################################################
// B5: PNL_matured_pos_tot <= PNL_pos_tot after set_pnl + set_reserved_pnl
// ############################################################################

#[kani::proof]
#[kani::unwind(34)]
#[kani::solver(cadical)]
fn proof_b5_matured_leq_pos_tot() {
    let mut engine = RiskEngine::new(zero_fee_params());
    let idx = engine.add_user(0).unwrap();
    engine.deposit(idx, 500_000, DEFAULT_ORACLE, DEFAULT_SLOT).unwrap();

    let pnl: i128 = kani::any();
    kani::assume(pnl > 0 && pnl <= 100_000);
    engine.set_pnl(idx as usize, pnl);
    assert!(engine.pnl_matured_pos_tot <= engine.pnl_pos_tot, "B5 after set_pnl");

    // Transition to lower PNL
    let new_pnl: i128 = kani::any();
    kani::assume(new_pnl >= 0 && new_pnl < pnl);
    engine.set_pnl(idx as usize, new_pnl);
    assert!(engine.pnl_matured_pos_tot <= engine.pnl_pos_tot,
        "B5: matured <= pos_tot after decrease");

    // Transition to negative PNL
    engine.set_pnl(idx as usize, -1000);
    assert!(engine.pnl_matured_pos_tot <= engine.pnl_pos_tot,
        "B5: matured <= pos_tot after negative");

    kani::cover!(new_pnl > 0, "partial decrease");
}

// ############################################################################
// G4: DrainOnly blocks OI-increasing trades
// ############################################################################

#[kani::proof]
#[kani::unwind(34)]
#[kani::solver(cadical)]
fn proof_g4_drain_only_blocks_oi_increase() {
    let mut engine = RiskEngine::new(zero_fee_params());
    let a = engine.add_user(0).unwrap();
    let b = engine.add_user(0).unwrap();
    engine.deposit(a, 500_000, DEFAULT_ORACLE, DEFAULT_SLOT).unwrap();
    engine.deposit(b, 500_000, DEFAULT_ORACLE, DEFAULT_SLOT).unwrap();

    engine.side_mode_long = SideMode::DrainOnly;

    let size: i128 = kani::any();
    kani::assume(size > 0 && size <= 50 * POS_SCALE as i128);
    let result = engine.execute_trade_not_atomic(
        a, b, DEFAULT_ORACLE, DEFAULT_SLOT, size, DEFAULT_ORACLE, 0i128, 0);

    assert!(result.is_err(), "G4: DrainOnly must block OI increase");

    kani::cover!(result.is_err(), "DrainOnly blocks");
}
