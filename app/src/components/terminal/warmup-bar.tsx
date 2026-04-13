"use client";

import { cn } from "@/lib/utils";

interface WarmupSegment {
  /** Amount remaining in this cohort */
  remaining: number;
  /** Original amount */
  anchor: number;
  /** Progress 0-1 */
  progress: number;
  /** Slots until matured */
  slotsRemaining: number;
}

interface WarmupBarProps {
  segments: WarmupSegment[];
  totalReserved: number;
  /** Compact mode for position rows */
  compact?: boolean;
}

export function WarmupBar({ segments, totalReserved, compact = false }: WarmupBarProps) {
  if (segments.length === 0 || totalReserved === 0) {
    return (
      <div className={cn("text-xs text-muted-foreground", compact ? "" : "py-1")}>
        No warming PnL
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", compact ? "" : "space-y-2")}>
      {!compact && (
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Warmup Progress</span>
          <span className="font-mono text-foreground">
            ${totalReserved.toFixed(2)} warming
          </span>
        </div>
      )}

      {/* Segmented bar */}
      <div
        className={cn(
          "w-full rounded-full bg-white/5 overflow-hidden flex",
          compact ? "h-1" : "h-2"
        )}
        title={`${segments.length} cohort${segments.length !== 1 ? "s" : ""} warming`}
      >
        {segments.map((seg, i) => {
          const width = totalReserved > 0 ? (seg.remaining / totalReserved) * 100 : 0;
          return (
            <div
              key={i}
              className="h-full relative"
              style={{ width: `${width}%` }}
            >
              {/* Background (full segment width) */}
              <div className="absolute inset-0 bg-cyan/10" />
              {/* Fill (progress within segment) */}
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan/40 to-cyan/70"
                style={{ width: `${seg.progress * 100}%` }}
              />
              {/* Segment divider */}
              {i < segments.length - 1 && (
                <div className="absolute right-0 top-0 bottom-0 w-px bg-white/10" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
