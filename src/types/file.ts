export type StoredFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  blobName: string;
  ownerAddress?: string;
  transactionHash?: string;
  url?: string;
  provider: "demo" | "shelby";
};

export type UploadResponse = {
  success: true;
  file: Omit<StoredFile, "id" | "uploadedAt">;
};
