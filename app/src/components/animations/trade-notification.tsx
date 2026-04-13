"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

let addNotification: ((n: Omit<Notification, "id">) => void) | null = null;

/** Call this from anywhere to show a trade notification */
export function showTradeNotification(message: string, type: "success" | "error" | "info" = "success") {
  addNotification?.({ message, type });
}

export function TradeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const add = useCallback((n: Omit<Notification, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setNotifications((prev) => [...prev, { ...n, id }]);

    // Auto-dismiss after 5s
    setTimeout(() => {
      setNotifications((prev) => prev.filter((x) => x.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    addNotification = add;
    return () => { addNotification = null; };
  }, [add]);

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-[60] flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={cn(
              "glass-2 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer",
              n.type === "success" && "border-emerald/20",
              n.type === "error" && "border-coral/20",
              n.type === "info" && "border-cyan/20"
            )}
            onClick={() =>
              setNotifications((prev) => prev.filter((x) => x.id !== n.id))
            }
          >
            <div
              className={cn(
                "h-2 w-2 rounded-full shrink-0",
                n.type === "success" && "bg-emerald shadow-[0_0_6px_rgba(16,185,129,0.6)]",
                n.type === "error" && "bg-coral shadow-[0_0_6px_rgba(255,107,107,0.6)]",
                n.type === "info" && "bg-cyan shadow-[0_0_6px_rgba(0,217,255,0.6)]"
              )}
            />
            <span className="text-xs text-foreground">{n.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
