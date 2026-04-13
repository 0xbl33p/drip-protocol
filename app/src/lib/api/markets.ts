/**
 * Market data API client.
 *
 * In mock mode, returns data from mock-data.ts and mock-trades.ts.
 * In live mode, fetches from the indexer API / on-chain state.
 */

import { MOCK_MARKETS, type MockMarket } from "@/lib/mock-data";
import {
  MARKET_CANDLES,
  MARKET_TRADES,
  type MockCandle,
  type MockTrade,
} from "@/lib/mock-trades";
import type { Market } from "@/types";

/** Whether to use mock data (true until real API is available) */
export const IS_MOCK_MODE =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_MOCK_MODE !== "false"
    : true;

/** Convert MockMarket → Market */
function toMarket(m: MockMarket): Market {
  return {
    ...m,
    status: m.status as Market["status"],
  };
}

// ============================================================================
// Market List
// ============================================================================

export async function fetchMarkets(): Promise<Market[]> {
  if (IS_MOCK_MODE) {
    return MOCK_MARKETS.map(toMarket);
  }

  // TODO: Fetch from indexer API
  // const res = await fetch(`${API_BASE}/markets`);
  // return res.json();
  return MOCK_MARKETS.map(toMarket);
}

export async function fetchMarket(id: string): Promise<Market | null> {
  if (IS_MOCK_MODE) {
    const m = MOCK_MARKETS.find((m) => m.id === id);
    return m ? toMarket(m) : null;
  }

  // TODO: Fetch from indexer
  const m = MOCK_MARKETS.find((m) => m.id === id);
  return m ? toMarket(m) : null;
}

// ============================================================================
// Candle Data
// ============================================================================

export async function fetchMarketCandles(
  marketId: string,
  _timeframe: string = "1m"
): Promise<MockCandle[]> {
  if (IS_MOCK_MODE) {
    return MARKET_CANDLES[marketId] || [];
  }

  // TODO: Fetch from candle API / indexer
  return MARKET_CANDLES[marketId] || [];
}

// ============================================================================
// Recent Trades
// ============================================================================

export async function fetchRecentTrades(
  marketId: string,
  _limit: number = 50
): Promise<MockTrade[]> {
  if (IS_MOCK_MODE) {
    return MARKET_TRADES[marketId] || [];
  }

  // TODO: Fetch from trade API / on-chain events
  return MARKET_TRADES[marketId] || [];
}

// ============================================================================
// Market Stats (aggregated)
// ============================================================================

export interface MarketStats {
  totalMarkets: number;
  activeMarkets: number;
  totalOi: number;
  totalVolume24h: number;
  activeAgents: number;
}

export async function fetchMarketStats(): Promise<MarketStats> {
  const markets = await fetchMarkets();
  const activeMarkets = markets.filter((m) => m.status === "active" || m.status === "new");
  const uniqueAgents = new Set(markets.map((m) => m.agentId));

  return {
    totalMarkets: markets.length,
    activeMarkets: activeMarkets.length,
    totalOi: markets.reduce((sum, m) => sum + m.oi, 0),
    totalVolume24h: markets.reduce((sum, m) => sum + m.volume24h, 0),
    activeAgents: uniqueAgents.size,
  };
}
