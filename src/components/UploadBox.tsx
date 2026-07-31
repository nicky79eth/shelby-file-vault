"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useUploadBlobs } from "@shelby-protocol/react";
import { formatBytes } from "@/lib/format";
import { shelbyBrowserClient } from "@/lib/shelby-browser";
import type { StoredFile } from "@/types/file";

type Props = {
  onUploaded: (file: StoredFile) => void;
};

export default function UploadBox({ onUploaded }: Props) {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingBlobName = useRef("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const uploadBlobs = useUploadBlobs({
    client: shelbyBrowserClient,
    onSuccess: () => {
      if (!file || !account) return;

      const address = account.address.toString();
      const blobName = pendingBlobName.current;
      const explorerUrl =
        `https://explorer.shelby.xyz/testnet/blobs/${address}` +
        `?blobName=${encodeURIComponent(blobName)}`;

      onUploaded({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        uploadedAt: new Date().toISOString(),
        blobName,
        ownerAddress: address,
        url: explorerUrl,
        provider: "shelby",
      });
      setSuccess("Uploaded to Shelby. Your wallet signed the transaction.");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    },
    onError: (reason) => {
      setError(reason.message || "Shelby upload failed.");
    },
  });

  function safeName(name: string) {
    return name
      .normalize("NFKD")
      .replace(/[^\w.\-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120) || "file";
  }

  function choose(nextFile?: File) {
    if (!nextFile) return;
    setFile(nextFile);
    setError("");
    setSuccess("");
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    choose(event.target.files?.[0]);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    choose(event.dataTransfer.files?.[0]);
  }

  async function upload() {
    if (!file || uploadBlobs.isPending) return;

    setError("");
    setSuccess("");

    try {
      if (!connected || !account || !signAndSubmitTransaction) {
        throw new Error("Connect your Petra wallet before uploading.");
      }

      const maxBytes = 10 * 1024 * 1024;
      if (file.size > maxBytes) {
        throw new Error("File must be smaller than 10 MB.");
      }

      const blobName = `vault/${Date.now()}-${safeName(file.name)}`;
      pendingBlobName.current = blobName;
      const blobData = new Uint8Array(await file.arrayBuffer());
      const expirationMicros =
        (Date.now() + 30 * 24 * 60 * 60 * 1000) * 1000;

      uploadBlobs.mutate({
        signer: {
          account: account.address,
          signAndSubmitTransaction,
        },
        blobs: [{ blobName, blobData }],
        expirationMicros,
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload failed.");
    }
  }

  return (
    <section className="panel upload-panel" aria-labelledby="upload-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">New upload</span>
          <h2 id="upload-title">Store something worth keeping.</h2>
        </div>
        <span className="secure-pill">
          <span className="pulse" />
          {connected ? "Wallet connected" : "Wallet required"}
        </span>
      </div>

      <div
        className={`drop-zone ${dragging ? "is-dragging" : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
      >
        <input ref={inputRef} type="file" onChange={handleChange} hidden />
        <div className="upload-icon" aria-hidden="true">
          ↑
        </div>
        <strong>Drop your file here</strong>
        <p>or click to browse · max 10 MB</p>
      </div>

      {file ? (
        <div className="selected-file">
          <div className="file-mark">{file.name.split(".").pop()?.slice(0, 4) || "FILE"}</div>
          <div className="selected-details">
            <strong>{file.name}</strong>
            <span>{formatBytes(file.size)} · Ready to upload</span>
          </div>
          <button className="icon-button" onClick={() => setFile(null)} aria-label="Remove file">
            ×
          </button>
        </div>
      ) : null}

      {error ? <p className="error-message">{error}</p> : null}
      {success ? <p className="success-message">{success}</p> : null}

      <button className="primary-button" onClick={upload} disabled={!file || uploadBlobs.isPending}>
        {uploadBlobs.isPending ? (
          <>
            <span className="spinner" /> Uploading…
          </>
        ) : (
          <>{connected ? "Sign & upload to Shelby" : "Connect wallet to upload"} <span>↗</span></>
        )}
      </button>
      <p className="privacy-note">Petra signs the transaction. Your private key never enters this app.</p>
    </section>
  );
}
