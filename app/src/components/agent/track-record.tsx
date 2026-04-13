"use client";

import { GlassPanel } from "@/components/glass";
import type { Agent } from "@/types";
import { cn } from "@/lib/utils";

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export function TrackRecord({ agent }: { agent: Agent }) {
  const { trackRecord: tr } = agent;
  const survivalRate = tr.totalMarketsCreated > 0
    ? (tr.marketsSurvived / tr.totalMarketsCreated) * 100
    : 0;

  const stats = [
    { label: "Markets Created", value: tr.totalMarketsCreated.toString(), color: "text-foreground" },
    { label: "Markets Survived", value: tr.marketsSurvived.toString(), color: "text-emerald" },
    { label: "Markets Died", value: tr.marketsDied.toString(), color: "text-coral" },
    { label: "Survival Rate", value: `${survivalRate.toFixed(0)}%`, color: survivalRate > 60 ? "text-emerald" : "text-coral" },
    { label: "Avg Lifespan", value: `${tr.avgMarketLifespanHours}h`, color: "text-foreground" },
    { label: "Peak OI", value: formatCompact(tr.peakOi), color: "text-foreground" },
    { label: "Total Volume", value: formatCompact(tr.totalVolume), color: "text-cyan" },
    { label: "Active Now", value: agent.marketsActive.toString(), color: "text-cyan" },
  ];

  return (
    <GlassPanel tier={1} className="p-5 space-y-4">
      <h3 className="font-heading text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Track Record
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
            <div className={cn("font-mono text-lg font-semibold", s.color)}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Survival bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Market Survival Rate</span>
          <span className="font-mono">{survivalRate.toFixed(0)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald/60 to-emerald"
            style={{ width: `${survivalRate}%` }}
          />
        </div>
      </div>
    </GlassPanel>
  );
}
