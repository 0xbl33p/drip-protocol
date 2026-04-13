"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AgentCard } from "./agent-card";
import type { Agent } from "@/types";

interface AgentGridProps {
  agents: Agent[];
}

export function AgentGrid({ agents }: AgentGridProps) {
  return (
    <motion.div
      layout
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <AnimatePresence mode="popLayout">
        {agents.map((agent, i) => (
          <motion.div
            key={agent.id}
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
            <AgentCard agent={agent} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
