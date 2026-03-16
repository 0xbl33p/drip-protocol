# Risk Engine Spec (Source of Truth) — v10.5
## (Combined Single-Document Revision)

**Design:** **Protected Principal + Junior Profit Claims with Global Haircut Ratio + Lazy A/K Side Indices**
**Status:** implementation source-of-truth (normative language: MUST / MUST NOT / SHOULD / MAY)
**Scope:** perpetual DEX risk engine for a single quote-token vault.

**Goal:** preserve oracle-manipulation resistance, conservation, bounded insolvency handling, and liveness while supporting lazy ADL across the opposing open-interest side **without global scans, without canonical-order dependencies, and without sequential prefix requirements for user settlement**.

This is a **single combined spec**. It supersedes the prior delta-style revisions by restating the full current design in one document.

---

## 0. Security goals (normative)

The engine MUST provide the following properties:

1. **Protected principal for flat accounts:** An account with effective position `0` MUST NOT have its protected principal directly reduced by another account's insolvency.
2. **Explicit open-position ADL eligibility:** Accounts with open positions MAY be subject to deterministic protocol ADL if they are on the eligible opposing side of a bankrupt liquidation. ADL MUST operate through explicit protocol state, not hidden execution.
3. **Oracle manipulation safety (within warmup window `T`):** Profits created by short-lived oracle distortion MUST NOT be withdrawable as principal immediately; they are time-gated by warmup and economically capped by system backing.
4. **Profit-first haircuts:** When the system is undercollateralized, haircuts MUST apply to junior profit claims before any protected principal of flat accounts is impacted.
5. **Conservation:** The engine MUST NOT create withdrawable claims exceeding vault tokens, except for explicitly bounded rounding slack.
6. **Liveness:** The system MUST NOT require `OI == 0`, manual admin recovery, a global scan, or reconciliation of an unrelated prefix of accounts before a user can safely settle, withdraw, or liquidate.
7. **No zombie poisoning:** Non-interacting accounts MUST NOT indefinitely pin `PNL_pos_tot` and collapse the haircut ratio for all users; touched accounts MUST make warmup progress.
8. **Funding / mark / ADL exactness under laziness:** Any economic quantity whose correct value depends on the position held over an interval MUST be represented through the A/K side-index mechanism or a formally equivalent event-segmented method. Integer rounding MUST NOT mint positive aggregate claims.
9. **No hidden protocol MM:** The protocol MUST NOT secretly internalize user flow against an undisclosed residual inventory.
10. **Defined recovery from precision stress:** The engine MUST define deterministic recovery when side precision is exhausted. It MUST NOT rely on assertion failure, silent overflow, or permanent `DrainOnly` states.
11. **No sequential quantity dependency:** Same-epoch account settlement MUST be fully local. It MAY depend on the account's own stored basis and current global side state, but MUST NOT require a canonical-order prefix or global carry cursor.

---

## 1. Types, units, scaling, and arithmetic requirements

### 1.1 Amounts
- `u128` amounts are denominated in **quote-token atomic units**.
- `i256` signed amounts represent realized PnL or liabilities in quote-token atomic units.
- `u256` unsigned amounts represent positive PnL aggregates, OI, fixed-point position magnitudes, and wide nonnegative intermediates.
- If the implementation language has no native `i256/u256`, it MUST use a checked multi-limb integer type or a formally verified equivalent decomposition.

### 1.2 Prices and internal positions
- `POS_SCALE = 2^64`.
- `price: u64` is **quote-token atomic units per 1 base**. There is no separate `PRICE_SCALE`.
- Internally the engine stores position bases as signed fixed-point base quantities:
  - `basis_pos_q_i: i256`, with units `(base * POS_SCALE)`.
- The displayed base quantity is `basis_pos_q_i / POS_SCALE` only when the account is attached to the current side state. During same-epoch lazy settlement, the economically relevant quantity is the derived helper `effective_pos_q(i)`.
- Effective notional at oracle is:
  - `notional_i = floor(abs(effective_pos_q(i)) * price / POS_SCALE)`.
- Trade fees MUST use **executed trade size**, not account notional:
  - `trade_notional = floor(abs(size_q) * exec_price / POS_SCALE)`.

### 1.3 A/K scale
- `ADL_ONE = 2^96`.
- `A_side` is dimensionless and scaled by `ADL_ONE`.
- `K_side` has units `(ADL scale) * (quote atomic units per 1 base)`.

### 1.4 Concrete normative bounds
The following bounds are normative and MUST be enforced:
- `0 < price ≤ MAX_ORACLE_PRICE = 2^56 - 1`
- `abs(basis_pos_q_i) ≤ MAX_POSITION_ABS_Q = (2^40 - 1) * POS_SCALE`
- `abs(effective_pos_q(i)) ≤ MAX_POSITION_ABS_Q`
- `|funding_rate_bps_per_slot_last| ≤ MAX_ABS_FUNDING_BPS_PER_SLOT = 10_000`
- `MAX_FUNDING_DT = 2^16 - 1`
- `MAX_OI_SIDE_Q = (2^40 - 1) * POS_SCALE`
- `MAX_ACTIVE_POSITIONS_PER_SIDE` MUST be a finite implementation-enforced bound on concurrently stored nonzero positions per side.
- `MIN_A_SIDE = 2^64`
- `A_side > 0` whenever `OI_eff_side > 0` and the side is still representable.

The following interpretation is normative for dust accounting:
- `stored_pos_count_side` MAY be used as a q-unit conservative term in phantom-dust accounting because each live stored position can contribute at most one additional q-unit from threshold-crossing when a global `A_side` truncation occurs.

### 1.5 Arithmetic requirements
The engine MUST satisfy all of the following:

1. All products involving `A_side`, `K_side`, `k_snap_i`, `basis_pos_q_i`, `effective_pos_q(i)`, `price`, funding deltas, or ADL deltas MUST use checked arithmetic.
2. `dt` inside `accrue_market_to` MUST be split into internal sub-steps with `dt ≤ MAX_FUNDING_DT`.
3. The conservation check `V ≥ C_tot + I` and any `Residual` computation MUST use checked `u128` addition for `C_tot + I`. Overflow is invariant violation.
4. Signed division with positive denominator MUST use the exact helper in §4.7.
5. Positive ceiling division MUST use the exact helper in §4.7.
6. Warmup-cap computation `w_slope_i * elapsed` MUST use `saturating_mul_u256_u64` or a formally equivalent `min`-preserving construction.
7. Every decrement of `stored_pos_count_*`, `stale_account_count_*`, or `phantom_dust_bound_*_q` MUST use checked subtraction. Underflow indicates corruption and MUST fail conservatively.
8. Every increment of `stored_pos_count_*` or `phantom_dust_bound_*_q` MUST use checked addition. Overflow indicates corrupted capacity accounting and MUST fail conservatively.
9. In `accrue_market_to`, the funding contribution MUST delay division by `10_000` until after multiplication by `A_side`, and MUST be derived from the payer side first so that rounding cannot mint positive aggregate claims.
10. `K_side` is cumulative across epochs. Implementations MUST either rely on the concrete bound in §1.5.1 or provide a stricter rollover plan.
11. The calculation of same-epoch or epoch-mismatch `pnl_delta` MUST evaluate the signed numerator in an exact intermediate wider than signed 256 bits. A signed 512-bit intermediate is RECOMMENDED.
12. The haircut paths `floor(PNL_pos_i * h_num / h_den)` and `floor(x * h_num / h_den)` MUST use exact wide `mul_div_floor` arithmetic or a formally equivalent decomposition.
13. The ADL quote-deficit path MUST compute the exact required K-index delta directly as:
    - `delta_K_abs = ceil(D * (A_old as u256) * POS_SCALE / OI)`
    using an exact wide intermediate.
