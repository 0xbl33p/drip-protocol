"use client";

import { GlassPanel } from "@/components/glass";
import { ConvictionBadge } from "./conviction-score";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  address: string;
  score: number;
  side: "long" | "short";
  size: number;
  holdDuration: string;
}

/** Generate mock leaderboard data */
function generateLeaderboard(): LeaderboardEntry[] {
  let seed = 77001;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  return Array.from({ length: 10 }, (_, i) => ({
    rank: i + 1,
    address: `${Math.floor(rand() * 900 + 100).toString(16)}...${Math.floor(rand() * 900 + 100).toString(16)}`,
    score: Math.round(95 - i * 7 - rand() * 5),
    side: rand() > 0.4 ? "long" as const : "short" as const,
    size: Math.round((1000 + rand() * 50000) * 100) / 100,
    holdDuration: `${Math.floor(1 + rand() * 30)}d ${Math.floor(rand() * 24)}h`,
  }));
}

interface ConvictionLeaderboardProps {
  marketName?: string;
}

export function ConvictionLeaderboard({ marketName }: ConvictionLeaderboardProps) {
  const entries = generateLeaderboard();

  return (
    <GlassPanel tier={1} className="overflow-hidden">
      <div className="px-5 py-3 border-b border-white/[0.04]">
        <h3 className="font-heading text-sm font-semibold text-foreground">
          Top Conviction Holders
          {marketName && <span className="text-muted-foreground font-normal"> — {marketName}</span>}
        </h3>
      </div>

      <div className="divide-y divide-white/[0.02]">
        {entries.map((entry) => (
          <div
            key={entry.rank}
            className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors"
          >
            {/* Rank */}
            <div className={cn(
              "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold",
              entry.rank <= 3 ? "bg-gold/15 text-gold" : "bg-white/5 text-muted-foreground"
            )}>
              {entry.rank}
            </div>

            {/* Address */}
            <div className="flex-1 min-w-0">
              <span className="font-mono text-xs text-foreground">{entry.address}</span>
            </div>

            {/* Side */}
            <span className={cn(
              "text-[10px] font-semibold px-1.5 py-0.5 rounded",
              entry.side === "long" ? "bg-emerald/15 text-emerald" : "bg-coral/15 text-coral"
            )}>
              {entry.side === "long" ? "LONG" : "SHORT"}
            </span>

            {/* Size */}
            <span className="font-mono text-xs text-muted-foreground w-20 text-right">
              ${entry.size >= 1000 ? `${(entry.size / 1000).toFixed(1)}K` : entry.size.toFixed(0)}
            </span>

            {/* Duration */}
            <span className="font-mono text-[10px] text-muted-foreground w-14 text-right">
              {entry.holdDuration}
            </span>

            {/* Score */}
            <ConvictionBadge score={entry.score} />
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}
