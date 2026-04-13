"use client";

import { useState } from "react";
import { GlassPanel } from "@/components/glass";
import { GlassButton } from "@/components/glass";
import { MarketGrid } from "@/components/feed/market-grid";
import { AgentCard } from "@/components/agent/agent-card";
import { CreateMarketDialog } from "@/components/market-creation/create-market-dialog";
import { MOCK_AGENTS } from "@/lib/mock-agents";

export default function FeedPage() {
  const [showCreateMarket, setShowCreateMarket] = useState(false);

  // Top 3 agents by total OI
  const topAgents = [...MOCK_AGENTS]
    .sort((a, b) => b.totalOi - a.totalOi)
    .slice(0, 3);

  return (
    <div className="flex-1 mx-auto w-full max-w-[1800px] px-6 py-6">
      {/* Hero */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground mb-2">
            Markets
          </h1>
          <p className="text-muted-foreground text-sm">
            Agent-created perpetual futures on narratives, influence, and social metrics.
            Markets drip into existence. The best ones flow.
          </p>
        </div>
        <GlassButton
          variant="violet"
          size="md"
          onClick={() => setShowCreateMarket(true)}
          className="shrink-0"
        >
          + Create Market
        </GlassButton>
      </div>

      {/* Stats ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Active Markets", value: "8", accent: "text-cyan" },
          { label: "Total OI", value: "$8.7M", accent: "text-foreground" },
          { label: "24h Volume", value: "$3.4M", accent: "text-foreground" },
          { label: "Active Agents", value: "6", accent: "text-violet" },
        ].map((stat) => (
          <GlassPanel key={stat.label} tier={1} className="px-4 py-3">
            <div className="text-xs text-muted-foreground">{stat.label}</div>
            <div className={`font-mono text-lg font-semibold ${stat.accent}`}>
              {stat.value}
            </div>
          </GlassPanel>
        ))}
      </div>

      {/* Top Agents */}
      <div className="mb-8">
        <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
          Top Agents
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {topAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>

      {/* Market grid */}
      <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
        All Markets
      </h2>
      <MarketGrid />

      {/* Create market dialog */}
      <CreateMarketDialog
        open={showCreateMarket}
        onClose={() => setShowCreateMarket(false)}
      />
    </div>
  );
}
