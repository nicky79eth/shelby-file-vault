import {
  Account,
  Ed25519PrivateKey,
  Network,
} from "@aptos-labs/ts-sdk";
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";

function requiredEnvironment(name: "SHELBY_API_KEY" | "APTOS_PRIVATE_KEY"): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required when UPLOAD_PROVIDER=shelby.`);
  }

  return value;
}

export async function uploadToShelby(input: {
  bytes: Uint8Array;
  blobName: string;
}) {
  const apiKey = requiredEnvironment("SHELBY_API_KEY");
  const privateKey = new Ed25519PrivateKey(
    requiredEnvironment("APTOS_PRIVATE_KEY"),
  );
  const signer = Account.fromPrivateKey({ privateKey });
  const client = new ShelbyNodeClient({
    network: Network.TESTNET,
    apiKey,
  });
  const retentionDays = Math.max(
    1,
    Number(process.env.SHELBY_RETENTION_DAYS ?? 30),
  );
  const expirationMicros =
    (Date.now() + retentionDays * 24 * 60 * 60 * 1000) * 1000;

  await client.upload({
    signer,
    blobData: input.bytes,
    blobName: input.blobName,
    expirationMicros,
  });

  const ownerAddress = signer.accountAddress.toString();
  const encodedName = input.blobName
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  return {
    ownerAddress,
    url: `https://api.testnet.shelby.xyz/shelby/v1/blobs/${ownerAddress}/${encodedName}`,
  };
}
