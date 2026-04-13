"use client";

import { GlassCard } from "@/components/glass";
import type { Agent } from "@/types";
import Link from "next/link";

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export function AgentCard({ agent }: { agent: Agent }) {
  const survivalRate = agent.trackRecord.totalMarketsCreated > 0
    ? Math.round((agent.trackRecord.marketsSurvived / agent.trackRecord.totalMarketsCreated) * 100)
    : 0;

  return (
    <Link href={`/agent/${agent.id}`}>
      <GlassCard variant="violet" className="flex flex-col gap-3 h-full">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-violet/20 border border-violet/30 flex items-center justify-center shrink-0">
            <span className="text-violet text-sm font-bold">
              {agent.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="font-heading text-sm font-semibold text-foreground truncate">
              {agent.name}
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono truncate">
              {agent.wallet}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {agent.description}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.04]">
          <div>
            <div className="text-[10px] text-muted-foreground">Markets</div>
            <div className="font-mono text-sm text-foreground">
              {agent.marketsActive}
              <span className="text-muted-foreground text-[10px]">/{agent.marketsCreated}</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">Total OI</div>
            <div className="font-mono text-sm text-foreground">
              {formatCompact(agent.totalOi)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">Survival</div>
            <div className="font-mono text-sm text-emerald">
              {survivalRate}%
            </div>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
