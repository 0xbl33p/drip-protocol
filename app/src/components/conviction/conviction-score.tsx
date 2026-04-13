"use client";

import { cn } from "@/lib/utils";

interface ConvictionScoreProps {
  score: number; // 0-100
  size?: "sm" | "md" | "lg";
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-gold";
  if (score >= 60) return "text-emerald";
  if (score >= 40) return "text-cyan";
  return "text-muted-foreground";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Diamond";
  if (score >= 75) return "Strong";
  if (score >= 50) return "Moderate";
  if (score >= 25) return "Light";
  return "Spectator";
}

function getScoreGlow(score: number): string {
  if (score >= 80) return "shadow-[0_0_12px_rgba(255,184,0,0.3)]";
  if (score >= 60) return "shadow-[0_0_12px_rgba(16,185,129,0.2)]";
  return "";
}

export function ConvictionScore({ score, size = "md" }: ConvictionScoreProps) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  const glow = getScoreGlow(score);

  const sizeStyles = {
    sm: "h-8 w-8 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-lg",
  };

  return (
    <div className="flex items-center gap-3">
      {/* Score circle */}
      <div
        className={cn(
          "rounded-full border-2 flex items-center justify-center font-mono font-bold",
          sizeStyles[size],
          color,
          glow,
          score >= 80 ? "border-gold/40 bg-gold/10" :
          score >= 60 ? "border-emerald/40 bg-emerald/10" :
          score >= 40 ? "border-cyan/40 bg-cyan/10" :
          "border-white/10 bg-white/5"
        )}
      >
        {score}
      </div>

      {/* Label */}
      {size !== "sm" && (
        <div>
          <div className={cn("text-xs font-semibold", color)}>{label}</div>
          <div className="text-[10px] text-muted-foreground">Conviction</div>
        </div>
      )}
    </div>
  );
}

/**
 * Inline conviction badge for compact displays.
 */
export function ConvictionBadge({ score }: { score: number }) {
  const color = getScoreColor(score);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full",
        score >= 80 ? "bg-gold/10 text-gold border border-gold/20" :
        score >= 60 ? "bg-emerald/10 text-emerald border border-emerald/20" :
        score >= 40 ? "bg-cyan/10 text-cyan border border-cyan/20" :
        "bg-white/5 text-muted-foreground border border-white/10"
      )}
    >
      {score} {getScoreLabel(score)}
    </span>
  );
}
