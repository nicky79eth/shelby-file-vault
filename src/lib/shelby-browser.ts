import { ShelbyClient } from "@shelby-protocol/sdk/browser";
import {
  SHELBY_API_KEY,
  SHELBY_LOCATION_HINT,
  SHELBY_NETWORK,
} from "@/lib/shelby-network";

export const shelbyBrowserClient = new ShelbyClient({
  network: SHELBY_NETWORK,
  apiKey: SHELBY_API_KEY,
  locationHint: SHELBY_LOCATION_HINT,
});
