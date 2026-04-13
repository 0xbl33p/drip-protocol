/**
 * Client-side computation functions mirroring the Percolator Rust engine.
 * All arithmetic uses BigInt to preserve 128-bit precision — no floating point.
 *
 * These are used for:
 * - Order preview (estimated liq price, margin, fees)
 * - Position display (effective position, PnL, warmup progress)
 * - Health indicators (haircut ratio, margin health)
 */

import {
  POS_SCALE,
  ADL_ONE,
  FUNDING_DEN,
  type Account,
  type RiskEngineState,
  type ReserveCohort,
  Side,
} from "@/types";

// ============================================================================
// Helper: BigInt math
// ============================================================================

function abs(x: bigint): bigint {
  return x < 0n ? -x : x;
}

function max(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}

function min(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}

/** floor(a * b / c) for non-negative a, b, c > 0 */
function mulDivFloor(a: bigint, b: bigint, c: bigint): bigint {
  return (a * b) / c;
}

/** ceil(a * b / c) for non-negative a, b, c > 0 */
function mulDivCeil(a: bigint, b: bigint, c: bigint): bigint {
  return (a * b + c - 1n) / c;
}

// ============================================================================
// Position
// ============================================================================

/**
 * Compute effective position after ADL epoch/multiplier adjustments (spec §5.1).
 * Returns signed effective position in scaled units (÷ POS_SCALE for base units).
 */
export function effectivePosQ(
  account: Account,
  engine: RiskEngineState
): bigint {
  if (account.position_basis_q === 0n) return 0n;

  // Determine which side
  const side =
    account.position_basis_q > 0n ? Side.Long : Side.Short;
  const currentEpoch =
    side === Side.Long ? engine.adl_epoch_long : engine.adl_epoch_short;

  // Stale account — epoch mismatch
  if (account.adl_epoch_snap !== currentEpoch) {
    return 0n;
  }

  const aMult =
    side === Side.Long ? engine.adl_mult_long : engine.adl_mult_short;
  const aBasis = account.adl_a_basis;

  if (aBasis === 0n) return 0n;

  // effective = floor(|basis| * A_s / a_basis) * sign
  const absEff = mulDivFloor(abs(account.position_basis_q), aMult, aBasis);
  return account.position_basis_q > 0n ? absEff : -absEff;
}

/**
 * Compute notional value: floor(|effective_pos_q| * oracle_price / POS_SCALE)
 */
export function notional(effectivePos: bigint, oraclePrice: bigint): bigint {
  return mulDivFloor(abs(effectivePos), oraclePrice, POS_SCALE);
}

/**
 * Determine which side an account's position is on.
 */
export function positionSide(account: Account): Side | null {
  if (account.position_basis_q > 0n) return Side.Long;
  if (account.position_basis_q < 0n) return Side.Short;
  return null;
}

// ============================================================================
// Haircut (spec §3.1–3.3)
// ============================================================================

/**
 * Compute the residual: max(0, V - C_tot - I)
 */
export function residual(engine: RiskEngineState): bigint {
  const senior = engine.c_tot + engine.insurance_fund.balance;
  return engine.vault > senior ? engine.vault - senior : 0n;
}

/**
 * Compute the matured haircut ratio h = (h_num, h_den).
 * h = min(residual, pnl_matured_pos_tot) / pnl_matured_pos_tot
 * Returns [1n, 1n] if no matured PnL (h = 1, no haircut).
 */
export function haircutRatio(
  engine: RiskEngineState
): [bigint, bigint] {
  if (engine.pnl_matured_pos_tot === 0n) {
    return [1n, 1n];
  }
  const res = residual(engine);
  const hNum = min(res, engine.pnl_matured_pos_tot);
  const hDen = engine.pnl_matured_pos_tot;
  return [hNum, hDen];
}

/**
 * Compute h as a display-friendly number (0.0 to 1.0).
 */
export function haircutRatioFloat(engine: RiskEngineState): number {
  const [hNum, hDen] = haircutRatio(engine);
  if (hDen === 0n) return 1;
  return Number(hNum * 10000n / hDen) / 10000;
}

// ============================================================================
// PnL & Reserve (spec §4, §6)
// ============================================================================

/**
 * Released positive PnL = max(pnl, 0) - reserved_pnl
 */
