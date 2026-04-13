import { clusterApiUrl } from "@solana/web3.js";

/** Drip program ID (from target/deploy/drip-keypair.json) */
export const DRIP_PROGRAM_ID = "5RcVjz4q7y4ZC5wtxBRTHHYHszMVYLY6Gsv5LYpk33X8";

/** Solana cluster configuration */
export const CLUSTER = (process.env.NEXT_PUBLIC_SOLANA_CLUSTER || "devnet") as
  | "devnet"
  | "mainnet-beta"
  | "testnet";

/** RPC endpoint */
export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(CLUSTER);

/** Commitment level */
export const COMMITMENT = "confirmed" as const;

/** USDC mint address (devnet) */
export const USDC_MINT_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

/** USDC mint address (mainnet) */
export const USDC_MINT_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

/** USDC mint for current cluster */
export const USDC_MINT =
  CLUSTER === "mainnet-beta" ? USDC_MINT_MAINNET : USDC_MINT_DEVNET;