14. If `delta_K_abs` is not representable as an `i256` magnitude, the engine MUST route the quote deficit through `absorb_protocol_loss(D)` and continue the quantity-socialization path without modifying `K_opp`.
15. The ADL representability check MUST be based on the **final** signed addition `K_opp + delta_K_exact`, where `delta_K_exact = -(delta_K_abs as i256)`.
16. `PNL_i` MUST be maintained in the closed interval `[i256::MIN + 1, i256::MAX]`. Any operation that would set `PNL_i == i256::MIN` is non-compliant and MUST fail conservatively.
17. Global A-truncation dust added in `enqueue_adl` MUST be accounted using checked arithmetic and the exact conservative bound from §5.6.

### 1.5.1 Reference bound
Under the concrete bounds above, a single bounded `accrue_market_to` sub-step contributes at most:
- mark term: `ADL_ONE * MAX_ORACLE_PRICE ≤ 2^96 * 2^56 = 2^152`
- funding term: `ADL_ONE * (MAX_ABS_FUNDING_BPS_PER_SLOT * MAX_ORACLE_PRICE * MAX_FUNDING_DT / 10_000) ≤ 2^96 * 2^72 = 2^168`

Therefore a signed-256 `K_side` still has large lifetime headroom under realistic operation, but exact same-epoch `pnl_delta` MUST nonetheless use a wider numerator than 256 bits.

---

## 2. State model

### 2.1 Account state
For each account `i`, the engine stores at least:
- `C_i: u128` — protected principal.
- `PNL_i: i256` — realized PnL claim.
- `R_i: u256` — reserved positive PnL, with `0 ≤ R_i ≤ max(PNL_i, 0)`.
- `basis_pos_q_i: i256` — signed fixed-point base **basis** at the last explicit position mutation or forced zeroing. This is not necessarily the current effective quantity.
- `a_basis_i: u128` — side multiplier in effect when `basis_pos_q_i` was last explicitly attached.
- `k_snap_i: i256` — last realized `K_side` snapshot.
- `epoch_snap_i: u64` — side epoch in which the basis is defined.
- `fee_credits_i: i128`.
- `last_fee_slot_i: u64`.
- `w_start_i: u64`.
- `w_slope_i: u256`.

**Fee-credit bound and exact debt definition:**
- `fee_credits_i` MUST be initialized to `0`.
- The engine MUST maintain `-(i128::MAX) ≤ fee_credits_i ≤ i128::MAX` at all times. `fee_credits_i == i128::MIN` is forbidden.
- `FeeDebt_i = fee_debt_u128_checked(fee_credits_i)`.
- Any operation that would decrement `fee_credits_i` below `-(i128::MAX)` MUST fail conservatively.

### 2.2 Global engine state
The engine stores at least:
- `V: u128`
- `I: u128`
- `I_floor: u128`
- `current_slot: u64`
- `P_last: u64`
- `slot_last: u64`
- `r_last: i64`
- `fund_px_last: u64`
- `A_long: u128`
- `A_short: u128`
- `K_long: i256`
- `K_short: i256`
- `epoch_long: u64`
- `epoch_short: u64`
- `K_epoch_start_long: i256`
- `K_epoch_start_short: i256`
- `OI_eff_long: u256`
- `OI_eff_short: u256`
- `mode_long ∈ {Normal, DrainOnly, ResetPending}`
- `mode_short ∈ {Normal, DrainOnly, ResetPending}`
- `stored_pos_count_long: u64`
- `stored_pos_count_short: u64`
- `stale_account_count_long: u64`
- `stale_account_count_short: u64`
- `phantom_dust_bound_long_q: u256`
- `phantom_dust_bound_short_q: u256`
- `C_tot: u128 = Σ C_i`
- `PNL_pos_tot: u256 = Σ max(PNL_i, 0)`

### 2.3 Initial state
At market initialization, the engine MUST set:
- `A_long = ADL_ONE`, `A_short = ADL_ONE`
- `K_long = 0`, `K_short = 0`
- `epoch_long = 0`, `epoch_short = 0`
- `K_epoch_start_long = 0`, `K_epoch_start_short = 0`
- `OI_eff_long = 0`, `OI_eff_short = 0`
- `mode_long = Normal`, `mode_short = Normal`
- `stored_pos_count_long = 0`, `stored_pos_count_short = 0`
- `stale_account_count_long = 0`, `stale_account_count_short = 0`
- `phantom_dust_bound_long_q = 0`, `phantom_dust_bound_short_q = 0`

### 2.4 Side modes
A side may be in one of three modes:
- `Normal`: ordinary operation.
- `DrainOnly`: the side is live but has decayed below the safe precision threshold; OI on that side may decrease but MUST NOT increase.
- `ResetPending`: the side has been fully drained and its prior epoch is awaiting stale-account reconciliation. During `ResetPending`, no operation may increase OI on that side.

### 2.5 `begin_full_drain_reset(side)`
The engine MUST provide a helper that begins a full-drain epoch rollover for one side. It MUST:
1. require `OI_eff_side == 0`
2. set `K_epoch_start_side = K_side`
3. increment `epoch_side` by exactly 1
4. set `A_side = ADL_ONE`
5. set `stale_account_count_side = stored_pos_count_side`
6. set `phantom_dust_bound_side_q = 0`
7. set `mode_side = ResetPending`

### 2.6 `MIN_A_SIDE` is a live-side trigger, not a snapshot invariant
`MIN_A_SIDE` applies only to the current live `A_side` and triggers `DrainOnly`. It is not a lower bound on historical `a_basis_i`.

### 2.7 `finalize_side_reset(side)`
`finalize_side_reset(side)` MAY succeed only if all of the following hold:
1. `mode_side == ResetPending`
2. `OI_eff_side == 0`
3. `stale_account_count_side == 0`
4. `stored_pos_count_side == 0`

On success, the engine MUST set `mode_side = Normal`.

### 2.8 `maybe_finalize_ready_reset_sides_before_oi_increase()`
The engine MUST provide a helper that checks each side independently and, if all `finalize_side_reset(side)` preconditions already hold, immediately invokes `finalize_side_reset(side)`.

This helper MUST NOT begin a new reset, mutate `A_side`, `K_side`, `epoch_side`, `OI_eff_side`, or any account state. It may only transition an already-eligible clean-empty side from `ResetPending` to `Normal`.

---

## 3. Junior-profit solvency via the global haircut ratio

### 3.1 Residual backing available to junior profits
Define:
- `senior_sum = checked_add_u128(C_tot, I)`
- `Residual = max(0, V - senior_sum)`

`Residual` is the only backing for positive realized PnL that has not been converted into principal.

**Invariant:** The engine MUST maintain `V ≥ senior_sum` at all times.

### 3.2 Haircut ratio `h`
Let:
- if `PNL_pos_tot == 0`, define `h = 1`
- else:
  - `h_num = min((Residual as u256), PNL_pos_tot)`
  - `h_den = PNL_pos_tot`

### 3.3 Effective positive PnL and net equity after touch
For account `i`:
- `PNL_pos_i = max(PNL_i, 0)`
- if `PNL_pos_tot == 0`, then `PNL_eff_pos_i = PNL_pos_i`
- else `PNL_eff_pos_i = mul_div_floor_u256(PNL_pos_i as u256, h_num, h_den)`

Define:
- `Eq_real_i = max(0, (C_i as i256) + min(PNL_i, 0) + (PNL_eff_pos_i as i256))`
- `Eq_net_i = max(0, Eq_real_i - (FeeDebt_i as i256))`

All margin checks MUST use `Eq_net_i` on the **touched** account state.

