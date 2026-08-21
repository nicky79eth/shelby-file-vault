import { Network } from "@aptos-labs/ts-sdk";

export const SHELBY_NETWORK = Network.SHELBYNET;
export const SHELBY_NETWORK_NAME = "shelbynet";
export const SHELBY_LOCATION_HINT = "shelbynet-1";
export const SHELBY_EXPLORER_URL =
  `https://explorer.shelby.xyz/${SHELBY_NETWORK_NAME}`;
export const SHELBY_RPC_URL =
  `https://api.${SHELBY_NETWORK_NAME}.shelby.xyz/shelby`;

export const SHELBY_API_KEY =
  process.env.NEXT_PUBLIC_SHELBYNET_API_KEY ||
  process.env.NEXT_PUBLIC_SHELBY_API_KEY;

export function getShelbyExplorerBlobUrl(
  ownerAddress: string,
  blobName: string,
) {
  return (
    `${SHELBY_EXPLORER_URL}/blobs/${ownerAddress}` +
    `?blobName=${encodeURIComponent(blobName)}`
  );
}

export function getShelbyRawBlobUrl(
  ownerAddress: string,
  blobName: string,
) {
  const encodedName = blobName.split("/").map(encodeURIComponent).join("/");
  return `${SHELBY_RPC_URL}/v1/blobs/${ownerAddress}/${encodedName}`;
}
