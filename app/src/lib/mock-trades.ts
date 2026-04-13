/**
 * Seeded deterministic mock OHLC candle data and recent trades.
 * Uses the same PRNG pattern as mock-data.ts for hydration safety.
 */

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ============================================================================
// OHLC Candle Data
// ============================================================================

export interface MockCandle {
  time: number; // Unix timestamp (seconds)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Fixed base timestamp for deterministic hydration (2026-04-13 00:00 UTC) */
const FIXED_NOW = 1776124800;

/**
 * Generate 24h of 1-minute candles for a market.
 * @param basePrice Starting price
 * @param volatility Price volatility (0.01 = 1%)
 * @param trend Drift per candle (-1 to 1)
 * @param seed Deterministic seed
 */
export function generateMockCandles(
  basePrice: number,
  volatility: number,
  trend: number,
  seed: number
): MockCandle[] {
  const rand = seededRandom(seed);
  const candles: MockCandle[] = [];

  // Use fixed timestamp for SSR/client consistency
  const now = FIXED_NOW;
  const start = now - 24 * 60 * 60;
  const candleCount = 1440; // 24h * 60 min

  let price = basePrice;

  for (let i = 0; i < candleCount; i++) {
    const time = start + i * 60;
    const open = price;

    // Generate intra-candle movement
    const move1 = (rand() - 0.5) * volatility * price;
    const move2 = (rand() - 0.5) * volatility * price;
    const drift = trend * volatility * price * 0.1;

    const mid1 = open + move1;
    const mid2 = open + move2;
    const close = open + (rand() - 0.48 + trend * 0.02) * volatility * price + drift;

    const high = Math.max(open, close, mid1, mid2) + rand() * volatility * price * 0.3;
    const low = Math.min(open, close, mid1, mid2) - rand() * volatility * price * 0.3;

    const volume = (50000 + rand() * 200000) * (1 + Math.abs(close - open) / open * 50);

    candles.push({
      time,
      open: Math.max(0.01, open),
      high: Math.max(0.01, high),
      low: Math.max(0.01, low),
      close: Math.max(0.01, close),
      volume: Math.round(volume),
    });

    price = Math.max(0.01, close);
  }

  return candles;
}

// ============================================================================
// Recent Trades
// ============================================================================

export interface MockTrade {
  id: string;
  time: number; // Unix timestamp (seconds)
  side: "long" | "short";
  size: number; // USDC
  price: number;
}

/**
 * Generate recent trades for the trade tape.
 */
export function generateMockTrades(
  currentPrice: number,
  seed: number,
  count: number = 50
): MockTrade[] {
  const rand = seededRandom(seed);
  const trades: MockTrade[] = [];
  const now = FIXED_NOW;

  for (let i = 0; i < count; i++) {
    const secondsAgo = Math.floor(rand() * 3600); // within last hour
    const side = rand() > 0.5 ? "long" : "short";
    const priceDeviation = (rand() - 0.5) * currentPrice * 0.005;
    const size = Math.round((100 + rand() * 50000) * 100) / 100;

    trades.push({
      id: `trade-${seed}-${i}`,
      time: now - secondsAgo,
      side,
      size,
      price: Math.round((currentPrice + priceDeviation) * 100) / 100,
    });
  }

  // Sort by time descending (most recent first)
  trades.sort((a, b) => b.time - a.time);
  return trades;
}

// ============================================================================
// Pre-generated data for each market
// ============================================================================

export const MARKET_CANDLES: Record<string, MockCandle[]> = {
  "ai-narrative": generateMockCandles(142.3, 0.02, 0.3, 10001),
  "sol-eth-mindshare": generateMockCandles(0.634, 0.015, -0.1, 10002),
  "hsaka-alpha": generateMockCandles(87.2, 0.01, 0.05, 10003),
  "depin-revival": generateMockCandles(23.7, 0.04, 0.8, 10004),
  "restaking-meta": generateMockCandles(3.2, 0.05, -0.9, 10005),
  "meme-szn": generateMockCandles(67.8, 0.025, 0.2, 10006),
  "rwa-institutional": generateMockCandles(198.4, 0.008, 0.05, 10007),
  "cobie-alpha": generateMockCandles(112.0, 0.012, -0.05, 10008),
};

export const MARKET_TRADES: Record<string, MockTrade[]> = {
  "ai-narrative": generateMockTrades(142.3, 20001),
  "sol-eth-mindshare": generateMockTrades(0.634, 20002),
  "hsaka-alpha": generateMockTrades(87.2, 20003),
  "depin-revival": generateMockTrades(23.7, 20004),
  "restaking-meta": generateMockTrades(3.2, 20005),
  "meme-szn": generateMockTrades(67.8, 20006),
  "rwa-institutional": generateMockTrades(198.4, 20007),
  "cobie-alpha": generateMockTrades(112.0, 20008),
};
