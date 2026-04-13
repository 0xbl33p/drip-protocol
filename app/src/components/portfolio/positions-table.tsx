"use client";

import { useState, useMemo } from "react";
import { GlassPanel } from "@/components/glass";
import { GlassButton } from "@/components/glass";
import { WarmupBar } from "@/components/terminal/warmup-bar";
import { Side } from "@/types";
import { cn } from "@/lib/utils";
import type { Position } from "@/types";
import Link from "next/link";

type SortKey = "market" | "pnl" | "size" | "leverage";
type SortDir = "asc" | "desc";

interface PositionsTableProps {
  positions: Position[];
  onClose?: (position: Position) => void;
}

export function PositionsTable({ positions, onClose }: PositionsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("pnl");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const copy = [...positions];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "market": cmp = a.marketName.localeCompare(b.marketName); break;
        case "pnl": cmp = a.unrealizedPnl - b.unrealizedPnl; break;
        case "size": cmp = a.notional - b.notional; break;
        case "leverage": cmp = a.leverage - b.leverage; break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [positions, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortHeader = ({ k, label, className }: { k: SortKey; label: string; className?: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className={cn(
        "text-[10px] text-muted-foreground hover:text-foreground transition-colors text-left",
        sortKey === k && "text-cyan",
        className
      )}
    >
      {label} {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : ""}
    </button>
  );

  if (positions.length === 0) {
    return (
      <GlassPanel tier={1} className="p-8 text-center">
        <p className="text-muted-foreground text-sm">No open positions</p>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel tier={1} className="overflow-hidden">
      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.04]">
              <th className="px-4 py-3"><SortHeader k="market" label="Market" /></th>
              <th className="px-4 py-3 text-[10px] text-muted-foreground text-left">Side</th>
              <th className="px-4 py-3"><SortHeader k="size" label="Notional" /></th>
              <th className="px-4 py-3 text-[10px] text-muted-foreground text-left">Entry</th>
              <th className="px-4 py-3 text-[10px] text-muted-foreground text-left">Mark</th>
              <th className="px-4 py-3"><SortHeader k="pnl" label="PnL" /></th>
              <th className="px-4 py-3"><SortHeader k="leverage" label="Lev." /></th>
              <th className="px-4 py-3 text-[10px] text-muted-foreground text-left">Liq. Price</th>
              <th className="px-4 py-3 text-[10px] text-muted-foreground text-left">Warmup</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const isLong = p.side === Side.Long;
              return (
                <tr
                  key={p.marketId}
                  className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/terminal/${p.marketId}`}
                      className="text-xs font-medium text-foreground hover:text-cyan transition-colors"
                    >
                      {p.marketName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                        isLong ? "bg-emerald/15 text-emerald" : "bg-coral/15 text-coral"
                      )}
                    >
                      {isLong ? "LONG" : "SHORT"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">${p.notional.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.entryPrice}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.markPrice}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "font-mono text-xs font-semibold",
                        p.unrealizedPnl >= 0 ? "text-emerald" : "text-coral"
                      )}
                    >
                      {p.unrealizedPnl >= 0 ? "+" : ""}${p.unrealizedPnl.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{p.leverage}x</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.liquidationPrice}</td>
                  <td className="px-4 py-3 w-24">
                    <WarmupBar compact segments={p.warmupCohorts} totalReserved={p.reservedPnl} />
                  </td>
                  <td className="px-4 py-3">
                    <GlassButton
                      variant="ghost"
                      size="sm"
                      onClick={() => onClose?.(p)}
                      className="text-[10px]"
                    >
                      Close
                    </GlassButton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="lg:hidden p-3 space-y-3">
        {sorted.map((p) => {
          const isLong = p.side === Side.Long;
          return (
            <div key={p.marketId} className="glass-1 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                      isLong ? "bg-emerald/15 text-emerald" : "bg-coral/15 text-coral"
                    )}
                  >
                    {isLong ? "LONG" : "SHORT"} {p.leverage}x
                  </span>
                  <Link
                    href={`/terminal/${p.marketId}`}
                    className="text-xs font-medium text-foreground hover:text-cyan"
                  >
                    {p.marketName}
                  </Link>
                </div>
                <span
                  className={cn(
                    "font-mono text-sm font-semibold",
                    p.unrealizedPnl >= 0 ? "text-emerald" : "text-coral"
                  )}
                >
                  {p.unrealizedPnl >= 0 ? "+" : ""}${p.unrealizedPnl.toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div>
                  <span className="text-muted-foreground">Notional</span>
                  <div className="font-mono">${p.notional.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Entry</span>
                  <div className="font-mono">{p.entryPrice}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Liq.</span>
                  <div className="font-mono">{p.liquidationPrice}</div>
                </div>
              </div>
              <WarmupBar compact segments={p.warmupCohorts} totalReserved={p.reservedPnl} />
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}
