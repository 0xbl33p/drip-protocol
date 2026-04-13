"use client";

import { useParams } from "next/navigation";
import { MOCK_AGENTS } from "@/lib/mock-agents";
import { GlassPanel } from "@/components/glass";
import { GlassButton } from "@/components/glass";
import { TrackRecord } from "@/components/agent/track-record";
import { OracleMethodology } from "@/components/agent/oracle-methodology";
import { AgentMarketsList } from "@/components/agent/agent-markets-list";
import Link from "next/link";

export default function AgentProfilePage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const agent = MOCK_AGENTS.find((a) => a.id === agentId);

  if (!agent) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Agent not found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 mx-auto w-full max-w-[1200px] px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-xl bg-violet/20 border border-violet/30 flex items-center justify-center shrink-0">
          <span className="text-violet text-2xl font-bold font-heading">
            {agent.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {agent.name}
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-0.5">
            {agent.wallet}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {agent.description}
          </p>
        </div>
        <div className="shrink-0 hidden sm:block">
          <div className="text-[10px] text-muted-foreground mb-1">Since</div>
          <div className="text-xs font-mono text-foreground">{agent.createdAt}</div>
        </div>
      </div>

      {/* Track record */}
      <TrackRecord agent={agent} />

      {/* Oracle methodology */}
      <OracleMethodology agent={agent} />

      {/* Markets created */}
      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
          Markets Created
        </h2>
        <AgentMarketsList agentId={agent.id} />
      </div>

      {/* Back link */}
      <Link href="/agents">
        <GlassButton variant="ghost" size="sm">
          &larr; All Agents
        </GlassButton>
      </Link>
    </div>
  );
}