### 3.4 Conservatism under pending A/K side effects
The engine computes `h` only over stored realized state. Therefore:
- pending positive mark/funding/ADL effects MUST NOT be withdrawable until touch,
- pending negative mark/funding/ADL effects MAY temporarily make `C_tot` / `PNL_pos_tot` conservative relative to a fully-cranked state,
- pending lazy ADL obligations MUST NOT be counted as backing in `Residual`.

### 3.5 Rounding and conservation
Because each `PNL_eff_pos_i` is floored independently:
- `Σ PNL_eff_pos_i ≤ h_num ≤ Residual`.

---

## 4. Canonical helpers

### 4.1 `checked_add_u128(a, b)`
Must either return the exact `u128` sum or signal overflow.

### 4.2 `set_capital(i, new_C)`
When changing `C_i` from `old_C` to `new_C`, the engine MUST update `C_tot` by the signed delta in a checked manner and then set `C_i = new_C`.

### 4.3 `set_pnl(i, new_PNL)`
When changing `PNL_i` from `old` to `new`, the engine MUST:
1. require `new != i256::MIN`
2. let `old_pos = max(old, 0) as u256`
3. let `new_pos = max(new, 0) as u256`
4. if `new_pos > old_pos`, update `PNL_pos_tot += (new_pos - old_pos)` using checked `u256` addition
5. else update `PNL_pos_tot -= (old_pos - new_pos)` using checked `u256` subtraction
6. set `PNL_i = new`
7. clamp `R_i := min(R_i, new_pos)`

All code paths that modify PnL MUST call `set_pnl`.

### 4.4 `set_position_basis_q(i, new_basis_pos_q)`
When changing stored `basis_pos_q_i` from `old` to `new`, the engine MUST update `stored_pos_count_long` and `stored_pos_count_short` exactly once using the sign flags of `old` and `new`, then write `basis_pos_q_i = new_basis_pos_q`.

For a single logical position change, `set_position_basis_q` MUST be called exactly once with the final target. Passing through an intermediate zero value is not permitted.

### 4.5 `attach_effective_position(i, new_eff_pos_q)`
This helper MUST convert a current effective quantity into a new position basis at the current side state.

If the account currently has a nonzero same-epoch basis and this helper is about to discard that basis (by writing either `0` or a different nonzero basis), then the engine MUST first account for any orphaned unresolved same-epoch quantity remainder:
- let `s = side(basis_pos_q_i)`
- if `epoch_snap_i == epoch_s`, compute `rem = (abs(basis_pos_q_i) * A_s) mod a_basis_i` in exact wide arithmetic
- if `rem != 0`, invoke `inc_phantom_dust_bound(s)`

A caller MUST NOT use `attach_effective_position` as a no-op refresh. If `new_eff_pos_q` equals the account's current `effective_pos_q(i)` with the same sign, the helper SHOULD preserve the existing basis and snapshots rather than discard and recreate them.

If `new_eff_pos_q == 0`, it MUST:
- `set_position_basis_q(i, 0)`
- reset snapshots to canonical zero-position defaults in the current epoch.

If `new_eff_pos_q != 0`, it MUST:
- `set_position_basis_q(i, new_eff_pos_q)`
- `a_basis_i = A_side(new_eff_pos_q)`
- `k_snap_i = K_side(new_eff_pos_q)`
- `epoch_snap_i = epoch_side(new_eff_pos_q)`.

### 4.6 `inc_phantom_dust_bound(side)`
This helper MUST increment `phantom_dust_bound_side_q` by exactly `1` q-unit using checked addition.

### 4.6.1 `inc_phantom_dust_bound_by(side, amount_q)`
This helper MUST increment `phantom_dust_bound_side_q` by exactly `amount_q` q-units using checked addition.

### 4.7 Exact helper definitions (normative)
The engine MUST use the following exact helpers.

**Signed conservative floor division:**
```text
floor_div_signed_conservative(n, d):
  require d > 0
  q = trunc_toward_zero(n / d)
  r = n % d
  if n < 0 and r != 0:
      return q - 1
  else:
      return q
```

**Positive checked ceiling division:**
```text
ceil_div_positive_checked(n, d):
  require d > 0
  q = n / d
  r = n % d
  if r != 0:
      return q + 1
  else:
      return q
```

**Exact wide multiply-divide floor for nonnegative inputs:**
```text
mul_div_floor_u256(a, b, d):
  require d > 0
  compute exact wide product p = a * b
  return floor(p / d)
```

**Exact wide multiply-divide ceil for nonnegative inputs:**
```text
mul_div_ceil_u256(a, b, d):
  require d > 0
  compute exact wide product p = a * b
  return ceil(p / d)
```

**Checked fee-debt conversion:**
```text
fee_debt_u128_checked(fee_credits):
  require fee_credits != i128::MIN
  if fee_credits >= 0:
      return 0
  else:
      return (-fee_credits) as u128
```

**Saturating warmup-cap multiply:**
```text
saturating_mul_u256_u64(a, b):
  if a == 0 or b == 0:
      return 0
  if a > u256::MAX / b:
      return u256::MAX
  else:
      return a * b
```

### 4.8 `absorb_protocol_loss(loss)`
This helper is the normative accounting path for uncovered losses that are no longer attached to an open position.

**Precondition:** `loss > 0`.

Given `loss` as a `u256` quote amount:
1. `available_I = I.saturating_sub(I_floor)` as a `u128` amount.
2. `pay_I = min(loss, available_I as u256)`.
3. `I := I - (pay_I as u128)`.
4. `loss_rem := loss - pay_I`.
5. if `loss_rem > 0`, no additional decrement to `V` occurs. The uncovered loss is represented by junior undercollateralization through `h`.

---

## 5. Unified A/K side-index mechanics

### 5.1 Eager-equivalent event law
For one side of the book, a single eager global event on absolute fixed-point position `q_q ≥ 0` and realized PnL `p` has the form:
- `q_q' = α q_q`
- `p' = p + β * q_q / POS_SCALE`

where:
- `α ∈ [0, 1]` is the surviving-position fraction,
- `β` is quote PnL per unit **pre-event** base position.

The cumulative side indices compose as:
- `A_new = A_old * α`
- `K_new = K_old + A_old * β`.

### 5.2 `effective_pos_q(i)`
For an account `i` on side `s` with nonzero basis:
- if `epoch_snap_i != epoch_s`, then `effective_pos_q(i) = 0` for current-market risk purposes until the account is touched and zeroed.
- else `effective_abs_pos_q(i) = floor(abs(basis_pos_q_i) * A_s / a_basis_i)`.
- `effective_pos_q(i) = sign(basis_pos_q_i) * effective_abs_pos_q(i)`.

### 5.3 `settle_side_effects(i)`
When touching account `i`:
1. If `basis_pos_q_i == 0`, return immediately.
2. Let `s = side(basis_pos_q_i)`.
3. If `epoch_snap_i == epoch_s` (same epoch):
   - compute `q_eff_new = floor(abs(basis_pos_q_i) * A_s / a_basis_i)` using exact checked arithmetic
   - compute `num = abs(basis_pos_q_i) * (K_s - k_snap_i)` in a wide signed intermediate
   - `den = a_basis_i * POS_SCALE`
   - `pnl_delta = floor_div_signed_conservative(num, den)`
   - `set_pnl(i, PNL_i + pnl_delta)`
   - if `q_eff_new == 0`:
     - `inc_phantom_dust_bound(s)`
     - `set_position_basis_q(i, 0)`
     - reset snapshots to canonical zero-position defaults in `epoch_s`
   - else:
     - **do not change** `basis_pos_q_i` or `a_basis_i`
     - set `k_snap_i = K_s`
     - set `epoch_snap_i = epoch_s`
