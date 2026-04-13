"use client";

import { GlassPanel } from "@/components/glass";
import { useGsapCounter } from "@/hooks/use-gsap-counter";
import { cn } from "@/lib/utils";
import type { Position } from "@/types";

interface PortfolioSummaryProps {
  positions: Position[];
  depositedCapital: number;
}

export function PortfolioSummary({ positions, depositedCapital }: PortfolioSummaryProps) {
  const totalUnrealizedPnl = positions.reduce((s, p) => s + p.unrealizedPnl, 0);
  const totalRealizedPnl = positions.reduce((s, p) => s + p.realizedPnl, 0);
  const totalMarginUsed = positions.reduce((s, p) => s + p.marginUsed, 0);
  const totalReserved = positions.reduce((s, p) => s + p.reservedPnl, 0);
  const totalMatured = positions.reduce((s, p) => s + p.maturedPnl, 0);
  const equity = depositedCapital + totalUnrealizedPnl + totalRealizedPnl;
  const marginAvailable = equity - totalMarginUsed;

  const equityRef = useGsapCounter(equity, { decimals: 2, prefix: "$", duration: 0.5 });
  const pnlRef = useGsapCounter(totalUnrealizedPnl, {
    decimals: 2,
    prefix: totalUnrealizedPnl >= 0 ? "+$" : "-$",
    duration: 0.5,
  });

  const stats = [
    { label: "Deposited Capital", value: `$${depositedCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: "text-foreground" },
    { label: "Realized PnL", value: `${totalRealizedPnl >= 0 ? "+" : ""}$${totalRealizedPnl.toFixed(2)}`, color: totalRealizedPnl >= 0 ? "text-emerald" : "text-coral" },
    { label: "Margin Used", value: `$${totalMarginUsed.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: "text-foreground" },
    { label: "Margin Available", value: `$${marginAvailable.toFixed(2)}`, color: marginAvailable > 0 ? "text-foreground" : "text-coral" },
    { label: "Reserved (Warming)", value: `$${totalReserved.toFixed(2)}`, color: "text-cyan" },
    { label: "Matured PnL", value: `$${totalMatured.toFixed(2)}`, color: "text-emerald" },
  ];

  return (
    <div className="space-y-4">
      {/* Hero stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <GlassPanel tier={2} className="p-5">
          <div className="text-xs text-muted-foreground mb-1">Total Equity</div>
          <span ref={equityRef} className="font-heading text-3xl font-bold text-foreground block" />
        </GlassPanel>
        <GlassPanel tier={2} className="p-5">
          <div className="text-xs text-muted-foreground mb-1">Unrealized PnL</div>
          <span
            ref={pnlRef}
            className={cn(
              "font-heading text-3xl font-bold block",
              totalUnrealizedPnl >= 0 ? "text-emerald" : "text-coral"
            )}
          />
        </GlassPanel>
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat) => (
          <GlassPanel key={stat.label} tier={1} className="px-4 py-3">
            <div className="text-[10px] text-muted-foreground">{stat.label}</div>
            <div className={cn("font-mono text-sm font-medium", stat.color)}>
              {stat.value}
            </div>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}
