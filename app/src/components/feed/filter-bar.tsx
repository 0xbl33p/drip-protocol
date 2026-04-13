"use client";

import { useState } from "react";
import { GlassButton } from "@/components/glass";

const filters = [
  { id: "all", label: "All Markets" },
  { id: "trending", label: "Trending" },
  { id: "narrative", label: "Narratives" },
  { id: "social", label: "Social" },
  { id: "influence", label: "Influence" },
  { id: "new", label: "New" },
  { id: "draining", label: "Draining" },
];

interface FilterBarProps {
  active: string;
  onFilterChange: (id: string) => void;
}

export function FilterBar({ active, onFilterChange }: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {filters.map((f) => (
        <GlassButton
          key={f.id}
          variant={active === f.id ? "cyan" : "ghost"}
          size="sm"
          onClick={() => onFilterChange(f.id)}
          className="whitespace-nowrap shrink-0"
        >
          {f.label}
        </GlassButton>
      ))}
    </div>
  );
}