4. Else (epoch mismatch):
   - require `mode_s == ResetPending`
   - require `epoch_snap_i + 1 == epoch_s`
   - compute `num = abs(basis_pos_q_i) * (K_epoch_start_s - k_snap_i)` in a wide signed intermediate
   - `den = a_basis_i * POS_SCALE`
   - `pnl_delta = floor_div_signed_conservative(num, den)`
   - `set_pnl(i, PNL_i + pnl_delta)`
   - `set_position_basis_q(i, 0)`
   - decrement `stale_account_count_s` using checked subtraction
   - reset snapshots to canonical zero-position defaults in `epoch_s`

### 5.4 `accrue_market_to(now_slot, oracle_price)`
Before any operation that depends on current market state, the engine MUST call `accrue_market_to(now_slot, oracle_price)`.

This helper MUST:
1. Advance time in bounded internal steps, each with `dt ≤ MAX_FUNDING_DT`.
2. Treat `OI_eff_long` and `OI_eff_short` read at the start of the invocation as fixed for all internal sub-steps of that invocation.
3. For each internal step, compute signed `ΔP = oracle_price_step - P_last_step`.
4. Apply mark-to-market through side coefficients only if that side has live effective OI:
   - if `OI_eff_long > 0`, `K_long += A_long * ΔP`
   - if `OI_eff_short > 0`, `K_short -= A_short * ΔP`
5. Apply funding for the interval using the stored rate and stored price sample only if that side has live effective OI:
   - Let `funding_term_raw = fund_px_last * abs(r_last) * dt`, computed in a signed `i128` or wider checked intermediate.
   - If `r_last == 0`, no funding adjustment is applied.
   - If `r_last > 0`, longs are the payer side and shorts are the receiver side.
   - If `r_last < 0`, shorts are the payer side and longs are the receiver side.
   - Let `A_p = A_side(payer)` and `A_r = A_side(receiver)`.
   - Compute the payer K-space loss first:
     - `delta_K_payer_abs = ceil(A_p * funding_term_raw / 10_000)` using exact wide arithmetic.
   - Derive the receiver K-space gain from the payer loss using exact wide arithmetic:
     - `delta_K_receiver_abs = floor(delta_K_payer_abs * A_r / A_p)`.
   - Apply:
     - `K_payer -= delta_K_payer_abs`
     - `K_receiver += delta_K_receiver_abs`
   - This rounding is **payer-conservative** and MUST NOT mint positive aggregate claims.
6. Update `slot_last`, `P_last`, and `fund_px_last` for the next interval.

### 5.5 Funding anti-retroactivity
If funding-rate inputs can change because of mutable engine state, then before any operation that can change those inputs, the engine MUST:
1. call `accrue_market_to(now_slot, oracle_price)` using the currently stored `r_last`
2. apply the state change
3. recompute the next funding rate
4. store the new rate in `r_last` for the next interval only.

### 5.6 `enqueue_adl(ctx, liq_side, q_close_q, D)`
Suppose a bankrupt liquidation from side `liq_side` leaves an uncovered deficit `D ≥ 0` as a `u256` quote amount after the liquidated account's principal and realized PnL have been exhausted.

`q_close_q` is the fixed-point base quantity removed from the liquidated side by the bankrupt liquidation and MAY be zero.

Preconditions:
- `opp = opposite(liq_side)`
- `ctx` is the current top-level instruction's reset-scheduling context

The engine MUST perform the following in order:
1. If `q_close_q > 0`, decrease the liquidated side OI:
   - `OI_eff_liq_side := OI_eff_liq_side - q_close_q`
   using checked subtraction.
2. Read `OI = OI_eff_opp` at this moment.
3. If `OI == 0`:
   - if `D > 0`, invoke `absorb_protocol_loss(D)`
   - return.
4. If `OI > 0` and `stored_pos_count_opp == 0`:
   - require `q_close_q ≤ OI`
   - let `OI_post = OI - q_close_q`
   - if `D > 0`, invoke `absorb_protocol_loss(D)` and do **not** modify `K_opp`
   - set `OI_eff_opp := OI_post`
   - if `OI_post == 0`, set `ctx.pending_reset_opp = true`
   - return.
5. Else (`OI > 0` and `stored_pos_count_opp > 0`):
   - require `q_close_q ≤ OI`
   - let `A_old = A_opp`
   - let `OI_post = OI - q_close_q`
6. If `D > 0`:
   - compute `delta_K_abs = ceil(D * (A_old as u256) * POS_SCALE / OI)` using an exact wide intermediate
   - if `delta_K_abs` is not representable as an `i256` magnitude, invoke `absorb_protocol_loss(D)` and do **not** modify `K_opp`
   - else let `delta_K_exact = -(delta_K_abs as i256)` and test whether `K_opp + delta_K_exact` fits in `i256`
     - if it fits, apply `K_opp := K_opp + delta_K_exact`
     - if it does not fit, invoke `absorb_protocol_loss(D)` instead and do **not** modify `K_opp`
7. If `OI_post == 0`:
   - set `OI_eff_opp := 0`
   - set `ctx.pending_reset_opp = true`
   - return.
8. Compute the exact wide product:
   - `A_prod_exact = A_old * OI_post`
9. Compute:
   - `A_candidate = floor(A_prod_exact / OI)`
   - `A_trunc_rem = A_prod_exact mod OI`
10. If `A_candidate > 0`:
   - set `A_opp := A_candidate`
   - set `OI_eff_opp := OI_post`
   - only if `A_trunc_rem != 0`, account for global A-truncation dust:
     - let `N_opp = stored_pos_count_opp as u256`
     - let `global_a_dust_bound = N_opp + ceil((OI + N_opp) / A_old)`
     - apply `inc_phantom_dust_bound_by(opp, global_a_dust_bound)`
   - if `A_opp < MIN_A_SIDE`, set `mode_opp = DrainOnly`
   - return.
11. If `A_candidate == 0` while `OI_post > 0`, the side has exhausted representable quantity precision. The engine MUST enter a **precision-exhaustion terminal drain**:
   - set `OI_eff_opp := 0`
   - set `OI_eff_liq_side := 0`
   - set `ctx.pending_reset_opp = true`
   - set `ctx.pending_reset_liq_side = true`

**Normative intent:**
- Quantity socialization MUST never assert-fail due to `A_side` rounding to zero.
- Global A-truncation dust MUST be bounded in `phantom_dust_bound_opp_q` when and only when actual truncation occurs.
- Real quote deficits MUST NOT be written into `K_opp` when there are no opposing stored positions left to realize that K change.

### 5.7 `schedule_end_of_instruction_resets(ctx)`
This helper MUST be called exactly once, **after all explicit position mutations and snapshot attachments** in each top-level external instruction.

It MUST perform the following in order.

#### 5.7.A Bilateral-empty dust clearance
If:
- `stored_pos_count_long == 0`, and
- `stored_pos_count_short == 0`,

then:
1. define `clear_bound_q = phantom_dust_bound_long_q + phantom_dust_bound_short_q` using checked addition
2. define `has_residual_clear_work = (OI_eff_long > 0) or (OI_eff_short > 0) or (phantom_dust_bound_long_q > 0) or (phantom_dust_bound_short_q > 0)`
3. if `has_residual_clear_work`:
   - require `OI_eff_long == OI_eff_short`; otherwise fail conservatively
   - if `OI_eff_long ≤ clear_bound_q` and `OI_eff_short ≤ clear_bound_q`:
     - set `OI_eff_long = 0`
     - set `OI_eff_short = 0`
     - set `ctx.pending_reset_long = true`
     - set `ctx.pending_reset_short = true`
   - else fail conservatively.

