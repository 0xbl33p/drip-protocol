/**
 * TypeScript mirror of the Percolator Rust engine types (v12.15.0)
 *
 * All u128/i128 fields are represented as bigint for precision.
 * All u64 fields are represented as bigint where they participate in math,
 * or number where they're used as indices/flags.
 */

// ============================================================================
// Constants (spec §1.2–1.4)
// ============================================================================

export const POS_SCALE = 1_000_000n;
export const ADL_ONE = 1_000_000n;
export const MIN_A_SIDE = 1_000n;
export const FUNDING_DEN = 1_000_000_000n;
export const MAX_ORACLE_PRICE = 1_000_000_000_000n;
export const MAX_EXACT_RESERVE_COHORTS = 62;

// ============================================================================
// Enums
// ============================================================================

export enum MarketMode {
  Live = 0,
  Resolved = 1,
}

export enum SideMode {
  Normal = 0,
  DrainOnly = 1,
  ResetPending = 2,
}

export enum Side {
  Long = "long",
  Short = "short",
}

export enum AccountKind {
  User = 0,
  LP = 1,
}

export enum LiquidationPolicy {
  FullClose = "full_close",
  ExactPartial = "exact_partial",
}

// ============================================================================
// Core Structs
// ============================================================================

/** Reserve cohort (spec §6.1): one segment of time-locked positive PnL */
export interface ReserveCohort {
  remaining_q: bigint;
  anchor_q: bigint;
  start_slot: bigint;
  horizon_slots: bigint;
  sched_release_q: bigint;
}

export const EMPTY_COHORT: ReserveCohort = {
  remaining_q: 0n,
  anchor_q: 0n,
  start_slot: 0n,
  horizon_slots: 0n,
  sched_release_q: 0n,
};

/** Insurance fund state */
export interface InsuranceFund {
  balance: bigint;
}

/** Risk engine parameters (spec §2.2) */
export interface RiskParams {
  maintenance_margin_bps: bigint;
  initial_margin_bps: bigint;
  trading_fee_bps: bigint;
  max_accounts: bigint;
  new_account_fee: bigint;
  max_crank_staleness_slots: bigint;
  liquidation_fee_bps: bigint;
  liquidation_fee_cap: bigint;
  min_liquidation_abs: bigint;
  min_initial_deposit: bigint;
  min_nonzero_mm_req: bigint;
  min_nonzero_im_req: bigint;
  insurance_floor: bigint;
  h_min: bigint;
  h_max: bigint;
  resolve_price_deviation_bps: bigint;
}

/** Unified account (spec §2.1) */
export interface Account {
  account_id: bigint;
  capital: bigint;
  kind: AccountKind;

  /** Realized PnL (can be negative) */
  pnl: bigint;

  /** Reserved positive PnL (time-locked in warmup) */
  reserved_pnl: bigint;

  /** Signed fixed-point base quantity (× POS_SCALE) */
  position_basis_q: bigint;

  /** Side multiplier snapshot at last position attachment */
  adl_a_basis: bigint;

  /** K coefficient snapshot */
  adl_k_snap: bigint;

  /** Per-account funding snapshot (v12.15) */
  f_snap: bigint;

  /** Side epoch snapshot */
  adl_epoch_snap: bigint;

  /** Owner pubkey (base58 string on frontend) */
  owner: string;

  /** Fee credits (negative = debt) */
  fee_credits: bigint;

  /** Cumulative LP trading fees */
  fees_earned_total: bigint;

  /** Exact reserve cohorts (oldest first), only [0..exact_cohort_count) active */
  exact_reserve_cohorts: ReserveCohort[];
  exact_cohort_count: number;

  /** Preserved overflow (scheduled) */
  overflow_older: ReserveCohort;
  overflow_older_present: boolean;

  /** Newest pending overflow */
  overflow_newest: ReserveCohort;
  overflow_newest_present: boolean;
}

/** Main risk engine state — the on-chain market account (spec §2.2) */
export interface RiskEngineState {
  vault: bigint;
  insurance_fund: InsuranceFund;
  params: RiskParams;
  current_slot: bigint;

  funding_rate_e9_per_slot_last: bigint;

  market_mode: MarketMode;
  resolved_price: bigint;
  resolved_slot: bigint;
  resolved_payout_h_num: bigint;
  resolved_payout_h_den: bigint;
  resolved_payout_ready: boolean;

  last_crank_slot: bigint;

  /** O(1) aggregates */
  c_tot: bigint;
  pnl_pos_tot: bigint;
  pnl_matured_pos_tot: bigint;

  lifetime_liquidations: bigint;

  /** ADL side state */
  adl_mult_long: bigint;
  adl_mult_short: bigint;
  adl_coeff_long: bigint;
  adl_coeff_short: bigint;
  adl_epoch_long: bigint;
  adl_epoch_short: bigint;
  adl_epoch_start_k_long: bigint;
  adl_epoch_start_k_short: bigint;

  /** Effective open interest */
  oi_eff_long_q: bigint;
  oi_eff_short_q: bigint;

  /** Side modes */
  side_mode_long: SideMode;
  side_mode_short: SideMode;

  stored_pos_count_long: bigint;
  stored_pos_count_short: bigint;
  stale_account_count_long: bigint;
  stale_account_count_short: bigint;

  phantom_dust_bound_long_q: bigint;
  phantom_dust_bound_short_q: bigint;

  materialized_account_count: bigint;

  last_oracle_price: bigint;
  oracle_initialized: boolean;
  last_market_slot: bigint;
  funding_price_sample_last: bigint;

  /** Cumulative funding numerators (v12.15) */
  f_long_num: bigint;
  f_short_num: bigint;
  f_epoch_start_long_num: bigint;
  f_epoch_start_short_num: bigint;
}