export function releasedPosPnl(account: Account): bigint {
  const posPnl = max(account.pnl, 0n);
  return posPnl > account.reserved_pnl
    ? posPnl - account.reserved_pnl
    : 0n;
}

/**
 * Effective matured PnL after haircut: floor(released * h_num / h_den)
 */
export function effectiveMaturedPnl(
  account: Account,
  engine: RiskEngineState
): bigint {
  const released = releasedPosPnl(account);
  if (released === 0n) return 0n;

  const [hNum, hDen] = haircutRatio(engine);
  return mulDivFloor(released, hNum, hDen);
}

// ============================================================================
// Equity variants (spec §3.4)
// ============================================================================

/**
 * Fee debt: max(0, -fee_credits)
 */
export function feeDebt(account: Account): bigint {
  return account.fee_credits < 0n ? -account.fee_credits : 0n;
}

/**
 * Maintenance equity (raw): C_i + PNL_i - FeeDebt_i
 * Can be negative.
 */
export function accountEquityMaintRaw(account: Account): bigint {
  return account.capital + account.pnl - feeDebt(account);
}

/**
 * Initial margin equity (raw): C_i + min(PNL_i, 0) + PNL_eff_matured_i - FeeDebt_i
 */
export function accountEquityInitRaw(
  account: Account,
  engine: RiskEngineState
): bigint {
  return (
    account.capital +
    min(account.pnl, 0n) +
    effectiveMaturedPnl(account, engine) -
    feeDebt(account)
  );
}

/**
 * Withdrawal equity (raw): C_i + min(PNL_i, 0) - FeeDebt_i
 */
export function accountEquityWithdrawRaw(account: Account): bigint {
  return account.capital + min(account.pnl, 0n) - feeDebt(account);
}

// ============================================================================
// Margin requirements (spec §9)
// ============================================================================

/**
 * Maintenance margin requirement for an account.
 */
export function maintenanceMarginReq(
  effPos: bigint,
  oraclePrice: bigint,
  params: { maintenance_margin_bps: bigint; min_nonzero_mm_req: bigint }
): bigint {
  if (effPos === 0n) return 0n;
  const not = notional(effPos, oraclePrice);
  const bpsReq = mulDivCeil(not, params.maintenance_margin_bps, 10000n);
  return max(bpsReq, params.min_nonzero_mm_req);
}

/**
 * Initial margin requirement for an account.
 */
export function initialMarginReq(
  effPos: bigint,
  oraclePrice: bigint,
  params: { initial_margin_bps: bigint; min_nonzero_im_req: bigint }
): bigint {
  if (effPos === 0n) return 0n;
  const not = notional(effPos, oraclePrice);
  const bpsReq = mulDivCeil(not, params.initial_margin_bps, 10000n);
  return max(bpsReq, params.min_nonzero_im_req);
}

/**
 * Check if account is above maintenance margin.
 */
export function isAboveMaintenanceMargin(
  account: Account,
  engine: RiskEngineState
): boolean {
  const effPos = effectivePosQ(account, engine);
  if (effPos === 0n) return true;

  const eqRaw = accountEquityMaintRaw(account);
  const eqNet = max(eqRaw, 0n);
  const mmReq = maintenanceMarginReq(effPos, engine.last_oracle_price, engine.params);
  return eqNet > mmReq;
}

// ============================================================================
// Warmup progress (spec §6.1)
// ============================================================================

/**
 * Compute warmup progress for a single reserve cohort.
 * Returns a value 0.0 to 1.0.
 */
export function warmupProgress(
  cohort: ReserveCohort,
  currentSlot: bigint
): number {
  if (cohort.anchor_q === 0n || cohort.horizon_slots === 0n) return 1;

  const elapsed = currentSlot > cohort.start_slot
    ? currentSlot - cohort.start_slot
    : 0n;

  if (elapsed >= cohort.horizon_slots) return 1;

  return Number(elapsed * 10000n / cohort.horizon_slots) / 10000;
}

/**
 * Estimated slots remaining until a cohort fully matures.
 */
export function warmupSlotsRemaining(
  cohort: ReserveCohort,
  currentSlot: bigint
): bigint {
  const elapsed = currentSlot > cohort.start_slot
    ? currentSlot - cohort.start_slot
    : 0n;

  if (elapsed >= cohort.horizon_slots) return 0n;
  return cohort.horizon_slots - elapsed;
}