#### 5.7.B Unilateral-empty symmetric dust clearance
Else if:
- `stored_pos_count_long == 0`, and
- `stored_pos_count_short > 0`,

then:
1. define `has_residual_clear_work = (OI_eff_long > 0) or (OI_eff_short > 0) or (phantom_dust_bound_long_q > 0)`
2. if `has_residual_clear_work`:
   - require `OI_eff_long == OI_eff_short`; otherwise fail conservatively
   - if `OI_eff_long ≤ phantom_dust_bound_long_q`:
     - set `OI_eff_long = 0`
     - set `OI_eff_short = 0`
     - set `ctx.pending_reset_long = true`
     - set `ctx.pending_reset_short = true`
   - else fail conservatively.

#### 5.7.C Symmetric counterpart
Else if:
- `stored_pos_count_short == 0`, and
- `stored_pos_count_long > 0`,

then:
1. define `has_residual_clear_work = (OI_eff_long > 0) or (OI_eff_short > 0) or (phantom_dust_bound_short_q > 0)`
2. if `has_residual_clear_work`:
   - require `OI_eff_long == OI_eff_short`; otherwise fail conservatively
   - if `OI_eff_short ≤ phantom_dust_bound_short_q`:
     - set `OI_eff_long = 0`
     - set `OI_eff_short = 0`
     - set `ctx.pending_reset_long = true`
     - set `ctx.pending_reset_short = true`
   - else fail conservatively.

#### 5.7.D DrainOnly zero-OI reset scheduling
After the above dust-clear logic:
- if `mode_long == DrainOnly` and `OI_eff_long == 0`, set `ctx.pending_reset_long = true`
- if `mode_short == DrainOnly` and `OI_eff_short == 0`, set `ctx.pending_reset_short = true`

### 5.8 `finalize_end_of_instruction_resets(ctx)`
This helper MUST be called exactly once at the end of each top-level external instruction, after §5.7.

Once either `ctx.pending_reset_long` or `ctx.pending_reset_short` becomes true during a top-level external instruction, that instruction MUST NOT perform any additional account touches, liquidations, or explicit position mutations that rely on live authoritative OI. It MUST proceed directly to §§5.7–5.8 after completing any already-started local bookkeeping that does not read or mutate live side exposure.

It MUST, in order:
- if `ctx.pending_reset_long` and `mode_long != ResetPending`, invoke `begin_full_drain_reset(long)`
- if `ctx.pending_reset_short` and `mode_short != ResetPending`, invoke `begin_full_drain_reset(short)`
- if `mode_long == ResetPending` and `OI_eff_long == 0` and `stale_account_count_long == 0` and `stored_pos_count_long == 0`, invoke `finalize_side_reset(long)`
- if `mode_short == ResetPending` and `OI_eff_short == 0` and `stale_account_count_short == 0` and `stored_pos_count_short == 0`, invoke `finalize_side_reset(short)`

---

## 6. Warmup

### 6.1 Parameter
- `T = warmup_period_slots`.
- If `T == 0`, warmup is instantaneous.

### 6.2 Available gross positive PnL
- `AvailGross_i = max(PNL_i, 0) - R_i`.

### 6.3 Warmable gross amount
If `T == 0`, define:
- `WarmableGross_i = AvailGross_i`.

Otherwise let:
- `elapsed = current_slot - w_start_i`
- `cap = saturating_mul_u256_u64(w_slope_i, elapsed)`

Then:
- `WarmableGross_i = min(AvailGross_i, cap)`.

### 6.4 Warmup slope update rule
After any change that **increases** `AvailGross_i`:
- if `AvailGross_i == 0`, then `w_slope_i = 0`
- else if `T > 0`, then `w_slope_i = max(1, floor(AvailGross_i / T))`
- else (`T == 0`), then `w_slope_i = AvailGross_i`
- `w_start_i = current_slot`

### 6.5 Restart-on-new-profit rule via eager auto-conversion
When an operation increases `AvailGross_i`, the invoking routine MUST provide `old_warmable_i`, which is `WarmableGross_i` evaluated strictly **before** the profit-increasing event.

The engine MUST:
1. If `old_warmable_i > 0`, execute the profit-conversion logic of §7.4 substituting `x = old_warmable_i`.
2. If step 1 increased `C_i`, the invoking routine MUST immediately execute the fee-debt sweep of §7.5 before any subsequent step in the same top-level routine that may consume capital, assess margin, or absorb uncovered losses.
3. After step 1 (or immediately if `old_warmable_i == 0`), update the warmup slope per §6.4 using the **new remaining** `AvailGross_i`.

---

## 7. Loss settlement, uncovered loss resolution, profit conversion, and fee-debt sweep

### 7.1 Loss settlement from principal
If `PNL_i < 0`, the engine MUST immediately attempt to settle from principal:
1. require `PNL_i != i256::MIN`
2. `need = -PNL_i`
3. `pay = min(need, C_i as i256)`
4. apply:
   - `set_capital(i, C_i - (pay as u128))`
   - `set_pnl(i, PNL_i + pay)`

### 7.2 Open-position negative remainder
If after §7.1:
- `PNL_i < 0` and `effective_pos_q(i) != 0`,

then the account MUST NOT be silently zeroed. It remains liquidatable and must be resolved through liquidation / ADL.

### 7.3 Zero-position negative remainder
If after §7.1:
- `PNL_i < 0` and `effective_pos_q(i) == 0`,

then the engine MUST:
1. call `absorb_protocol_loss((-PNL_i) as u256)`
2. `set_pnl(i, 0)`

### 7.4 Profit conversion
Let `x = WarmableGross_i`. If `x == 0`, do nothing.

Compute `y` using the pre-conversion haircut ratio:
- if `PNL_pos_tot == 0`, `y = x`
- else `y = mul_div_floor_u256(x, h_num, h_den)`

Apply:
- `set_pnl(i, PNL_i - (x as i256))`
- `set_capital(i, C_i + (y as u128))`

Then handle the warmup schedule as follows:
- if `T == 0`, set `w_start_i = current_slot` and `w_slope_i = 0` if `AvailGross_i == 0` else `AvailGross_i`
- else if `AvailGross_i == 0`, set `w_slope_i = 0` and `w_start_i = current_slot`
- else:
  - set `w_start_i = current_slot`
  - preserve the existing `w_slope_i`

### 7.5 Fee-debt sweep after capital increase
After any operation that increases `C_i`, the engine MUST immediately pay down fee debt:
1. `debt = fee_debt_u128_checked(fee_credits_i)`
2. `pay = min(debt, C_i)`
3. apply:
   - `set_capital(i, C_i - pay)`
   - `fee_credits_i += pay as i128`
   - `I += pay`

---

## 8. Fees

### 8.1 Trading fees
Trading fees are explicit transfers to insurance and MUST NOT be socialized through `h`.

- `fee = ceil_div_positive_checked(trade_notional * trading_fee_bps, 10_000)`.
- if `trading_fee_bps > 0` and `trade_notional > 0`, then `fee ≥ 1`.
- if `trading_fee_bps == 0`, then `fee = 0`.

Charge the fee safely without reverting on low principal:
1. `fee_paid = min(fee, C_payer)`
2. `set_capital(payer, C_payer - fee_paid)`
3. `I += fee_paid`
4. `fee_shortfall = fee - fee_paid`
5. if `fee_shortfall > 0`, deduct it directly from PnL via `set_pnl(payer, PNL_payer - (fee_shortfall as i256))`

### 8.2 Maintenance fees
Maintenance fees MAY be charged and MAY create negative `fee_credits_i`.
Position-linear recurring fees MUST use the A/K side-index layer, not stale basis positions.

