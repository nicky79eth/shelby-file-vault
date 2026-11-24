import { ShelbyClient } from "@shelby-protocol/sdk/browser";
import {
  SHELBY_API_KEY,
  SHELBY_CHAIN_ID,
  SHELBY_RPC_URL,
  SHELBY_LOCATION_HINT,
  SHELBY_NETWORK,
} from "@/lib/shelby-network";

export const shelbyBrowserClient = new ShelbyClient({
  network: SHELBY_NETWORK,
  aptos: { chainId: SHELBY_CHAIN_ID },
  rpc: { baseUrl: SHELBY_RPC_URL },
  apiKey: SHELBY_API_KEY,
  locationHint: SHELBY_LOCATION_HINT,
});
