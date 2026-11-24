import { ShelbyClient } from "@shelby-protocol/sdk/browser";
import {
  SHELBY_API_KEY,
  SHELBY_RPC_URL,
  SHELBY_LOCATION_HINT,
  SHELBY_NETWORK,
} from "@/lib/shelby-network";

export const shelbyBrowserClient = new ShelbyClient({
  network: SHELBY_NETWORK,
  rpc: { baseUrl: SHELBY_RPC_URL },
  apiKey: SHELBY_API_KEY,
  locationHint: SHELBY_LOCATION_HINT,
});
