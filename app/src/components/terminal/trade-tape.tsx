"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { GlassPanel } from "@/components/glass";
import { MARKET_TRADES, type MockTrade } from "@/lib/mock-trades";
import { cn } from "@/lib/utils";

interface TradeTapeProps {
  marketId: string;
}

function formatTime(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function TradeRow({ trade, index }: { trade: MockTrade; index: number }) {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rowRef.current && index < 10) {
      gsap.fromTo(
        rowRef.current,
        { opacity: 0, x: -8 },
        { opacity: 1, x: 0, duration: 0.3, delay: index * 0.03, ease: "power2.out" }
      );
    }
  }, [index]);

  return (
    <div
      ref={rowRef}
      className="flex items-center gap-2 px-2 py-1 text-[11px] font-mono hover:bg-white/3 rounded transition-colors"
    >
      <span className="text-muted-foreground w-16 shrink-0">
        {formatTime(trade.time)}
      </span>
      <span
        className={cn(
          "w-10 shrink-0 font-medium",
          trade.side === "long" ? "text-emerald" : "text-coral"
        )}
      >
        {trade.side === "long" ? "BUY" : "SELL"}
      </span>
      <span className="text-foreground flex-1 text-right">
        {trade.price.toFixed(2)}
      </span>
      <span className="text-muted-foreground w-20 text-right shrink-0">
        ${trade.size >= 1000
          ? `${(trade.size / 1000).toFixed(1)}K`
          : trade.size.toFixed(0)}
      </span>
    </div>
  );
}

export function TradeTape({ marketId }: TradeTapeProps) {
  const trades = MARKET_TRADES[marketId] || [];

  return (
    <GlassPanel tier={1} className="p-3 flex flex-col min-h-0">
      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
        Recent Trades
      </h3>
      {/* Header */}
      <div className="flex items-center gap-2 px-2 py-1 text-[10px] text-muted-foreground font-mono border-b border-white/[0.04] mb-1">
        <span className="w-16 shrink-0">Time</span>
        <span className="w-10 shrink-0">Side</span>
        <span className="flex-1 text-right">Price</span>
        <span className="w-20 text-right shrink-0">Size</span>
      </div>
      {/* Trade list */}
      <div className="flex-1 overflow-y-auto space-y-0 scrollbar-none">
        {trades.slice(0, 30).map((trade, i) => (
          <TradeRow key={trade.id} trade={trade} index={i} />
        ))}
      </div>
    </GlassPanel>
  );
}
