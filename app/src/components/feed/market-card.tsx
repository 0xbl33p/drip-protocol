"use client";

import { GlassCard } from "@/components/glass";
import { Sparkline } from "./sparkline";
import { cn } from "@/lib/utils";
import type { MockMarket } from "@/lib/mock-data";
import Link from "next/link";

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function VelocityIcon({ velocity }: { velocity: MockMarket["velocity"] }) {
  if (velocity === "accelerating")
    return <span className="text-emerald text-xs font-mono">&#9650;&#9650;</span>;
  if (velocity === "cooling")
    return <span className="text-coral text-xs font-mono">&#9660;</span>;
  return <span className="text-muted-foreground text-xs font-mono">&#8212;</span>;
}

function StatusBadge({ status }: { status: MockMarket["status"] }) {
  if (status === "new")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-cyan/15 text-cyan border border-cyan/25">
        NEW
      </span>
    );
  if (status === "draining")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-coral/15 text-coral border border-coral/25 animate-pulse">
        DRAIN
      </span>
    );
  return null;
}

export function MarketCard({ market }: { market: MockMarket }) {
  const isPositive = market.change24h >= 0;

  return (
    <Link href={`/terminal/${market.id}`}>
      <GlassCard
        variant={market.status === "draining" ? "default" : market.change24h > 20 ? "gold" : "default"}
        className="flex flex-col gap-4 h-full"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-heading text-sm font-semibold text-foreground truncate">
                {market.name}
              </h3>
              <StatusBadge status={market.status} />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = `/agent/${market.agentId}`;
                }}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet/10 text-violet border border-violet/20 text-[10px] font-mono hover:bg-violet/20 cursor-pointer transition-colors"
              >
                &#9679; {market.agentName}
              </span>
              <span>{market.createdAgo} ago</span>
              <span>&middot;</span>
              <span>{market.oracleCount} oracles</span>
            </div>
          </div>
        </div>

        {/* Price row */}
        <div className="flex items-end justify-between">
          <div>
            <div className="font-mono text-xl font-semibold text-foreground">
              {market.price.toLocaleString(undefined, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
            </div>
            <div
              className={cn(
                "font-mono text-sm font-medium",
                isPositive ? "text-emerald" : "text-coral"
              )}
            >
              {isPositive ? "+" : ""}
              {market.change24h.toFixed(1)}%
            </div>
          </div>
          <Sparkline data={market.sparkline} positive={isPositive} />
        </div>

        {/* Metrics */}
        <div className="space-y-2">
          {/* Mindshare bar */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Mindshare</span>
            <span className="font-mono text-foreground">{market.mindshare}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan/60 to-cyan"
              style={{ width: `${market.mindshare}%` }}
            />
          </div>

          {/* Sentiment + Velocity row */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Sentiment</span>
              <span className="font-mono text-foreground">{market.sentiment}%</span>
            </div>
            <div className="flex items-center gap-1">
              <VelocityIcon velocity={market.velocity} />
              <span className="text-muted-foreground capitalize text-[11px]">
                {market.velocity}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>OI {formatCompact(market.oi)}</span>
            <span>Vol {formatCompact(market.volume24h)}</span>
          </div>
          <div className="flex gap-1.5">
            <button className="px-3 py-1 text-xs font-medium rounded-lg bg-emerald/10 text-emerald border border-emerald/20 hover:bg-emerald/20 transition-colors">
              Long
            </button>
            <button className="px-3 py-1 text-xs font-medium rounded-lg bg-coral/10 text-coral border border-coral/20 hover:bg-coral/20 transition-colors">
              Short
            </button>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
