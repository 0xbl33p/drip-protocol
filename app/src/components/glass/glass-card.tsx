"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  variant?: "default" | "gold" | "violet";
  interactive?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ variant = "default", interactive = true, className, children, ...props }, ref) => {
    const base =
      variant === "gold"
        ? "glass-gold"
        : variant === "violet"
          ? "glass-violet"
          : "glass-1";

    return (
      <motion.div
        ref={ref}
        whileHover={
          interactive
            ? {
                y: -4,
                transition: { duration: 0.2 },
              }
            : undefined
        }
        whileTap={interactive ? { scale: 0.995 } : undefined}
        className={cn(
          "rounded-2xl p-5 cursor-pointer transition-colors duration-200",
          base,
          interactive && "hover:border-white/12",
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";
