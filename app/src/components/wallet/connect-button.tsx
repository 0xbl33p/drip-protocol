"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { GlassButton } from "@/components/glass";
import { useCallback } from "react";

export function ConnectButton() {
  const { publicKey, disconnect, connected, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  const handleClick = useCallback(() => {
    if (connected) {
      disconnect();
    } else {
      setVisible(true);
    }
  }, [connected, disconnect, setVisible]);

  const truncatedAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : null;

  if (connecting) {
    return (
      <GlassButton variant="cyan" size="sm" disabled>
        Connecting...
      </GlassButton>
    );
  }

  if (connected && truncatedAddress) {
    return (
      <GlassButton variant="default" size="sm" onClick={handleClick}>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
          <span className="font-mono text-xs">{truncatedAddress}</span>
        </span>
      </GlassButton>
    );
  }

  return (
    <GlassButton variant="cyan" size="sm" onClick={handleClick}>
      Connect Wallet
    </GlassButton>
  );
}
