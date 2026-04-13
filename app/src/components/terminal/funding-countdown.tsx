"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface FundingCountdownProps {
  /** Current funding rate (e.g., 0.005 = 0.5%) */
  rate: number;
  /** Seconds until next funding tick */
  secondsUntilNext: number;
}

export function FundingCountdown({ rate, secondsUntilNext }: FundingCountdownProps) {
  const [remaining, setRemaining] = useState(secondsUntilNext);

  useEffect(() => {
    setRemaining(secondsUntilNext);
    const interval = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : secondsUntilNext));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsUntilNext]);

  const isPositive = rate > 0;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="flex items-center gap-3">
      {/* Rate */}
      <div>
        <div className="text-[10px] text-muted-foreground">Funding Rate</div>
        <div
          className={cn(
            "font-mono text-sm font-medium",
            isPositive ? "text-coral" : "text-emerald"
          )}
        >
          {isPositive ? "+" : ""}
          {(rate * 100).toFixed(4)}%
        </div>
      </div>

      {/* Countdown */}
      <div>
        <div className="text-[10px] text-muted-foreground">Next in</div>
        <div className="font-mono text-sm text-foreground">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      </div>

      {/* Direction label */}
      <div className="text-[10px] text-muted-foreground">
        {isPositive ? "Longs pay shorts" : "Shorts pay longs"}
      </div>
    </div>
  );
}
