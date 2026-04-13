"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { MOCK_MARKETS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function PriceTicker() {
  const tickerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!innerRef.current) return;

    const width = innerRef.current.scrollWidth / 2;

    const tween = gsap.to(innerRef.current, {
      x: -width,
      duration: 40,
      ease: "none",
      repeat: -1,
    });

    return () => { tween.kill(); };
  }, []);

  const markets = MOCK_MARKETS;

  return (
    <div
      ref={tickerRef}
      className="w-full overflow-hidden glass-1 border-b border-white/[0.04] py-1.5"
    >
      <div ref={innerRef} className="flex items-center gap-6 whitespace-nowrap">
        {/* Duplicate for seamless loop */}
        {[...markets, ...markets].map((m, i) => {
          const isPositive = m.change24h >= 0;
          return (
            <div key={`${m.id}-${i}`} className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground">{m.name}</span>
              <span className="font-mono text-xs text-foreground">
                {m.price.toFixed(m.price < 1 ? 4 : 1)}
              </span>
              <span
                className={cn(
                  "font-mono text-[10px] font-medium",
                  isPositive ? "text-emerald" : "text-coral"
                )}
              >
                {isPositive ? "+" : ""}{m.change24h.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
