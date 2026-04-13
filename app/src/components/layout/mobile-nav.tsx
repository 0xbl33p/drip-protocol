"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/feed",
    label: "Feed",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/agents",
    label: "Agents",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M5.5 21a7.5 7.5 0 0 1 13 0" />
        <circle cx="12" cy="8" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/portfolio",
    label: "Portfolio",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 16l4-8 4 4 5-10" />
      </svg>
    ),
  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="glass-1 border-t border-white/[0.06] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const isActive =
              pathname.startsWith(item.href) ||
              (item.href === "/feed" && pathname.startsWith("/terminal"));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors",
                  isActive
                    ? "text-cyan"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  {item.icon}
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-3 rounded-full bg-cyan shadow-[0_0_6px_rgba(0,217,255,0.6)]" />
                  )}
                </div>
                <span className="text-[9px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
