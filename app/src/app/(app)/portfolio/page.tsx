"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { GlassPanel } from "@/components/glass";
import { GlassButton } from "@/components/glass";
import { PortfolioSummary } from "@/components/portfolio/portfolio-summary";
import { PositionsTable } from "@/components/portfolio/positions-table";
import { PnlChart } from "@/components/portfolio/pnl-chart";
import { HistoryTable } from "@/components/portfolio/history-table";
import { ClosePositionDialog } from "@/components/portfolio/close-position-dialog";
import { useMockPositions } from "@/hooks/use-live-positions";
import { cn } from "@/lib/utils";
import type { Position } from "@/types";

const TABS = ["Positions", "History"] as const;
type Tab = (typeof TABS)[number];

export default function PortfolioPage() {
  const { connected } = useWallet();
  const [tab, setTab] = useState<Tab>("Positions");
  const [closingPosition, setClosingPosition] = useState<Position | null>(null);

  // Use mock positions for demo when wallet is connected
  const mockPositions = useMockPositions();
  const positions = connected ? mockPositions : [];
  const depositedCapital = connected ? 7000 : 0;
  const equity = depositedCapital + positions.reduce((s, p) => s + p.unrealizedPnl + p.realizedPnl, 0);

  if (!connected) {
    return (
      <div className="flex-1 mx-auto w-full max-w-[1800px] px-6 py-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground mb-6">
          Portfolio
        </h1>
        <GlassPanel tier={1} className="p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center mx-auto">
            <div className="h-4 w-4 rounded-full bg-cyan/40" />
          </div>
          <p className="text-muted-foreground">
            Connect your wallet to view positions, P&amp;L, and warmup status.
          </p>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="flex-1 mx-auto w-full max-w-[1800px] px-6 py-6 space-y-6">
      <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
        Portfolio
      </h1>

      {/* Summary cards */}
      <PortfolioSummary positions={positions} depositedCapital={depositedCapital} />

      {/* Equity chart */}
      <PnlChart equity={equity} />

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {TABS.map((t) => (
          <GlassButton
            key={t}
            variant={tab === t ? "cyan" : "ghost"}
            size="sm"
            onClick={() => setTab(t)}
          >
            {t}
            {t === "Positions" && positions.length > 0 && (
              <span className="ml-1 text-[10px]">{positions.length}</span>
            )}
          </GlassButton>
        ))}
      </div>

      {/* Tab content */}
      {tab === "Positions" && (
        <PositionsTable
          positions={positions}
          onClose={(p) => setClosingPosition(p)}
        />
      )}
      {tab === "History" && <HistoryTable />}

      {/* Close position dialog */}
      <ClosePositionDialog
        position={closingPosition}
        open={closingPosition !== null}
        onClose={() => setClosingPosition(null)}
      />
    </div>
  );
}
