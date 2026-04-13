"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { GlassPanel } from "@/components/glass";
import { WarmupBar } from "./warmup-bar";
import { useLivePositions, useMockPositions } from "@/hooks/use-live-positions";
import { Side } from "@/types";
import { cn } from "@/lib/utils";
import { useGsapCounter } from "@/hooks/use-gsap-counter";
import type { Position } from "@/types";

const TABS = ["Positions", "Orders", "History"] as const;
type Tab = (typeof TABS)[number];

function PositionRow({ position }: { position: Position }) {
  const isLong = position.side === Side.Long;
  const pnlRef = useGsapCounter(position.unrealizedPnl, {
    decimals: 2,
    prefix: position.unrealizedPnl >= 0 ? "+$" : "-$",
    duration: 0.4,
  });

  return (
    <div className="glass-1 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[10px] font-semibold px-1.5 py-0.5 rounded",
              isLong
                ? "bg-emerald/15 text-emerald"
                : "bg-coral/15 text-coral"
            )}
          >
            {isLong ? "LONG" : "SHORT"}
          </span>
          <span className="text-xs font-medium text-foreground">
            {position.marketName}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {position.leverage}x
          </span>
        </div>
        <span
          ref={pnlRef}
          className={cn(
            "font-mono text-sm font-semibold",
            position.unrealizedPnl >= 0 ? "text-emerald" : "text-coral"
          )}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-[10px]">
        <div>
          <span className="text-muted-foreground">Size</span>
          <div className="font-mono text-foreground">${position.size.toLocaleString()}</div>
        </div>
        <div>
          <span className="text-muted-foreground">Entry</span>
          <div className="font-mono text-foreground">{position.entryPrice}</div>
        </div>
        <div>
          <span className="text-muted-foreground">Liq. Price</span>
          <div className="font-mono text-foreground">{position.liquidationPrice}</div>
        </div>
      </div>

      <WarmupBar
        compact
        segments={position.warmupCohorts}
        totalReserved={position.reservedPnl}
      />
    </div>
  );
}

export function PositionsPanel() {
  const [tab, setTab] = useState<Tab>("Positions");
  const { connected } = useWallet();
  const { positions } = useLivePositions();
  const mockPositions = useMockPositions();

  // Show mock positions for demo when wallet is connected but no real data
  const displayPositions = positions.length > 0 ? positions : connected ? mockPositions : [];

  return (
    <GlassPanel tier={1} className="p-3 flex flex-col min-h-0">
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-3 shrink-0">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-lg transition-colors",
              tab === t
                ? "bg-cyan/15 text-cyan border border-cyan/25"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            {t}
            {t === "Positions" && displayPositions.length > 0 && (
              <span className="ml-1 text-[10px] text-cyan">{displayPositions.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-[60px]">
        {tab === "Positions" && displayPositions.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            {connected ? "No open positions" : "Connect wallet to view positions"}
          </p>
        )}
        {tab === "Positions" &&
          displayPositions.map((p) => (
            <PositionRow key={p.marketId} position={p} />
          ))}
        {tab === "Orders" && (
          <p className="text-xs text-muted-foreground text-center py-4">
            No open orders
          </p>
        )}
        {tab === "History" && (
          <p className="text-xs text-muted-foreground text-center py-4">
            {connected ? "No trade history" : "Connect wallet to view history"}
          </p>
        )}
      </div>
    </GlassPanel>
  );
}
