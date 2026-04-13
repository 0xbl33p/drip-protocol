"use client";

import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import type { TradeParams } from "@/types";
import { Side } from "@/types";

export type TradeStatus =
  | "idle"
  | "building"
  | "signing"
  | "confirming"
  | "confirmed"
  | "error";

interface TradeExecutionResult {
  status: TradeStatus;
  txSignature: string | null;
  error: string | null;
  execute: (params: TradeParams) => Promise<void>;
  reset: () => void;
}

/**
 * Hook for executing trades with full status tracking.
 *
 * In mock mode (no deployed program), simulates the flow with delays.
 * In live mode, builds and sends the Anchor transaction.
 */
export function useTradeExecution(): TradeExecutionResult {
  const [status, setStatus] = useState<TradeStatus>("idle");
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();

  const execute = useCallback(
    async (params: TradeParams) => {
      if (!publicKey) {
        setError("Wallet not connected");
        setStatus("error");
        return;
      }

      try {
        setStatus("building");
        setError(null);
        setTxSignature(null);

        // TODO: Replace with real Anchor instruction building when program is deployed.
        // For now, simulate the trade flow for UI development.

        // Simulate build delay
        await new Promise((r) => setTimeout(r, 500));

        setStatus("signing");

        // Simulate signing delay
        await new Promise((r) => setTimeout(r, 800));

        setStatus("confirming");

        // Simulate confirmation delay
        await new Promise((r) => setTimeout(r, 1200));

        // Generate a mock signature
        const mockSig = Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join("");

        setTxSignature(mockSig);
        setStatus("confirmed");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Transaction failed";
        setError(message);
        setStatus("error");
      }
    },
    [publicKey, connection, signTransaction]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setTxSignature(null);
    setError(null);
  }, []);

  return { status, txSignature, error, execute, reset };
}
