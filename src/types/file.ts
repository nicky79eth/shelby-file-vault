export type StoredFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  expiresAt?: string;
  blobName: string;
  ownerAddress?: string;
  transactionHash?: string;
  url?: string;
  provider: "demo" | "shelby";
  syncedFromShelby?: boolean;
};

export type UploadResponse = {
  success: true;
  file: Omit<StoredFile, "id" | "uploadedAt">;
};
