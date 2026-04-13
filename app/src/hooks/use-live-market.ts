"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMarket, fetchMarkets, fetchMarketStats, IS_MOCK_MODE } from "@/lib/api/markets";
import type { Market } from "@/types";
import { useMarketStore } from "@/stores";
import { useEffect } from "react";

/**
 * Hook that fetches and caches a single market's data.
 * In mock mode, returns from mock data.
 * In live mode, polls the API / on-chain state.
 */
export function useLiveMarket(marketId: string) {
  const query = useQuery({
    queryKey: ["market", marketId],
    queryFn: () => fetchMarket(marketId),
    refetchInterval: IS_MOCK_MODE ? false : 5_000,
    staleTime: IS_MOCK_MODE ? Infinity : 3_000,
  });

  // Sync to market store
  const updateOraclePrice = useMarketStore((s) => s.updateOraclePrice);
  useEffect(() => {
    if (query.data) {
      updateOraclePrice(marketId, query.data.price);
    }
  }, [query.data, marketId, updateOraclePrice]);

  return query;
}

/**
 * Hook that fetches all markets.
 */
export function useLiveMarkets() {
  return useQuery({
    queryKey: ["markets"],
    queryFn: fetchMarkets,
    refetchInterval: IS_MOCK_MODE ? false : 10_000,
    staleTime: IS_MOCK_MODE ? Infinity : 5_000,
  });
}

/**
 * Hook for aggregate market stats (feed page header).
 */
export function useLiveMarketStats() {
  return useQuery({
    queryKey: ["market-stats"],
    queryFn: fetchMarketStats,
    refetchInterval: IS_MOCK_MODE ? false : 15_000,
    staleTime: IS_MOCK_MODE ? Infinity : 10_000,
  });
}
