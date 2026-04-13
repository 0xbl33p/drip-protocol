"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { GlassButton } from "@/components/glass";
import { useTradeStore } from "@/stores";
import { useTradeExecution, type TradeStatus } from "@/hooks/use-trade-execution";
import { Side } from "@/types";
import { cn } from "@/lib/utils";

interface TradeConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  marketName: string;
  marketPrice: number;
}

function StatusIndicator({ status }: { status: TradeStatus }) {
  const stages: { key: TradeStatus; label: string }[] = [
    { key: "building", label: "Building transaction" },
    { key: "signing", label: "Waiting for signature" },
    { key: "confirming", label: "Confirming on-chain" },
  ];

  const activeIdx = stages.findIndex((s) => s.key === status);

  return (
    <div className="space-y-2">
      {stages.map((stage, i) => {
        const isActive = stage.key === status;
        const isDone = activeIdx > i || status === "confirmed";

        return (
          <div key={stage.key} className="flex items-center gap-3">
            <div
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                isDone && "bg-emerald shadow-[0_0_6px_rgba(16,185,129,0.6)]",
                isActive && "bg-cyan shadow-[0_0_6px_rgba(0,217,255,0.6)] animate-pulse",
                !isDone && !isActive && "bg-white/10"
              )}
            />
            <span
              className={cn(
                "text-xs",
                isDone && "text-emerald",
                isActive && "text-cyan",
                !isDone && !isActive && "text-muted-foreground"
              )}
            >
              {stage.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function TradeConfirmationDialog({
  open,
  onClose,
  marketName,
  marketPrice,
}: TradeConfirmationDialogProps) {
  const { side, sizeUsdc, leverage } = useTradeStore();
  const { status, txSignature, error, execute, reset } = useTradeExecution();

  const sizeNum = parseFloat(sizeUsdc) || 0;
  const notional = sizeNum * leverage;
  const fee = notional * 0.0005;
  const isLong = side === Side.Long;

  const handleConfirm = () => {
    execute({
      marketId: "",
      side,
      sizeUsdc: sizeNum,
      leverage,
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
            Confirm{" "}
            <span className={isLong ? "text-emerald" : "text-coral"}>
              {isLong ? "Long" : "Short"}
            </span>{" "}
            {marketName}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Review your trade before submitting
          </DialogDescription>
        </DialogHeader>

        {/* Order summary */}
        {status === "idle" && (
          <>
            <div className="space-y-2 py-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Side</span>
                <span
                  className={cn(
                    "font-medium",
                    isLong ? "text-emerald" : "text-coral"
                  )}
                >
                  {isLong ? "Long" : "Short"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Size</span>
                <span className="font-mono">${sizeNum.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Leverage</span>
                <span className="font-mono">{leverage}x</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Notional</span>
                <span className="font-mono">${notional.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Entry Price</span>
                <span className="font-mono">{marketPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-white/[0.04] pt-2">
                <span className="text-muted-foreground">Fee (5bps)</span>
                <span className="font-mono">${fee.toFixed(2)}</span>
              </div>
            </div>

            <GlassButton
              variant={isLong ? "long" : "short"}
              size="lg"
              className="w-full"
              onClick={handleConfirm}
            >
              Confirm {isLong ? "Long" : "Short"} — ${sizeNum.toFixed(2)}
            </GlassButton>
          </>
        )}

        {/* Transaction progress */}
        {status !== "idle" && status !== "confirmed" && status !== "error" && (
          <div className="py-6">
            <StatusIndicator status={status} />
          </div>
        )}

        {/* Success */}
        {status === "confirmed" && txSignature && (
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <span className="text-emerald text-sm font-medium">
                Trade confirmed
              </span>
            </div>
            <div className="glass-1 rounded-lg px-3 py-2">
              <div className="text-[10px] text-muted-foreground mb-1">
                Transaction
              </div>
              <div className="font-mono text-xs text-foreground break-all">
                {txSignature.slice(0, 32)}...
              </div>
            </div>
            <GlassButton
              variant="default"
              size="md"
              className="w-full"
              onClick={handleClose}
            >
              Close
            </GlassButton>
          </div>
        )}

        {/* Error */}
        {status === "error" && error && (
          <div className="py-4 space-y-4">
            <div className="glass-1 rounded-lg px-3 py-2 border border-coral/20">
              <div className="text-xs text-coral">{error}</div>
            </div>
            <div className="flex gap-2">
              <GlassButton
                variant="default"
                size="md"
                className="flex-1"
                onClick={handleClose}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="cyan"
                size="md"
                className="flex-1"
                onClick={() => {
                  reset();
                  handleConfirm();
                }}
              >
                Retry
              </GlassButton>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
