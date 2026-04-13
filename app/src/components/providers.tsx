"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { SolanaWalletProvider } from "@/components/wallet/wallet-provider";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5_000,
            refetchInterval: 10_000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SolanaWalletProvider>{children}</SolanaWalletProvider>
    </QueryClientProvider>
  );
}
