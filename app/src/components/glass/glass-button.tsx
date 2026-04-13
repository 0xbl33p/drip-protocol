"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type GlassButtonVariant = "default" | "cyan" | "long" | "short" | "gold" | "violet" | "ghost";

interface GlassButtonProps
  extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: GlassButtonVariant;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const variantStyles: Record<GlassButtonVariant, string> = {
  default: "glass-2 hover:bg-white/10 text-foreground",
  cyan: "bg-cyan/15 border border-cyan/30 text-cyan hover:bg-cyan/25 shadow-[0_0_20px_rgba(0,217,255,0.1)]",
  long: "bg-emerald/15 border border-emerald/30 text-emerald hover:bg-emerald/25",
  short: "bg-coral/15 border border-coral/30 text-coral hover:bg-coral/25",
  gold: "bg-gold/15 border border-gold/30 text-gold hover:bg-gold/25",
  violet: "bg-violet/15 border border-violet/30 text-violet hover:bg-violet/25",
  ghost: "bg-transparent border border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5",
};

const sizeStyles: Record<"sm" | "md" | "lg", string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2 text-sm rounded-xl",
  lg: "px-6 py-3 text-base rounded-xl",
};

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ variant = "default", size = "md", className, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15 }}
        className={cn(
          "font-medium transition-colors duration-200 backdrop-blur-md",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

GlassButton.displayName = "GlassButton";
