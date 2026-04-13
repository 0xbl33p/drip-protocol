"use client";

import { useState, useEffect } from "react";

export type PerformanceTier = "high" | "medium" | "low";

/**
 * Detect device performance tier for adaptive rendering.
 * Returns "low" on mobile/low-end devices, "high" on desktop with GPU.
 */
export function usePerformanceMode(): PerformanceTier {
  const [tier, setTier] = useState<PerformanceTier>("high");

  useEffect(() => {
    // Check device memory (Chrome-only)
    const nav = navigator as any;
    const deviceMemory = nav.deviceMemory;

    // Check hardware concurrency
    const cores = navigator.hardwareConcurrency || 4;

    // Check screen size as proxy for mobile
    const isMobile = window.innerWidth < 768;

    // Check if reduced motion is preferred
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || (deviceMemory && deviceMemory <= 2) || (isMobile && cores <= 4)) {
      setTier("low");
    } else if (isMobile || cores <= 4 || (deviceMemory && deviceMemory <= 4)) {
      setTier("medium");
    } else {
      setTier("high");
    }
  }, []);

  return tier;
}

/**
 * Get ocean scene parameters based on performance tier.
 */
export function getOceanParams(tier: PerformanceTier) {
  switch (tier) {
    case "low":
      return { segments: [60, 45], particleCount: 50, dpr: 1 };
    case "medium":
      return { segments: [120, 90], particleCount: 100, dpr: 1.25 };
    case "high":
    default:
      return { segments: [200, 150], particleCount: 150, dpr: 1.5 };
  }
}
