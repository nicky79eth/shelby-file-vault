"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { ShelbyClientProvider } from "@shelby-protocol/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useState } from "react";
import {
  SHELBY_API_KEY,
  SHELBY_NETWORK,
  SHELBY_NETWORK_NAME,
} from "@/lib/shelby-network";
import { shelbyBrowserClient } from "@/lib/shelby-browser";

export default function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ShelbyClientProvider client={shelbyBrowserClient}>
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
            network: SHELBY_NETWORK,
            aptosApiKeys: {
              [SHELBY_NETWORK_NAME]: SHELBY_API_KEY,
            },
          }}
        >
          {children}
        </AptosWalletAdapterProvider>
      </ShelbyClientProvider>
    </QueryClientProvider>
  );
}
