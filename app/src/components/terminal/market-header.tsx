"use client";

import { useGsapCounter } from "@/hooks/use-gsap-counter";
import type { MockMarket } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface MarketHeaderProps {
  market: MockMarket;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export function MarketHeader({ market }: MarketHeaderProps) {
  const priceRef = useGsapCounter(market.price, {
    decimals: market.price < 1 ? 4 : 1,
    duration: 0.4,
  });

  const isPositive = market.change24h >= 0;

  return (
    <div className="glass-1 rounded-xl px-4 py-3 flex items-center gap-6 flex-wrap">
      {/* Market name + agent */}
      <div className="flex items-center gap-3 min-w-0">
        <h2 className="font-heading text-base font-semibold text-foreground truncate">
          {market.name}
        </h2>
        <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet/10 text-violet border border-violet/20 text-[10px] font-mono">
          &#9679; {market.agentName}
        </span>
        <span className="shrink-0 text-[10px] text-muted-foreground font-mono">
          {market.oracleCount} oracles
        </span>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-2">
        <span
          ref={priceRef}
          className="font-mono text-xl font-bold text-foreground"
        />
        <span
          className={cn(
            "font-mono text-sm font-medium",
            isPositive ? "text-emerald" : "text-coral"
          )}
        >
          {isPositive ? "+" : ""}
          {market.change24h.toFixed(1)}%
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground ml-auto">
        <div>
          <span className="mr-1">OI</span>
          <span className="font-mono text-foreground">
            {formatCompact(market.oi)}
          </span>
        </div>
        <div>
          <span className="mr-1">Vol</span>
          <span className="font-mono text-foreground">
            {formatCompact(market.volume24h)}
          </span>
        </div>
        <div>
          <span className="mr-1">Mindshare</span>
          <span className="font-mono text-foreground">{market.mindshare}%</span>
        </div>
      </div>
    </div>
  );
}