### 8.3 Fee debt as margin liability
`FeeDebt_i = fee_debt_u128_checked(fee_credits_i)`:
- MUST reduce `Eq_net_i`
- MUST be swept whenever principal becomes available
- MUST NOT directly change `Residual` or `PNL_pos_tot`

---

## 9. Margin checks and liquidation

### 9.1 Margin requirements
After `touch_account_full(i, oracle_price, now_slot)`, define:
- `Notional_i = floor(abs(effective_pos_q(i)) * oracle_price / POS_SCALE)`
- `MM_req = floor(Notional_i * maintenance_bps / 10_000)`
- `IM_req = floor(Notional_i * initial_bps / 10_000)`

Healthy conditions:
- maintenance healthy if `Eq_net_i > MM_req as i256`
- initial-margin healthy if `Eq_net_i ≥ IM_req as i256`

### 9.2 Risk-increasing definition
A trade is risk-increasing when either:
1. `abs(new_eff_pos_q_i) > abs(old_eff_pos_q_i)`, or
2. the position sign flips across zero.

Flat to nonzero is also risk-increasing.

### 9.3 Liquidation eligibility
An account is liquidatable when after a full `touch_account_full`:
- `effective_pos_q(i) != 0`, and
- `Eq_net_i ≤ MM_req as i256`.

### 9.4 Partial liquidation
A liquidation MAY be partial if the resulting account becomes healthy and no uncovered negative remainder remains attached to an open position.

### 9.5 Bankruptcy liquidation
If an account cannot be restored by partial liquidation, the engine MUST be able to perform a bankruptcy liquidation:
1. `touch_account_full(i, oracle_price, now_slot)`
2. Let `old_eff_pos_q_i = effective_pos_q(i)`, require `old_eff_pos_q_i != 0`, and let `liq_side = side(old_eff_pos_q_i)`
3. The liquidation policy MUST determine the fixed-point base quantity `q_close_q ≥ 0` to be closed synthetically, with `q_close_q ≤ abs(old_eff_pos_q_i)`, and MUST realize any execution slippage into `PNL_i`
4. Let `new_eff_pos_q_i = old_eff_pos_q_i - sign(old_eff_pos_q_i) * q_close_q`
   - If `new_eff_pos_q_i != old_eff_pos_q_i`, use `attach_effective_position(i, new_eff_pos_q_i)`
   - Else preserve the existing basis and snapshots unchanged
5. `OI_eff_liq_side` MUST NOT be decremented anywhere except through `enqueue_adl`
6. Settle losses from principal (§7.1)
7. Charge liquidation fee safely:
   - `fee_paid = min(liq_fee, C_i)`
   - `set_capital(i, C_i - fee_paid)`
   - `I += fee_paid`
   - `fee_shortfall = liq_fee - fee_paid`
   - if `fee_shortfall > 0`, `set_pnl(i, PNL_i - (fee_shortfall as i256))`
8. Determine the uncovered bankruptcy deficit `D`:
   - if `effective_pos_q(i) == 0` and `PNL_i < 0`, let `D = (-PNL_i) as u256`
   - else let `D = 0`
9. If `q_close_q > 0` or `D > 0`, invoke `enqueue_adl(ctx, liq_side, q_close_q, D)`
10. If `D > 0`, apply `set_pnl(i, 0)` after the deficit has been routed

### 9.6 Side-mode gating
Before any top-level instruction rejects an OI-increasing operation because a side is in `ResetPending`, it MUST first invoke `maybe_finalize_ready_reset_sides_before_oi_increase()`.

Any operation that would increase **net side OI** on a side whose mode is `DrainOnly` or `ResetPending` MUST be rejected.

---

## 10. External operations

### 10.1 `touch_account_full(i, oracle_price, now_slot)`
Canonical settle routine. MUST perform, in order:
1. `current_slot = now_slot`
2. `accrue_market_to(now_slot, oracle_price)`
3. `old_avail = max(PNL_i, 0) - R_i`
4. `old_warmable_i = WarmableGross_i` evaluated strictly before any profit-increasing state transition in this call
5. `settle_side_effects(i)`
6. `new_avail = max(PNL_i, 0) - R_i`
7. if `new_avail > old_avail`:
   - record `capital_before_restart = C_i`
   - invoke the restart-on-new-profit rule (§6.5) passing `old_warmable_i`
   - if `C_i > capital_before_restart`, immediately sweep fee debt (§7.5)
8. charge account-local maintenance / extend fee debt if any
9. settle losses from principal (§7.1)
10. if `effective_pos_q(i) == 0` and `PNL_i < 0`, resolve uncovered loss per §7.3
11. convert warmable profits (§7.4)
12. sweep fee debt (§7.5)

`touch_account_full` MUST NOT itself begin a side reset.

### 10.2 `deposit(i, amount)`
`deposit` is a **pure capital-transfer instruction**. It MUST NOT implicitly call `touch_account_full` or otherwise mutate side state.

Effects:
- `V += amount`
- `set_capital(i, C_i + amount)`
- immediately apply fee-debt sweep (§7.5)

### 10.3 `withdraw(i, amount, oracle_price, now_slot)`
Procedure:
1. initialize fresh instruction context `ctx`
2. `touch_account_full(i, oracle_price, now_slot)`
3. require `amount ≤ C_i`
4. if `effective_pos_q(i) != 0`, require post-withdraw `Eq_net_i` to satisfy initial margin
5. apply:
   - `set_capital(i, C_i - amount)`
   - `V -= amount`
6. `schedule_end_of_instruction_resets(ctx)`
7. `finalize_end_of_instruction_resets(ctx)`

### 10.4 `execute_trade(a, b, oracle_price, now_slot, size_q, exec_price)`
`size_q > 0` means account `a` buys base from account `b`.

Procedure:
1. initialize fresh instruction context `ctx`
2. `touch_account_full(a, oracle_price, now_slot)`
3. `touch_account_full(b, oracle_price, now_slot)`
4. let `old_eff_pos_q_a = effective_pos_q(a)` and `old_eff_pos_q_b = effective_pos_q(b)`
5. invoke `maybe_finalize_ready_reset_sides_before_oi_increase()`
6. reject if the trade would increase **net side OI** on any side whose mode is `DrainOnly` or `ResetPending`
7. define resulting effective positions:
   - `new_eff_pos_q_a = old_eff_pos_q_a + size_q`
   - `new_eff_pos_q_b = old_eff_pos_q_b - size_q`
8. apply immediate execution-slippage alignment PnL before fees:
   - `trade_pnl_a = floor_div_signed_conservative(size_q * ((oracle_price as i256) - (exec_price as i256)), POS_SCALE)`
   - `trade_pnl_b = -trade_pnl_a`
   - `set_pnl(a, PNL_a + trade_pnl_a)`
   - `set_pnl(b, PNL_b + trade_pnl_b)`
9. apply the resulting effective positions using `attach_effective_position(a, new_eff_pos_q_a)` and `attach_effective_position(b, new_eff_pos_q_b)`
10. update `OI_eff_long` / `OI_eff_short` atomically from before/after effective positions and require each side to remain `≤ MAX_OI_SIDE_Q`
11. charge explicit trading fees per §8.1 using `size_q` and `exec_price`
12. settle post-trade losses from principal for both accounts via §7.1
13. for any account whose `AvailGross_i` increased relative to its post-touch pre-trade state, invoke the restart-on-new-profit rule (§6.5) using the true post-touch pre-trade `old_warmable_i`
14. if funding-rate inputs changed, recompute `r_last` for the next interval only
15. enforce post-trade margin:
   - if the resulting effective position is nonzero, always require maintenance
   - if risk-increasing, also require initial margin
   - if the resulting effective position is zero, require `PNL_i ≥ 0` after the post-trade loss settlement of step 12; an organic close MUST NOT leave uncovered negative obligations
