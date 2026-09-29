"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useUploadBlobs } from "@shelby-protocol/react";
import { formatBytes } from "@/lib/format";
import { shelbyBrowserClient } from "@/lib/shelby-browser";
import { getShelbyExplorerBlobUrl } from "@/lib/shelby-network";
import type { StoredFile } from "@/types/file";

type UploadStage = "idle" | "preparing" | "signing" | "confirming" | "complete";
type ExpirationDays = 7 | 30 | 90 | 365;
type PendingFile = { id: string; file: File; name: string; status: "pending" | "uploading" | "done" };

const EXPIRATION_OPTIONS: ExpirationDays[] = [7, 30, 90, 365];
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_FILE_SIZE = 50 * 1024 * 1024;

type Props = {
  onUploaded: (file: StoredFile) => void;
};

export default function UploadBox({ onUploaded }: Props) {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingUpload = useRef<PendingFile[]>([]);
  const pendingBlobNames = useRef<string[]>([]);
  const pendingExpirationMicros = useRef(0);
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [expirationDays, setExpirationDays] = useState<ExpirationDays>(30);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [technicalError, setTechnicalError] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [success, setSuccess] = useState("");
  const [stage, setStage] = useState<UploadStage>("idle");

  const uploadBlobs = useUploadBlobs({
    client: shelbyBrowserClient,
    onSuccess: () => {
      if (!account || pendingUpload.current.length === 0) return;

      const address = account.address.toString();
      const expiresAt = new Date(pendingExpirationMicros.current / 1000).toISOString();

      pendingUpload.current.forEach((item, index) => {
        const blobName = pendingBlobNames.current[index];
        if (!blobName) return;

        onUploaded({
          id: crypto.randomUUID(),
          name: item.name,
          size: item.file.size,
          type: item.file.type || "application/octet-stream",
          uploadedAt: new Date().toISOString(),
          expiresAt,
          blobName,
          ownerAddress: address,
          url: getShelbyExplorerBlobUrl(address, blobName),
          provider: "shelby",
        });
      });

      setSuccess(
        pendingUpload.current.length === 1
          ? "Uploaded to Shelby. Your file is ready in the explorer."
          : `${pendingUpload.current.length} files uploaded to Shelby successfully.`,
      );
      setStage("complete");
      setFiles([]);
      pendingUpload.current = [];
      pendingBlobNames.current = [];
      if (inputRef.current) inputRef.current.value = "";
    },
    onError: (reason) => {
      const uploadError = reason instanceof Error ? reason : new Error("Upload failed.");
      setError(friendlyUploadError(uploadError));
      setTechnicalError(uploadError.message);
      setFiles((current) => current.map((item) => ({ ...item, status: "pending" })));
      setStage("idle");
    },
  });

  function safeName(name: string) {
    return (
      name
        .normalize("NFKD")
        .replace(/[^\w.\-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 120) || "file"
    );
  }

  function resetMessages() {
    setError("");
    setTechnicalError("");
    setShowDetails(false);
    setSuccess("");
    setStage("idle");
  }

  function addFiles(nextFiles: File[]) {
    const validFiles = nextFiles.filter((file) => file.size <= MAX_FILE_SIZE);

    if (validFiles.length === 0) {
      setError("Each file must be 50 MB or smaller.");
      return;
    }

    if (validFiles.length !== nextFiles.length) {
      setError("Some files were skipped because they are larger than 50 MB.");
    } else {
      resetMessages();
    }

    setFiles((current) => [
      ...current,
      ...validFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        status: "pending" as const,
      })),
    ]);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  }

  function updateFileName(id: string, name: string) {
    setFiles((current) =>
      current.map((item) => (item.id === id ? { ...item, name } : item)),
    );
  }

  function removeFile(id: string) {
    setFiles((current) => current.filter((item) => item.id !== id));
  }

  async function upload() {
    if (files.length === 0 || uploadBlobs.isPending) return;

    resetMessages();

    try {
      if (!connected || !account || !signAndSubmitTransaction) {
        throw new Error("Connect a supported Aptos wallet before uploading.");
      }

      const invalidName = files.find((item) => !item.name.trim());
      if (invalidName) {
        throw new Error("Please enter a file name for every selected file.");
      }

      if (files.some((item) => item.file.size > MAX_FILE_SIZE)) {
        throw new Error("Each file must be 50 MB or smaller.");
      }

      setStage("preparing");
      const timestamp = Date.now();
      const uploadItems = files.map((item, index) => ({
        ...item,
        blobName: `vault/${timestamp}-${index}-${safeName(item.name.trim())}`,
      }));
      const expirationMicros = (Date.now() + expirationDays * DAY_MS) * 1000;

      pendingUpload.current = uploadItems;
      pendingBlobNames.current = uploadItems.map((item) => item.blobName);
      pendingExpirationMicros.current = expirationMicros;

      const blobs = await Promise.all(
        uploadItems.map(async (item) => ({
          blobName: item.blobName,
          blobData: new Uint8Array(await item.file.arrayBuffer()),
        })),
      );

      setStage("signing");
      setFiles((current) => current.map((item) => ({ ...item, status: "uploading" })));
      await uploadBlobs.mutateAsync({
        signer: {
          account: account.address,
          signAndSubmitTransaction: async (transaction) => {
            setStage("signing");
            try {
              const response = await signAndSubmitTransaction(transaction);
              setStage("confirming");
              return response;
            } catch (reason) {
              const walletError =
                reason instanceof Error
                  ? reason
                  : new Error("Wallet signature was rejected.");
              setTechnicalError(walletError.message);
              throw walletError;
            }
          },
        },
        blobs,
        expirationMicros,
      });
    } catch (reason) {
      const uploadError =
        reason instanceof Error ? reason : new Error("Upload failed.");
      setError(friendlyUploadError(uploadError));
      setTechnicalError(uploadError.message);
      setStage("idle");
    }
  }

  const completedCount = stage === "complete" ? files.length : 0;
  const totalCount = files.length;
  const progressPercent = totalCount > 0 && stage === "complete" ? 100 : stage === "confirming" ? 90 : stage === "signing" ? 55 : stage === "preparing" ? 20 : 0;

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
        <input ref={inputRef} type="file" onChange={handleChange} hidden multiple />
        <div className="upload-icon" aria-hidden="true">↑</div>
        <strong>Drop your files here</strong>
        <p>or click to browse · multiple files · max 50 MB each</p>
      </div>

      {files.length > 0 ? (
        <>
          <div className="selected-files-heading">
            <strong>{files.length} {files.length === 1 ? "file" : "files"} selected</strong>
            <button
              type="button"
              className="add-more-button"
              onClick={() => inputRef.current?.click()}
              disabled={uploadBlobs.isPending}
            >
              + Add more files
            </button>
          </div>

          <div className="selected-files-list">
            {files.map((item, index) => (
              <div className={`selected-file upload-file-item ${item.status}`} key={item.id}>
                <div className="file-mark">{item.name.split(".").pop()?.slice(0, 4) || "FILE"}</div>
                <div className="selected-details">
                  <label className="file-name-label" htmlFor={`upload-file-name-${item.id}`}>
                    File {index + 1} name
                  </label>
                  <input
                    id={`upload-file-name-${item.id}`}
                    className="file-name-input"
                    value={item.name}
                    onChange={(event) => updateFileName(item.id, event.target.value)}
                    disabled={uploadBlobs.isPending}
                    maxLength={120}
                    spellCheck={false}
                    aria-label={`File ${index + 1} name`}
                  />
                  <div className="file-upload-status">
                    <span>{formatBytes(item.file.size)}</span>
                    <span className="status-dot" />
                    <span>{item.status === "uploading" ? "Uploading…" : item.status === "done" ? "Uploaded" : "Ready"}</span>
                  </div>
                </div>
                <button
                  className="icon-button"
                  onClick={() => removeFile(item.id)}
                  disabled={uploadBlobs.isPending}
                  aria-label={`Remove ${item.name}`}
                >
                  {item.status === "done" ? "✓" : "×"}
                </button>
              </div>
            ))}
          </div>

          {uploadBlobs.isPending || stage === "preparing" || stage === "complete" ? (
            <div className="overall-progress" aria-label="Overall upload progress">
              <div className="overall-progress-top">
                <strong>{stage === "complete" ? "Upload complete" : stage === "confirming" ? "Storing files on Shelby" : stage === "signing" ? "Uploading files" : "Preparing files"}</strong>
                <span>{stage === "complete" ? totalCount : `${progressPercent}%`}</span>
              </div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${progressPercent}%` }} /></div>
              <p>{stage === "complete" ? `${completedCount} of ${totalCount} files uploaded successfully.` : `Processing ${totalCount} ${totalCount === 1 ? "file" : "files"}…`}</p>
            </div>
          ) : null}

          <fieldset className="expiration-picker" disabled={uploadBlobs.isPending}>
            <legend>File expiration</legend>
            <div className="expiration-options">
              {EXPIRATION_OPTIONS.map((days) => (
                <button key={days} type="button" className={expirationDays === days ? "selected" : ""} onClick={() => setExpirationDays(days)} aria-pressed={expirationDays === days}>{days}d</button>
              ))}
            </div>
            <p>Stored for {expirationDays} days after upload.</p>
          </fieldset>
        </>
      ) : null}

      {uploadBlobs.isPending || stage === "preparing" ? (
        <ol className="upload-progress" aria-label="Upload progress">
          <ProgressStep label="Prepare files" state={progressState(stage, "preparing")} />
          <ProgressStep label="Sign in wallet" state={progressState(stage, "signing")} />
          <ProgressStep label="Confirm & store" state={progressState(stage, "confirming")} />
        </ol>
      ) : null}

      {error ? (
        <div className="error-message">
          <strong>Upload failed</strong><p>{error}</p>
          {technicalError ? <><button onClick={() => setShowDetails((value) => !value)}>{showDetails ? "Hide technical details" : "Show technical details"}</button>{showDetails ? <code>{technicalError}</code> : null}</> : null}
        </div>
      ) : null}
      {success ? <p className="success-message">{success}</p> : null}

      <button className="primary-button" onClick={upload} disabled={files.length === 0 || files.some((item) => !item.name.trim()) || uploadBlobs.isPending}>
        {uploadBlobs.isPending ? <><span className="spinner" /> Uploading {files.length} {files.length === 1 ? "file" : "files"}…</> : <>{connected ? `Sign & upload ${files.length || ""} ${files.length === 1 ? "file" : "files"} to Shelby` : "Connect wallet to upload"}<span>↗</span></>}
      </button>
      <p className="privacy-note">Your Aptos wallet signs the transaction. Your private key never enters this app.</p>
    </section>
  );
}

function friendlyUploadError(error: Error): string {
  const message = error.message.toLowerCase();
  if (message.includes("reject") || message.includes("cancel")) return "The wallet request was cancelled. Try again when you are ready to sign.";
  if (message.includes("insufficient") || message.includes("balance")) return "Your wallet may not have enough ShelbyNet funds for gas or storage.";
  if (message.includes("unauthorized") || message.includes("api key") || message.includes("401")) return "Shelby could not authorize this app. Check the Client API key and allowed website URL.";
  if (message.includes("network") || message.includes("fetch")) return "The Shelby network could not be reached. Check your connection and try again.";
  if (message.includes("10 mb") || message.includes("connect your")) return error.message;
  return "Check your wallet, ShelbyNet balance, and Shelby configuration, then try again.";
}

function progressState(current: UploadStage, step: Exclude<UploadStage, "idle" | "complete">): "done" | "active" | "pending" {
  const order: UploadStage[] = ["preparing", "signing", "confirming", "complete"];
  const currentIndex = order.indexOf(current);
  const stepIndex = order.indexOf(step);
  if (currentIndex > stepIndex) return "done";
  if (current === step) return "active";
  return "pending";
}

function ProgressStep({ label, state }: { label: string; state: "done" | "active" | "pending" }) {
  return <li className={state}><span>{state === "done" ? "✓" : state === "active" ? "•" : ""}</span>{label}</li>;
}
