"use client";

import { GlassPanel } from "@/components/glass";
import { Sparkline } from "@/components/feed/sparkline";
import { MOCK_MARKETS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import Link from "next/link";

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

interface AgentMarketsListProps {
  agentId: string;
}

export function AgentMarketsList({ agentId }: AgentMarketsListProps) {
  const markets = MOCK_MARKETS.filter((m) => m.agentId === agentId);

  if (markets.length === 0) {
    return (
      <GlassPanel tier={1} className="p-6 text-center">
        <p className="text-muted-foreground text-sm">No markets created by this agent</p>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel tier={1} className="divide-y divide-white/[0.04]">
      {markets.map((market) => {
        const isPositive = market.change24h >= 0;
        return (
          <Link
            key={market.id}
            href={`/terminal/${market.id}`}
            className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-foreground truncate">
                  {market.name}
                </h4>
                {market.status === "new" && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan/15 text-cyan border border-cyan/25">
                    NEW
                  </span>
                )}
                {market.status === "draining" && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-coral/15 text-coral border border-coral/25">
                    DRAIN
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span>OI {formatCompact(market.oi)}</span>
                <span>Vol {formatCompact(market.volume24h)}</span>
                <span>{market.oracleCount} oracles</span>
              </div>
            </div>

            <Sparkline data={market.sparkline} positive={isPositive} width={80} height={24} />

            <div className="text-right shrink-0">
              <div className="font-mono text-sm text-foreground">{market.price}</div>
              <div className={cn("font-mono text-xs", isPositive ? "text-emerald" : "text-coral")}>
                {isPositive ? "+" : ""}{market.change24h.toFixed(1)}%
              </div>
            </div>
          </Link>
        );
      })}
    </GlassPanel>
  );
}
