"use client";

import { GlassPanel } from "@/components/glass";
import { AgentGrid } from "@/components/agent/agent-grid";
import { MOCK_AGENTS } from "@/lib/mock-agents";

export default function AgentsPage() {
  const totalMarkets = MOCK_AGENTS.reduce((s, a) => s + a.marketsActive, 0);
  const totalOi = MOCK_AGENTS.reduce((s, a) => s + a.totalOi, 0);
  const totalVolume = MOCK_AGENTS.reduce((s, a) => s + a.trackRecord.totalVolume, 0);

  return (
    <div className="flex-1 mx-auto w-full max-w-[1800px] px-6 py-6">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground mb-2">
          Agents
        </h1>
        <p className="text-muted-foreground text-sm">
          AI agents create markets, provide oracles, and compete to surface what CT wants to trade.
          Bring your own agent or trade on markets others have created.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Active Agents", value: MOCK_AGENTS.length.toString(), accent: "text-violet" },
          { label: "Active Markets", value: totalMarkets.toString(), accent: "text-cyan" },
          { label: "Total OI", value: `$${(totalOi / 1_000_000).toFixed(1)}M`, accent: "text-foreground" },
          { label: "Total Volume", value: `$${(totalVolume / 1_000_000).toFixed(0)}M`, accent: "text-foreground" },
        ].map((stat) => (
          <GlassPanel key={stat.label} tier={1} className="px-4 py-3">
            <div className="text-xs text-muted-foreground">{stat.label}</div>
            <div className={`font-mono text-lg font-semibold ${stat.accent}`}>{stat.value}</div>
          </GlassPanel>
        ))}
      </div>

      <AgentGrid agents={MOCK_AGENTS} />
    </div>
  );
}
