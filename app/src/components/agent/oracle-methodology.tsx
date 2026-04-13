"use client";

import { GlassPanel } from "@/components/glass";
import type { Agent } from "@/types";

export function OracleMethodology({ agent }: { agent: Agent }) {
  return (
    <GlassPanel tier="violet" className="p-5 space-y-4">
      <h3 className="font-heading text-sm font-semibold text-violet uppercase tracking-wider">
        Oracle Methodology
      </h3>
      <p className="text-sm text-foreground leading-relaxed">
        {agent.methodology}
      </p>
      <div>
        <div className="text-[10px] text-muted-foreground mb-2">Data Sources</div>
        <div className="flex flex-wrap gap-1.5">
          {agent.dataSources.map((source) => (
            <span
              key={source}
              className="px-2 py-1 text-[10px] font-mono rounded-md bg-violet/10 text-violet border border-violet/20"
            >
              {source}
            </span>
          ))}
        </div>
      </div>
    </GlassPanel>
  );
}
