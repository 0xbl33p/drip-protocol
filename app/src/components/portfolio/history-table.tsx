"use client";

import { useState, useMemo } from "react";
import { GlassPanel } from "@/components/glass";
import { GlassButton } from "@/components/glass";
import { cn } from "@/lib/utils";

interface TradeHistoryEntry {
  id: string;
  time: string;
  market: string;
  side: "long" | "short";
  size: number;
  price: number;
  fee: number;
  pnl: number;
}

/** Mock trade history data */
function generateMockHistory(): TradeHistoryEntry[] {
  const markets = [
    "AI Narrative Index",
    "SOL vs ETH Mindshare",
    "@HsakaTrades Alpha",
    "Memecoin Season",
    "RWA Institutional",
  ];

  let seed = 99001;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const entries: TradeHistoryEntry[] = [];
  for (let i = 0; i < 47; i++) {
    const market = markets[Math.floor(rand() * markets.length)];
    const side = rand() > 0.5 ? "long" : "short";
    const size = Math.round((200 + rand() * 10000) * 100) / 100;
    const price = 20 + rand() * 180;
    const fee = size * 0.0005;
    const pnl = (rand() - 0.45) * size * 0.1;

    entries.push({
      id: `hist-${i}`,
      time: new Date(1776124800000 - i * 3600000 * (1 + rand() * 5)).toLocaleString(),
      market,
      side,
      size,
      price: Math.round(price * 100) / 100,
      fee: Math.round(fee * 100) / 100,
      pnl: Math.round(pnl * 100) / 100,
    });
  }

  return entries;
}

const PAGE_SIZE = 10;

export function HistoryTable() {
  const [page, setPage] = useState(0);
  const history = useMemo(() => generateMockHistory(), []);

  const totalPages = Math.ceil(history.length / PAGE_SIZE);
  const pageData = history.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <GlassPanel tier={1} className="overflow-hidden">
      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.04]">
              {["Time", "Market", "Side", "Size", "Price", "Fee", "PnL"].map((h) => (
                <th key={h} className="px-4 py-3 text-[10px] text-muted-foreground text-left font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((t) => (
              <tr key={t.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">{t.time}</td>
                <td className="px-4 py-2.5 text-xs text-foreground">{t.market}</td>
                <td className="px-4 py-2.5">
                  <span className={cn(
                    "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                    t.side === "long" ? "bg-emerald/15 text-emerald" : "bg-coral/15 text-coral"
                  )}>
                    {t.side === "long" ? "LONG" : "SHORT"}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs">${t.size.toLocaleString()}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{t.price}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">${t.fee}</td>
                <td className="px-4 py-2.5">
                  <span className={cn("font-mono text-xs font-medium", t.pnl >= 0 ? "text-emerald" : "text-coral")}>
                    {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="lg:hidden p-3 space-y-2">
        {pageData.map((t) => (
          <div key={t.id} className="glass-1 rounded-lg p-2.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[9px] font-semibold px-1 py-0.5 rounded",
                  t.side === "long" ? "bg-emerald/15 text-emerald" : "bg-coral/15 text-coral"
                )}>
                  {t.side === "long" ? "L" : "S"}
                </span>
                <span className="text-xs text-foreground">{t.market}</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                ${t.size.toLocaleString()} @ {t.price}
              </div>
            </div>
            <span className={cn("font-mono text-xs font-semibold", t.pnl >= 0 ? "text-emerald" : "text-coral")}>
              {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.04]">
        <span className="text-[10px] text-muted-foreground">
          {history.length} trades
        </span>
        <div className="flex items-center gap-2">
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Prev
          </GlassButton>
          <span className="text-xs text-muted-foreground font-mono">
            {page + 1}/{totalPages}
          </span>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </GlassButton>
        </div>
      </div>
    </GlassPanel>
  );
}
