"use client";

import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { useTradeStore } from "@/stores";
import { Side } from "@/types";
import { cn } from "@/lib/utils";

interface MobileTradeSheetProps {
  open: boolean;
  onClose: () => void;
  marketPrice: number;
  marketName: string;
}

export function MobileTradeSheet({
  open,
  onClose,
  marketPrice,
  marketName,
}: MobileTradeSheetProps) {
  const { side, sizeUsdc, leverage, setSide, setSize, setLeverage } =
    useTradeStore();

  const sizeNum = parseFloat(sizeUsdc) || 0;
  const notional = sizeNum * leverage;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose();
            }}
            className="fixed bottom-0 left-0 right-0 z-50 glass-2 rounded-t-2xl border-t border-white/10 pb-[env(safe-area-inset-bottom)]"
          >
            {/* Drag handle */}
            <div className="flex justify-center py-3">
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>

            <div className="px-5 pb-5 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-sm font-semibold text-foreground">
                  Trade {marketName}
                </h3>
                <span className="font-mono text-sm text-foreground">
                  {marketPrice.toFixed(2)}
                </span>
              </div>

              {/* Long / Short */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSide(Side.Long)}
                  className={cn(
                    "py-3 rounded-xl text-sm font-semibold transition-all",
                    side === Side.Long
                      ? "bg-emerald/20 text-emerald border border-emerald/40"
                      : "bg-white/3 text-muted-foreground border border-white/6"
                  )}
                >
                  Long
                </button>
                <button
                  onClick={() => setSide(Side.Short)}
                  className={cn(
                    "py-3 rounded-xl text-sm font-semibold transition-all",
                    side === Side.Short
                      ? "bg-coral/20 text-coral border border-coral/40"
                      : "bg-white/3 text-muted-foreground border border-white/6"
                  )}
                >
                  Short
                </button>
              </div>

              {/* Size */}
              <div className="glass-1 rounded-xl px-4 py-3 flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Size (USDC)"
                  value={sizeUsdc}
                  onChange={(e) => setSize(e.target.value)}
                  className="bg-transparent flex-1 text-foreground font-mono text-base outline-none placeholder:text-muted-foreground/40 min-w-0"
                />
                <span className="text-xs text-muted-foreground font-mono">
                  USDC
                </span>
              </div>

              {/* Leverage */}
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Leverage</span>
                  <span className="font-mono text-foreground">{leverage}x</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={1}
                  value={leverage}
                  onChange={(e) => setLeverage(parseFloat(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/5
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground
                    [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-cyan/50"
                />
              </div>

              {/* Preview */}
              {sizeNum > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Notional: ${notional.toFixed(2)}</span>
                  <span>Fee: ${(notional * 0.0005).toFixed(2)}</span>
                </div>
              )}

              {/* Submit */}
              <button
                className={cn(
                  "w-full py-3.5 rounded-xl text-sm font-semibold transition-all",
                  side === Side.Long
                    ? "bg-emerald/20 text-emerald border border-emerald/30"
                    : "bg-coral/20 text-coral border border-coral/30"
                )}
              >
                {sizeNum > 0
                  ? `${side === Side.Long ? "Long" : "Short"} $${notional.toFixed(0)}`
                  : "Enter Size"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
