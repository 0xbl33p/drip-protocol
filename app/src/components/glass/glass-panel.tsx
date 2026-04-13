"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

type GlassTier = 1 | 2 | 3 | "gold" | "violet";

interface GlassPanelProps extends HTMLMotionProps<"div"> {
  tier?: GlassTier;
}

const tierClass: Record<GlassTier, string> = {
  1: "glass-1",
  2: "glass-2",
  3: "glass-3",
  gold: "glass-gold",
  violet: "glass-violet",
};

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ tier = 1, className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn("rounded-2xl", tierClass[tier], className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassPanel.displayName = "GlassPanel";
