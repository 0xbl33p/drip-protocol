import { create } from "zustand";
import type { Account } from "@/types/engine";
import type { Position } from "@/types/market";

interface AccountState {
  /** Connected wallet pubkey */
  walletPubkey: string | null;

  /** User's Percolator account for the current market */
  account: Account | null;

  /** Derived positions across all markets */
  positions: Position[];

  /** Wallet SOL balance (lamports) */
  solBalance: bigint;

  /** Wallet USDC balance (atomic units, 6 decimals) */
  usdcBalance: bigint;

  /** Total deposited capital across all markets */
  depositedCapital: bigint;

  /** Whether account data is loading */
  isLoading: boolean;
}

interface AccountActions {
  setWallet: (pubkey: string | null) => void;
  setAccount: (account: Account | null) => void;
  setPositions: (positions: Position[]) => void;
  setSolBalance: (balance: bigint) => void;
  setUsdcBalance: (balance: bigint) => void;
  setDepositedCapital: (capital: bigint) => void;
  setLoading: (loading: boolean) => void;
  clearAccount: () => void;
}

export const useAccountStore = create<AccountState & AccountActions>(
  (set) => ({
    walletPubkey: null,
    account: null,
    positions: [],
    solBalance: 0n,
    usdcBalance: 0n,
    depositedCapital: 0n,
    isLoading: false,

    setWallet: (pubkey) => set({ walletPubkey: pubkey }),

    setAccount: (account) => set({ account }),

    setPositions: (positions) => set({ positions }),

    setSolBalance: (balance) => set({ solBalance: balance }),

    setUsdcBalance: (balance) => set({ usdcBalance: balance }),

    setDepositedCapital: (capital) => set({ depositedCapital: capital }),

    setLoading: (loading) => set({ isLoading: loading }),

    clearAccount: () =>
      set({
        walletPubkey: null,
        account: null,
        positions: [],
        solBalance: 0n,
        usdcBalance: 0n,
        depositedCapital: 0n,
        isLoading: false,
      }),
  })
);
