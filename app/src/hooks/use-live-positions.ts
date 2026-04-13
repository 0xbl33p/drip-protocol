"use client";

import { useMemo } from "react";
import { useAccountStore } from "@/stores";
import type { Position, WarmupCohortSummary } from "@/types";
import { Side } from "@/types";

/**
 * Hook that derives Position[] from the connected user's account state.
 *
 * In mock mode (no connected wallet), returns mock positions for demo purposes.
 * In live mode, computes from on-chain Account + RiskEngineState.
 */
export function useLivePositions(): {
  positions: Position[];
  isLoading: boolean;
} {
  const account = useAccountStore((s) => s.account);
  const positions = useAccountStore((s) => s.positions);
  const isLoading = useAccountStore((s) => s.isLoading);

  // For now, return stored positions (populated by wallet hooks when connected)
  // When no wallet is connected, returns empty array
  return { positions, isLoading };
}

/**
 * Mock positions for demo/development.
 * Used when the user clicks "Demo Mode" or for screenshots.
 */
export function useMockPositions(): Position[] {
  return useMemo(
    () => [
      {
        marketId: "ai-narrative",
        marketName: "AI Narrative Index",
        side: Side.Long,
        size: 5000,
        notional: 25000,
        entryPrice: 138.4,
        markPrice: 142.3,
        unrealizedPnl: 140.8,
        realizedPnl: 0,
        leverage: 5,
        liquidationPrice: 114.7,
        marginUsed: 5000,
        warmupCohorts: [
          { remaining: 89.2, anchor: 140.8, progress: 0.37, slotsRemaining: 630 },
        ],
        reservedPnl: 89.2,
        maturedPnl: 51.6,
      },
      {
        marketId: "sol-eth-mindshare",
        marketName: "SOL vs ETH Mindshare",
        side: Side.Short,
        size: 2000,
        notional: 6000,
        entryPrice: 0.651,
        markPrice: 0.634,
        unrealizedPnl: 80.3,
        realizedPnl: 12.5,
        leverage: 3,
        liquidationPrice: 0.847,
        marginUsed: 2000,
        warmupCohorts: [
          { remaining: 45.1, anchor: 80.3, progress: 0.56, slotsRemaining: 440 },
          { remaining: 12.5, anchor: 12.5, progress: 1.0, slotsRemaining: 0 },
        ],
        reservedPnl: 45.1,
        maturedPnl: 47.7,
      },
    ],
    []
  );
}
