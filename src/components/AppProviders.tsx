"use client";

import { Network } from "@aptos-labs/ts-sdk";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useState } from "react";

export default function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AptosWalletAdapterProvider
        autoConnect
        optInWallets={[
          "Petra",
          "Nightly",
          "Pontem Wallet",
          "Backpack",
          "OKX Wallet",
        ]}
        dappConfig={{
          network: Network.TESTNET,
          aptosApiKeys: {
            testnet: process.env.NEXT_PUBLIC_SHELBY_API_KEY,
          },
        }}
      >
        {children}
      </AptosWalletAdapterProvider>
    </QueryClientProvider>
  );
}
