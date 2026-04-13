"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTradeStore } from "@/stores";
import { Side } from "@/types/engine";
import { GlassPanel } from "@/components/glass";
import { TradeConfirmationDialog } from "./trade-confirmation-dialog";
import { cn } from "@/lib/utils";

interface OrderPanelProps {
  marketPrice: number;
  marketName: string;
}

const QUICK_FILLS = [
  { label: "25%", pct: 0.25 },
  { label: "50%", pct: 0.5 },
  { label: "75%", pct: 0.75 },
  { label: "100%", pct: 1.0 },
];

export function OrderPanel({ marketPrice, marketName }: OrderPanelProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const { connected } = useWallet();
  const {
    side,
    sizeUsdc,
    leverage,
    showTpSl,
    takeProfitPrice,
    stopLossPrice,
    setSide,
    setSize,
    setLeverage,
    setTakeProfitPrice,
    setStopLossPrice,
    toggleTpSl,
  } = useTradeStore();

  const sizeNum = parseFloat(sizeUsdc) || 0;
  const notional = sizeNum * leverage;
  const fee = notional * 0.0005; // 5bps mock
  const marginRequired = sizeNum;

  // Rough liq price estimate
  const liqDistance = sizeNum > 0 ? (sizeNum / notional) * marketPrice * 0.9 : 0;
  const liqPrice =
    side === Side.Long
      ? marketPrice - liqDistance
      : marketPrice + liqDistance;

  const leveragePercent = ((leverage - 1) / 19) * 100;

  return (
    <GlassPanel tier={1} className="p-4 space-y-4 overflow-y-auto">
      <h3 className="font-heading text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Trade
      </h3>

      {/* Long / Short Toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setSide(Side.Long)}
          className={cn(
            "py-2.5 rounded-xl text-sm font-semibold transition-all",
            side === Side.Long
              ? "bg-emerald/20 text-emerald border border-emerald/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
              : "bg-white/3 text-muted-foreground border border-white/6 hover:border-emerald/20 hover:text-emerald"
          )}
        >
          Long
        </button>
        <button
          onClick={() => setSide(Side.Short)}
          className={cn(
            "py-2.5 rounded-xl text-sm font-semibold transition-all",
            side === Side.Short
              ? "bg-coral/20 text-coral border border-coral/40 shadow-[0_0_15px_rgba(255,107,107,0.15)]"
              : "bg-white/3 text-muted-foreground border border-white/6 hover:border-coral/20 hover:text-coral"
          )}
        >
          Short
        </button>
      </div>

      {/* Size Input */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Size</label>
        <div className="glass-2 rounded-xl px-3 py-2.5 flex items-center gap-2 focus-within:border-cyan/30 transition-colors">
          <input
            type="number"
            placeholder="0.00"
            value={sizeUsdc}
            onChange={(e) => setSize(e.target.value)}
            className="bg-transparent flex-1 text-foreground font-mono text-sm outline-none placeholder:text-muted-foreground/40 min-w-0"
          />
          <span className="text-xs text-muted-foreground font-mono shrink-0">
            USDC
          </span>
        </div>
        {/* Quick fill buttons */}
        <div className="flex gap-1.5">
          {QUICK_FILLS.map((q) => (
            <button
              key={q.label}
              onClick={() => setSize((1000 * q.pct).toString())}
              className="flex-1 py-1 text-[10px] font-mono rounded-lg text-muted-foreground hover:text-foreground bg-white/3 hover:bg-white/6 border border-white/6 transition-colors"
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leverage Slider */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Leverage</span>
          <span className="font-mono text-foreground font-medium">
            {leverage.toFixed(1)}x
          </span>
        </div>
        <div className="relative">
          <input
            type="range"
            min={1}
            max={20}
            step={0.5}
            value={leverage}
            onChange={(e) => setLeverage(parseFloat(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/5
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground
              [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-cyan/50
              [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(0,217,255,0.3)]"
          />
          {/* Gradient track overlay */}
          <div
            className="absolute top-0 left-0 h-1.5 rounded-full bg-gradient-to-r from-emerald via-gold to-coral pointer-events-none"
            style={{ width: `${leveragePercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
          <span>1x</span>
          <span>20x</span>
        </div>
      </div>

      {/* TP/SL Toggle */}
      <button
        onClick={toggleTpSl}
        className="w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {showTpSl ? "▾" : "▸"} Take Profit / Stop Loss
      </button>

      {showTpSl && (
        <div className="space-y-2">
          <div className="glass-2 rounded-xl px-3 py-2 flex items-center gap-2">
            <span className="text-[10px] text-emerald font-mono shrink-0">
              TP
            </span>
            <input
              type="number"
              placeholder="Price"
              value={takeProfitPrice}
              onChange={(e) => setTakeProfitPrice(e.target.value)}
              className="bg-transparent flex-1 text-foreground font-mono text-xs outline-none placeholder:text-muted-foreground/40 min-w-0"
            />
          </div>
          <div className="glass-2 rounded-xl px-3 py-2 flex items-center gap-2">
            <span className="text-[10px] text-coral font-mono shrink-0">
              SL
            </span>
            <input
              type="number"
              placeholder="Price"
              value={stopLossPrice}
              onChange={(e) => setStopLossPrice(e.target.value)}
              className="bg-transparent flex-1 text-foreground font-mono text-xs outline-none placeholder:text-muted-foreground/40 min-w-0"
            />
          </div>
        </div>
      )}

      {/* Order Preview */}
      <div className="space-y-1.5 pt-3 border-t border-white/[0.04]">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Notional</span>
          <span className="font-mono">
            {notional > 0 ? `$${notional.toFixed(2)}` : "—"}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Margin</span>
          <span className="font-mono">
            {marginRequired > 0 ? `$${marginRequired.toFixed(2)}` : "—"}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Fee (5bps)</span>
          <span className="font-mono">
            {fee > 0 ? `$${fee.toFixed(2)}` : "—"}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Est. Liq. Price</span>
          <span className="font-mono">
            {sizeNum > 0 ? liqPrice.toFixed(2) : "—"}
          </span>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={() => {
          if (connected && sizeNum > 0) {
            setShowConfirm(true);
          }
        }}
        className={cn(
          "w-full py-3 rounded-xl text-sm font-semibold transition-all",
          !connected
            ? "bg-cyan/20 text-cyan border border-cyan/30 hover:bg-cyan/30"
            : side === Side.Long
              ? "bg-emerald/20 text-emerald border border-emerald/30 hover:bg-emerald/30"
              : "bg-coral/20 text-coral border border-coral/30 hover:bg-coral/30"
        )}
      >
        {!connected
          ? "Connect Wallet to Trade"
          : sizeNum <= 0
            ? "Enter Size"
            : `${side === Side.Long ? "Long" : "Short"} ${marketName}`}
      </button>

      {/* Trade confirmation dialog */}
      <TradeConfirmationDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        marketName={marketName}
        marketPrice={marketPrice}
      />
    </GlassPanel>
  );
}
