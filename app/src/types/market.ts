import type { Account, RiskEngineState, Side, SideMode } from "./engine";
import type { Agent } from "./agent";

/** Market metadata — combines on-chain engine state with off-chain metadata */
export interface Market {
  /** Unique market identifier */
  id: string;

  /** Display name (e.g., "AI Narrative Index") */
  name: string;

  /** Market category */
  category: "narrative" | "social" | "influence" | "meta" | "price";

  /** Current oracle price (display-friendly number) */
  price: number;

  /** 24h price change percentage */
  change24h: number;

  /** Open interest in USDC */
  oi: number;

  /** 24h trading volume in USDC */
  volume24h: number;

  /** Number of oracle providers */
  oracleCount: number;

  /** Agent that created this market */
  agentName: string;
  agentId: string;

  /** Human-readable time since creation */
  createdAgo: string;

  /** Social metrics (0-100 scale) */
  mindshare: number;
  sentiment: number;
  velocity: "accelerating" | "stable" | "cooling";

  /** Market lifecycle status */
  status: "active" | "draining" | "new" | "resolved";

  /** Mini chart data */
  sparkline: number[];

  // ---- On-chain references (populated when connected to RPC) ----

  /** Solana pubkey of the market's RiskEngine account */
  marketPubkey?: string;

  /** Current funding rate (display-friendly) */
  fundingRate?: number;

  /** Risk parameters for this market */
  imBps?: number;
  mmBps?: number;
  tradingFeeBps?: number;

  /** Side modes */
  sideModeLong?: SideMode;
  sideModeShort?: SideMode;
}

/** A user's position in a specific market (derived from Account + engine state) */
export interface Position {
  marketId: string;
  marketName: string;
  side: Side;

  /** Effective position size (after A/K) */
  size: number;

  /** Position size in quote (USDC) */
  notional: number;

  /** Entry price (approximate, from basis) */
  entryPrice: number;

  /** Current oracle/mark price */
  markPrice: number;

  /** Unrealized PnL in USDC */
  unrealizedPnl: number;

  /** Realized PnL in USDC */
  realizedPnl: number;

  /** Effective leverage */
  leverage: number;

  /** Estimated liquidation price */
  liquidationPrice: number;

  /** Margin used for this position */
  marginUsed: number;

  /** Warmup cohort summaries */
  warmupCohorts: WarmupCohortSummary[];

  /** Total reserved (warming up) PnL */
  reservedPnl: number;

  /** Matured (withdrawable) PnL after haircut */
  maturedPnl: number;
}

/** Summary of a single warmup cohort for display */
export interface WarmupCohortSummary {
  /** Amount still locked */
  remaining: number;
  /** Original locked amount */
  anchor: number;
  /** Progress 0-1 */
  progress: number;
  /** Estimated slots until fully matured */
  slotsRemaining: number;
}

/** Parameters for submitting a trade */
export interface TradeParams {
  marketId: string;
  side: Side;
  sizeUsdc: number;
  leverage: number;
  takeProfitPrice?: number;
  stopLossPrice?: number;
}

/** Computed trade preview shown before execution */
export interface OrderPreview {
  side: Side;
  sizeUsdc: number;
  leverage: number;
  notionalSize: number;
  entryPrice: number;
  fee: number;
  estimatedLiqPrice: number;
  marginRequired: number;
  /** Effective position size in base units */
  positionSizeQ: bigint;
}
