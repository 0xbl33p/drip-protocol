import { create } from "zustand";
import type { Market } from "@/types";
import { MOCK_MARKETS, type MockMarket } from "@/lib/mock-data";

/** Convert MockMarket to the unified Market type */
function toMarket(m: MockMarket): Market {
  return {
    ...m,
    status: m.status as Market["status"],
  };
}

interface MarketState {
  /** All known markets, keyed by ID */
  markets: Map<string, Market>;

  /** Currently selected market ID (for terminal) */
  selectedMarketId: string | null;

  /** Latest oracle prices per market */
  oraclePrices: Map<string, number>;

  /** Latest funding rates per market */
  fundingRates: Map<string, number>;

  /** Whether we're using mock data or live RPC */
  isMockMode: boolean;
}

interface MarketActions {
  setMarkets: (markets: Market[]) => void;
  selectMarket: (id: string | null) => void;
  updateOraclePrice: (marketId: string, price: number) => void;
  updateFundingRate: (marketId: string, rate: number) => void;
  getMarket: (id: string) => Market | undefined;
  getMarketsArray: () => Market[];
}

export const useMarketStore = create<MarketState & MarketActions>(
  (set, get) => ({
    // Initial state: populated with mock data
    markets: new Map(MOCK_MARKETS.map((m) => [m.id, toMarket(m)])),
    selectedMarketId: null,
    oraclePrices: new Map(MOCK_MARKETS.map((m) => [m.id, m.price])),
    fundingRates: new Map(),
    isMockMode: true,

    setMarkets: (markets) =>
      set({
        markets: new Map(markets.map((m) => [m.id, m])),
        isMockMode: false,
      }),

    selectMarket: (id) => set({ selectedMarketId: id }),

    updateOraclePrice: (marketId, price) =>
      set((state) => {
        const newPrices = new Map(state.oraclePrices);
        newPrices.set(marketId, price);
        return { oraclePrices: newPrices };
      }),

    updateFundingRate: (marketId, rate) =>
      set((state) => {
        const newRates = new Map(state.fundingRates);
        newRates.set(marketId, rate);
        return { fundingRates: newRates };
      }),

    getMarket: (id) => get().markets.get(id),

    getMarketsArray: () => Array.from(get().markets.values()),
  })
);
