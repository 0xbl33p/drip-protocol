"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { GlassButton } from "@/components/glass";
import { useTradeExecution } from "@/hooks/use-trade-execution";
import { Side } from "@/types";
import { cn } from "@/lib/utils";
import type { Position } from "@/types";

interface ClosePositionDialogProps {
  position: Position | null;
  open: boolean;
  onClose: () => void;
}

export function ClosePositionDialog({ position, open, onClose }: ClosePositionDialogProps) {
  const { status, txSignature, error, execute, reset } = useTradeExecution();

  if (!position) return null;

  const isLong = position.side === Side.Long;
  const closeSide = isLong ? "Short" : "Long"; // Closing = opposite side

  const handleConfirm = () => {
    execute({
      marketId: position.marketId,
      side: isLong ? Side.Short : Side.Long,
      sizeUsdc: position.size,
      leverage: 1,
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-2 border-white/10 bg-[#0a1628]/95 backdrop-blur-xl max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-foreground">
            Close Position
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Close your {isLong ? "long" : "short"} on {position.marketName}
          </DialogDescription>
        </DialogHeader>

        {status === "idle" && (
          <>
            <div className="space-y-2 py-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Market</span>
                <span>{position.marketName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Side</span>
                <span className={isLong ? "text-emerald" : "text-coral"}>
                  {isLong ? "Long" : "Short"} {position.leverage}x
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Size</span>
                <span className="font-mono">${position.notional.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Entry</span>
                <span className="font-mono">{position.entryPrice}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Mark</span>
                <span className="font-mono">{position.markPrice}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-white/[0.04] pt-2">
                <span className="text-muted-foreground">Estimated PnL</span>
                <span className={cn(
                  "font-mono font-semibold",
                  position.unrealizedPnl >= 0 ? "text-emerald" : "text-coral"
                )}>
                  {position.unrealizedPnl >= 0 ? "+" : ""}${position.unrealizedPnl.toFixed(2)}
                </span>
              </div>
            </div>

            <GlassButton
              variant={isLong ? "short" : "long"}
              size="lg"
              className="w-full"
              onClick={handleConfirm}
            >
              Close {isLong ? "Long" : "Short"} — Market {closeSide}
            </GlassButton>
          </>
        )}

        {status === "confirmed" && (
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <span className="text-emerald text-sm font-medium">Position closed</span>
            </div>
            <GlassButton variant="default" size="md" className="w-full" onClick={handleClose}>
              Close
            </GlassButton>
          </div>
        )}

        {status === "error" && (
          <div className="py-4 space-y-4">
            <div className="glass-1 rounded-lg px-3 py-2 border border-coral/20">
              <div className="text-xs text-coral">{error}</div>
            </div>
            <GlassButton variant="default" size="md" className="w-full" onClick={handleClose}>
              Close
            </GlassButton>
          </div>
        )}

        {status !== "idle" && status !== "confirmed" && status !== "error" && (
          <div className="py-6 text-center">
            <div className="h-3 w-3 rounded-full bg-cyan animate-pulse mx-auto mb-2 shadow-[0_0_8px_rgba(0,217,255,0.6)]" />
            <p className="text-xs text-muted-foreground">
              {status === "building" ? "Building transaction..." :
               status === "signing" ? "Waiting for signature..." :
               "Confirming on-chain..."}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
