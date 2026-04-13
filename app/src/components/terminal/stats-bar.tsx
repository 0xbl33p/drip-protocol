"use client";

import { useGsapCounter } from "@/hooks/use-gsap-counter";
import type { MockMarket } from "@/lib/mock-data";

interface StatsBarProps {
  market: MockMarket;
}

function StatCell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-1 rounded-lg px-3 py-2 min-w-0">
      <div className="text-[10px] text-muted-foreground truncate">{label}</div>
      <div className="font-mono text-xs text-foreground font-medium truncate">
        {children}
      </div>
    </div>
  );
}

export function StatsBar({ market }: StatsBarProps) {
  const priceRef = useGsapCounter(market.price, {
    decimals: market.price < 1 ? 4 : 2,
    duration: 0.3,
  });

  const volumeRef = useGsapCounter(market.volume24h / 1_000_000, {
    decimals: 2,
    duration: 0.5,
    prefix: "$",
    suffix: "M",
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      <StatCell label="Mark Price">
        <span ref={priceRef} />
      </StatCell>
      <StatCell label="24h Volume">
        <span ref={volumeRef} />
      </StatCell>
      <StatCell label="Open Interest">
        ${(market.oi / 1_000_000).toFixed(2)}M
      </StatCell>
      <StatCell label="Funding Rate">
        <span className="text-emerald">+0.005%</span>
      </StatCell>
      <StatCell label="Sentiment">
        {market.sentiment}%
      </StatCell>
      <StatCell label="Velocity">
        <span className={
          market.velocity === "accelerating" ? "text-emerald" :
          market.velocity === "cooling" ? "text-coral" : "text-muted-foreground"
        }>
          {market.velocity}
        </span>
      </StatCell>
    </div>
  );
}