// ============================================================================
// Liquidation price estimate (client-side approximation)
// ============================================================================

/**
 * Estimate the oracle price at which an account would be liquidated.
 * This is a simplified approximation — the on-chain engine uses exact math.
 *
 * For a long: liq_price ≈ entry_price - (equity_net - mm_flat) / size
 * For a short: liq_price ≈ entry_price + (equity_net - mm_flat) / size
 */
export function estimateLiquidationPrice(
  account: Account,
  engine: RiskEngineState
): bigint | null {
  const effPos = effectivePosQ(account, engine);
  if (effPos === 0n) return null;

  const oraclePrice = engine.last_oracle_price;
  const eqRaw = accountEquityMaintRaw(account);
  const eqNet = max(eqRaw, 0n);
  const mmBps = engine.params.maintenance_margin_bps;
  const absPos = abs(effPos);

  // Distance to liquidation in price terms (approximate):
  // equity_net = mmReq at liquidation
  // mmReq ≈ |pos| * price * mmBps / (10000 * POS_SCALE)
  // equity changes by |pos| * deltaPrice / POS_SCALE
  // Solving: deltaPrice = (equity_net * POS_SCALE * 10000) / (|pos| * (10000 + mmBps))
  // This is approximate because equity and mmReq both move with price.

  const numerator = eqNet * POS_SCALE * 10000n;
  const denominator = absPos * (10000n + mmBps);

  if (denominator === 0n) return null;

  const priceDistance = numerator / denominator;

  if (effPos > 0n) {
    // Long: liquidated when price drops
    const liqPrice = oraclePrice - priceDistance;
    return liqPrice > 0n ? liqPrice : 0n;
  } else {
    // Short: liquidated when price rises
    return oraclePrice + priceDistance;
  }
}

// ============================================================================
// Trade preview helpers
// ============================================================================

/**
 * Compute position size in scaled units from USDC size and leverage.
 * size_q = floor(sizeUsdc * leverage * POS_SCALE / oraclePrice)
 */
export function computeSizeQ(
  sizeUsdc: bigint,
  leverage: bigint,
  oraclePrice: bigint
): bigint {
  if (oraclePrice === 0n) return 0n;
  return mulDivFloor(sizeUsdc * leverage, POS_SCALE, oraclePrice);
}

/**
 * Compute trading fee: ceil(|size_q| * price * fee_bps / (10000 * POS_SCALE))
 */
export function computeTradingFee(
  sizeQ: bigint,
  oraclePrice: bigint,
  feeBps: bigint
): bigint {
  const not = mulDivFloor(abs(sizeQ), oraclePrice, POS_SCALE);
  return mulDivCeil(not, feeBps, 10000n);
}

/**
 * Compute margin required for a new position.
 * margin = notional / leverage = sizeUsdc (approximately)
 */
export function computeMarginRequired(
  sizeQ: bigint,
  oraclePrice: bigint,
  imBps: bigint,
  minImReq: bigint
): bigint {
  const not = notional(sizeQ, oraclePrice);
  const bpsReq = mulDivCeil(not, imBps, 10000n);
  return max(bpsReq, minImReq);
}

// ============================================================================
// Display helpers (BigInt → number for UI)
// ============================================================================

/**
 * Convert a BigInt USDC amount (6 decimals) to a display number.
 * e.g., 1_000_000n → 1.0
 */
export function bigintToUsdc(amount: bigint, decimals = 6): number {
  const divisor = 10n ** BigInt(decimals);
  return Number(amount * 10000n / divisor) / 10000;
}

/**
 * Convert a display USDC number to BigInt (6 decimals).
 * e.g., 1.5 → 1_500_000n
 */
export function usdcToBigint(amount: number, decimals = 6): bigint {
  return BigInt(Math.round(amount * 10 ** decimals));
}

/**
 * Convert an oracle price BigInt to a display number.
 * Oracle prices are typically in units where 1 USDC = some integer.
 */
export function bigintToPrice(price: bigint): number {
  // Assumes price is in raw units — adjust divisor based on actual oracle format
  return Number(price);
}
