"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { GlassButton } from "@/components/glass";
import { ConnectButton } from "@/components/wallet/connect-button";
import { useMockPositions } from "@/hooks/use-live-positions";
import { useGsapCounter } from "@/hooks/use-gsap-counter";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/feed", label: "Feed" },
  { href: "/agents", label: "Agents" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/docs", label: "SDK" },
];

function MiniPnl() {
  const { connected } = useWallet();
  const positions = useMockPositions();

  const totalPnl = positions.reduce((s, p) => s + p.unrealizedPnl, 0);
  const pnlRef = useGsapCounter(totalPnl, {
    decimals: 2,
    prefix: totalPnl >= 0 ? "+$" : "-$",
    duration: 0.4,
  });

  if (!connected || positions.length === 0) return null;

  return (
    <div className="hidden sm:flex items-center gap-1.5 glass-1 rounded-lg px-2.5 py-1.5">
      <div className="h-1.5 w-1.5 rounded-full bg-emerald shadow-[0_0_4px_rgba(16,185,129,0.6)]" />
      <span
        ref={pnlRef}
        className={cn(
          "font-mono text-xs font-medium",
          totalPnl >= 0 ? "text-emerald" : "text-coral"
        )}
      />
    </div>
  );
}

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass-1 border-b border-white/[0.06]">
        <div className="mx-auto flex h-16 max-w-[1800px] items-center justify-between px-6">
          {/* Logo */}
          <Link href="/feed" className="flex items-center gap-3">
            <div className="relative">
              <div className="h-8 w-8 rounded-lg bg-cyan/20 border border-cyan/30 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-cyan shadow-[0_0_12px_rgba(0,217,255,0.6)]" />
              </div>
            </div>
            <span className="font-heading text-xl font-bold tracking-tight text-foreground">
              drip
            </span>
          </Link>

          {/* Center nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <GlassButton
                  variant={pathname.startsWith(item.href) ? "cyan" : "ghost"}
                  size="sm"
                >
                  {item.label}
                </GlassButton>
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <MiniPnl />
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
