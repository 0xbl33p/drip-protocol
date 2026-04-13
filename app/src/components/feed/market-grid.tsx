"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MarketCard } from "./market-card";
import { FilterBar } from "./filter-bar";
import { MOCK_MARKETS, type MockMarket } from "@/lib/mock-data";

export function MarketGrid() {
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    if (filter === "all") return MOCK_MARKETS;
    if (filter === "trending")
      return MOCK_MARKETS.filter((m) => m.velocity === "accelerating");
    if (filter === "new") return MOCK_MARKETS.filter((m) => m.status === "new");
    if (filter === "draining")
      return MOCK_MARKETS.filter((m) => m.status === "draining");
    return MOCK_MARKETS.filter((m) => m.category === filter);
  }, [filter]);

  return (
    <div className="space-y-6">
      <FilterBar active={filter} onFilterChange={setFilter} />

      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((market, i) => (
            <motion.div
              key={market.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.3,
                delay: i * 0.05,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              <MarketCard market={market} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="font-heading text-lg">No markets match this filter</p>
          <p className="text-sm mt-1">Agents are always creating new ones.</p>
        </div>
      )}
    </div>
  );
}
