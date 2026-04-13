"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";

interface GsapCounterOptions {
  /** Number of decimal places */
  decimals?: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Prefix (e.g., "$" or "+") */
  prefix?: string;
  /** Suffix (e.g., "%" or "M") */
  suffix?: string;
}

/**
 * Hook that returns a ref whose textContent is GSAP-animated to the target value.
 * Attach the ref to a <span> or similar element.
 */
export function useGsapCounter(
  value: number,
  options: GsapCounterOptions = {}
) {
  const { decimals = 2, duration = 0.6, prefix = "", suffix = "" } = options;
  const ref = useRef<HTMLSpanElement>(null);
  const currentValue = useRef({ val: value });

  useEffect(() => {
    if (!ref.current) return;

    gsap.to(currentValue.current, {
      val: value,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        if (ref.current) {
          ref.current.textContent = `${prefix}${currentValue.current.val.toFixed(decimals)}${suffix}`;
        }
      },
    });
  }, [value, decimals, duration, prefix, suffix]);

  // Set initial value immediately
  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = `${prefix}${value.toFixed(decimals)}${suffix}`;
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}