16. perform fee-debt sweep (§7.5) if capital was created during settlement / conversion
17. `schedule_end_of_instruction_resets(ctx)`
18. `finalize_end_of_instruction_resets(ctx)`
19. assert `OI_eff_long == OI_eff_short`

### 10.5 `liquidate(i, oracle_price, now_slot, ...)`
Procedure:
1. initialize fresh instruction context `ctx`
2. `touch_account_full(i, oracle_price, now_slot)`
3. require liquidation eligibility (§9.3)
4. execute partial or full liquidation per §9.4–§9.5, passing `ctx` to any `enqueue_adl` call
5. if any remaining nonzero position exists after liquidation, it MUST already have been reattached via `attach_effective_position`
6. `schedule_end_of_instruction_resets(ctx)`
7. `finalize_end_of_instruction_resets(ctx)`
8. assert `OI_eff_long == OI_eff_short`

### 10.6 `keeper_crank(...)`
A keeper crank is a top-level external instruction and MUST use the same deferred reset lifecycle as other top-level instructions.

Procedure:
1. initialize fresh instruction context `ctx`
2. a keeper MAY:
   - call `accrue_market_to`
   - touch a bounded window of accounts
   - liquidate unhealthy accounts, passing `ctx` through any `enqueue_adl` call
   - advance warmup conversion
   - sweep fee debt
   - prioritize accounts on a `DrainOnly` or `ResetPending` side
   - and MAY explicitly call `finalize_side_reset(side)` when its preconditions already hold, although this is not required because step 4 auto-finalizes eligible `ResetPending` sides
   - If, during this work, either `ctx.pending_reset_long` or `ctx.pending_reset_short` becomes true, the keeper MUST stop processing further accounts in that instruction and proceed directly to steps 3–4.
3. `schedule_end_of_instruction_resets(ctx)`
4. `finalize_end_of_instruction_resets(ctx)`

The crank MUST maintain a cursor or equivalent progress mechanism so repeated calls eventually cover active accounts supplied to it.

---

## 11. Required test properties (minimum)

An implementation MUST include tests that cover at least:
1. Conservation: `V ≥ C_tot + I` always, and `Σ PNL_eff_pos_i ≤ Residual`.
2. Oracle manipulation: inflated positive PnL cannot be withdrawn before maturity.
3. Same-epoch local settlement: settlement of one account does not depend on any canonical-order prefix.
4. Non-compounding quantity basis: repeated same-epoch touches without explicit position mutation do not compound quantity-flooring loss.
5. Dynamic dust bound: after any number of same-epoch zeroing events, explicit basis replacements, and ADL multiplier truncations before a reset, authoritative OI on a side with no stored positions is bounded by that side’s cumulative `phantom_dust_bound_side_q`.
6. Dust-clear scheduling: dust clearance and reset initiation happen only at end of top-level instructions, never mid-instruction.
7. Epoch-safe reset: accounts cannot be attached to a new epoch before `begin_full_drain_reset` runs at end of instruction.
8. Precision-exhaustion terminal drain: if `A_candidate == 0` with `OI_post > 0`, the engine force-drains both sides instead of reverting or clamping.
9. ADL representability fallback: if `K_opp + delta_K_exact` would overflow stored `i256`, quantity socialization still proceeds and the quote deficit routes through `absorb_protocol_loss`.
10. Warmup anti-retroactivity: newly generated profit cannot inherit old dormant maturity headroom.
11. Pure conversion slope preservation: frequent cranks do not create exponential-decay maturity.
12. Trade slippage alignment: opening or flipping at `exec_price ≠ oracle_price` realizes immediate zero-sum PnL against the oracle.
13. Unit consistency: margin and notional use quote-token atomic units consistently.
14. `set_pnl` underflow safety: negative PnL updates do not underflow `PNL_pos_tot`.
15. `PNL_i == i256::MIN` forbidden: every negation path is safe.
16. Organic close bankruptcy guard: a flat trade cannot bypass ADL by leaving negative `PNL_i` behind.
17. Liquidation fee shortfall handling: unpaid liquidation fees are deducted from `PNL_i` before `D` is computed.
18. Trading fee shortfall handling: a profitable user with `C_i == 0` but positive `PNL_i` can still reduce or close because trading-fee shortfall is deducted from `PNL_i` instead of reverting.
19. Funding anti-retroactivity: changing rate inputs near the end of an interval does not retroactively reprice earlier slots.
20. Funding no-mint: payer-driven funding rounding MUST NOT mint positive aggregate claims even when `A_long != A_short`.
21. Flat-account negative remainder: a flat account with negative `PNL_i` after principal exhaustion resolves through `absorb_protocol_loss` only in the allowed flat-account paths.
22. Reset finalization: after reconciling stale accounts, the side can leave `ResetPending` and accept fresh OI again.
23. Immediate fee seniority after restart conversion: if the restart-on-new-profit rule converts matured entitlement into `C_i` while fee debt is outstanding, the fee-debt sweep occurs immediately before later loss-settlement or margin logic can consume that new capital.
24. Post-trade loss settlement: a solvent trader who closes to flat and can pay losses from principal is not rejected due to an unperformed implicit settlement step.
25. Keeper quiescence after pending reset: if a keeper-triggered `enqueue_adl` or precision-exhaustion terminal drain schedules any reset, the same keeper instruction performs no further live-OI-dependent account processing before end-of-instruction reset handling.
26. Keeper reset lifecycle: `keeper_crank` can touch the last dusty or stale account and still trigger the required end-of-instruction reset scheduling/finalization.
27. Clean-empty market lifecycle: a fully drained and fully reconciled market can return to `Normal` and admit fresh OI without getting stuck in a reset loop.
28. Non-representable `delta_K_abs` fallback: if `delta_K_abs` is not representable as `i256`, quote deficit routes through `absorb_protocol_loss` while quantity socialization still proceeds.
29. Explicit-mutation dust accounting: if a trade or liquidation discards a same-epoch basis whose exact effective quantity had a nonzero fractional remainder, `phantom_dust_bound_side_q` increases by exactly `1` q-unit.
30. Global A-truncation dust accounting: if `enqueue_adl` computes `A_candidate = floor(A_old * OI_post / OI)` with nonzero remainder, the engine increments `phantom_dust_bound_opp_q` by at least the conservative bound from §5.6, and that bound is sufficient to cover the additional phantom OI introduced by the global multiplier truncation.
31. Empty-opposing-side deficit fallback: if `stored_pos_count_opp == 0`, real quote deficits route through `absorb_protocol_loss(D)` and are not written into `K_opp`.
32. Unilateral-empty orphan resolution: if one side has `stored_pos_count_side == 0`, its `OI_eff_side` is within that side’s phantom-dust bound, and `OI_eff_long == OI_eff_short`, then `schedule_end_of_instruction_resets(ctx)` schedules reset on **both** sides even if the opposite side still has stored positions.
33. Unilateral-empty corruption guard: if one side has `stored_pos_count_side == 0` but `OI_eff_long != OI_eff_short`, unilateral dust clearance fails conservatively.
34. Automatic reset finalization: the top-level instruction that reconciles the last stale account can leave the side in `Normal` at end-of-instruction without requiring a separate keeper-only finalize call.
35. Trade-path reopenability: if a side is already `ResetPending` but also already eligible for `finalize_side_reset`, an `execute_trade` instruction can auto-finalize that side before OI-increase gating and admit fresh OI in the same instruction.

---

## 12. Reference pseudocode (non-normative)

