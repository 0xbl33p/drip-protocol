"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { MOCK_MARKETS } from "@/lib/mock-data";
import { useMarketStore } from "@/stores";
import { Chart } from "@/components/terminal/chart";
import { MarketHeader } from "@/components/terminal/market-header";
import { OrderPanel } from "@/components/terminal/order-panel";
import { TradeTape } from "@/components/terminal/trade-tape";
import { PositionsPanel } from "@/components/terminal/positions-panel";
import { StatsBar } from "@/components/terminal/stats-bar";

export default function TerminalPage() {
  const params = useParams();
  const marketId = params.marketId as string;
  const selectMarket = useMarketStore((s) => s.selectMarket);
  const market = MOCK_MARKETS.find((m) => m.id === marketId);

  useEffect(() => {
    selectMarket(marketId);
    return () => selectMarket(null);
  }, [marketId, selectMarket]);

  if (!market) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Market not found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-2 p-2 lg:p-3 max-h-[calc(100vh-64px)] overflow-hidden">
      {/* Market header bar */}
      <MarketHeader market={market} />

      {/* Main 3-column layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[280px_1fr_320px] gap-2 min-h-0">
        {/* Left: Trade tape (hidden on mobile/tablet, shown on XL) */}
        <div className="hidden xl:flex flex-col gap-2 min-h-0">
          <TradeTape marketId={marketId} />
        </div>

        {/* Center: Chart + stats + positions */}
        <div className="flex flex-col gap-2 min-h-0">
          <Chart marketId={marketId} />
          <StatsBar market={market} />
          <div className="hidden lg:block">
            <PositionsPanel />
          </div>
        </div>

        {/* Right: Order panel */}
        <div className="flex flex-col gap-2 min-h-0">
          <OrderPanel marketPrice={market.price} marketName={market.name} />
          {/* Trade tape on large screens (non-XL) where left column is hidden */}
          <div className="hidden lg:flex xl:hidden flex-col min-h-0 flex-1">
            <TradeTape marketId={marketId} />
          </div>
        </div>
      </div>

      {/* Mobile: positions below */}
      <div className="lg:hidden">
        <PositionsPanel />
      </div>
    </div>
  );
}