### 12.1 Compute haircut
```text
senior_sum = checked_add_u128(C_tot, I)
Residual = max(0, V - senior_sum)
if PNL_pos_tot == 0:
    h_num = 1
    h_den = 1
else:
    h_num = min(Residual as u256, PNL_pos_tot)
    h_den = PNL_pos_tot
```

### 12.2 Same-epoch settlement
```text
if basis_pos_q_i != 0:
    s = side(basis_pos_q_i)
    if epoch_snap_i == epoch_s:
        q_eff_new = floor(abs(basis_pos_q_i) * A_s / a_basis_i)
        num = abs(basis_pos_q_i) * (K_s - k_snap_i)
        den = a_basis_i * POS_SCALE
        pnl_delta = floor_div_signed_conservative(num, den)
        set_pnl(i, PNL_i + pnl_delta)
        if q_eff_new == 0:
            inc_phantom_dust_bound(s)
            set_position_basis_q(i, 0)
            reset_snaps_to_zero(i, epoch_s)
        else:
            k_snap_i = K_s
            epoch_snap_i = epoch_s
```

### 12.3 Epoch mismatch
```text
if basis_pos_q_i != 0 and epoch_snap_i != epoch_s:
    assert mode_s == ResetPending
    assert epoch_snap_i + 1 == epoch_s
    num = abs(basis_pos_q_i) * (K_epoch_start_s - k_snap_i)
    den = a_basis_i * POS_SCALE
    pnl_delta = floor_div_signed_conservative(num, den)
    set_pnl(i, PNL_i + pnl_delta)
    set_position_basis_q(i, 0)
    dec_stale_account_count_checked(s)
    reset_snaps_to_zero(i, epoch_s)
```

### 12.4 ADL with representability fallback
```text
enqueue_adl(ctx, liq_side, q_close_q, D):
    opp = opposite(liq_side)
    if q_close_q > 0:
        OI_eff_liq_side -= q_close_q
    OI = OI_eff_opp

    if OI == 0:
        if D > 0:
            absorb_protocol_loss(D)
        return

    if stored_pos_count_opp == 0:
        assert q_close_q <= OI
        OI_post = OI - q_close_q
        if D > 0:
            absorb_protocol_loss(D)
        OI_eff_opp = OI_post
        if OI_post == 0:
            ctx.pending_reset_opp = true
        return

    assert q_close_q <= OI
    A_old = A_opp
    OI_post = OI - q_close_q

    if D > 0:
        delta_K_abs = ceil(D * A_old * POS_SCALE / OI)
        if representable_i256_magnitude(delta_K_abs):
            delta_K_exact = -(delta_K_abs as i256)
            if fits_i256(K_opp + delta_K_exact):
                K_opp = K_opp + delta_K_exact
            else:
                absorb_protocol_loss(D)
        else:
            absorb_protocol_loss(D)

    if OI_post == 0:
        OI_eff_opp = 0
        ctx.pending_reset_opp = true
        return

    A_prod_exact = A_old * OI_post
    A_candidate = floor(A_prod_exact / OI)
    A_trunc_rem = A_prod_exact mod OI

    if A_candidate > 0:
        A_opp = A_candidate
        OI_eff_opp = OI_post
        if A_trunc_rem != 0:
            N_opp = stored_pos_count_opp
            global_a_dust_bound = N_opp + ceil((OI + N_opp) / A_old)
            phantom_dust_bound_opp_q += global_a_dust_bound
        if A_opp < MIN_A_SIDE:
            mode_opp = DrainOnly
        return

    OI_eff_opp = 0
    OI_eff_liq_side = 0
    ctx.pending_reset_opp = true
    ctx.pending_reset_liq_side = true
```

### 12.5 Finalize-ready preflight for OI-increasing instructions
```text
maybe_finalize_ready_reset_sides_before_oi_increase():
    if mode_long == ResetPending and OI_eff_long == 0 and stale_account_count_long == 0 and stored_pos_count_long == 0:
        finalize_side_reset(long)
    if mode_short == ResetPending and OI_eff_short == 0 and stale_account_count_short == 0 and stored_pos_count_short == 0:
        finalize_side_reset(short)
```

### 12.6 End-of-instruction dust clearance
```text
schedule_end_of_instruction_resets(ctx):
    if stored_pos_count_long == 0 and stored_pos_count_short == 0:
        clear_bound_q = phantom_dust_bound_long_q + phantom_dust_bound_short_q
        has_residual_clear_work = (OI_eff_long > 0) or (OI_eff_short > 0) or (phantom_dust_bound_long_q > 0) or (phantom_dust_bound_short_q > 0)
        if has_residual_clear_work:
            assert OI_eff_long == OI_eff_short
            if OI_eff_long <= clear_bound_q and OI_eff_short <= clear_bound_q:
                OI_eff_long = 0
                OI_eff_short = 0
                ctx.pending_reset_long = true
                ctx.pending_reset_short = true
            else:
                fail_conservatively()
    else if stored_pos_count_long == 0:
        has_residual_clear_work = (OI_eff_long > 0) or (OI_eff_short > 0) or (phantom_dust_bound_long_q > 0)
        if has_residual_clear_work:
            assert OI_eff_long == OI_eff_short
            if OI_eff_long <= phantom_dust_bound_long_q:
                OI_eff_long = 0
                OI_eff_short = 0
                ctx.pending_reset_long = true
                ctx.pending_reset_short = true
            else:
                fail_conservatively()
    else if stored_pos_count_short == 0:
        has_residual_clear_work = (OI_eff_long > 0) or (OI_eff_short > 0) or (phantom_dust_bound_short_q > 0)
        if has_residual_clear_work:
            assert OI_eff_long == OI_eff_short
            if OI_eff_short <= phantom_dust_bound_short_q:
                OI_eff_long = 0
                OI_eff_short = 0
                ctx.pending_reset_long = true
                ctx.pending_reset_short = true
            else:
                fail_conservatively()

    if mode_long == DrainOnly and OI_eff_long == 0:
        ctx.pending_reset_long = true
    if mode_short == DrainOnly and OI_eff_short == 0:
        ctx.pending_reset_short = true

finalize_end_of_instruction_resets(ctx):
    if ctx.pending_reset_long and mode_long != ResetPending:
        begin_full_drain_reset(long)
    if ctx.pending_reset_short and mode_short != ResetPending:
        begin_full_drain_reset(short)
    if mode_long == ResetPending and OI_eff_long == 0 and stale_account_count_long == 0 and stored_pos_count_long == 0:
        finalize_side_reset(long)
    if mode_short == ResetPending and OI_eff_short == 0 and stale_account_count_short == 0 and stored_pos_count_short == 0:
        finalize_side_reset(short)
```

---

## 13. Compatibility notes
- The spec is compatible with LP accounts and user accounts; both share the same protected-principal and junior-profit mechanics.
- The only mandatory O(1) global aggregates for solvency are `C_tot` and `PNL_pos_tot`; the A/K side indices add O(1) state for lazy settlement.
- The spec deliberately rejects hidden residual matching. Bankruptcy socialization occurs through explicit A/K state only.
- Same-epoch quantity settlement is local and non-compounding. The design does **not** require a canonical-order carry allocator.
- Rare side-precision stress is handled by `DrainOnly`, dynamically bounded dust clearance, unilateral/bilateral orphan resolution, and precision-exhaustion terminal drain rather than assertion failure or permanent market deadlock.
- Any upgrade path from a version that did not maintain `basis_pos_q_i`, `a_basis_i`, `stored_pos_count_*`, `stale_account_count_*`, or `phantom_dust_bound_*_q` consistently MUST complete migration before OI-increasing operations are re-enabled.

