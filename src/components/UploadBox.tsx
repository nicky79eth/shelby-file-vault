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

const EXPIRATION_OPTIONS: ExpirationDays[] = [7, 30, 90, 365];
const DAY_MS = 24 * 60 * 60 * 1000;

type Props = {
  onUploaded: (file: StoredFile) => void;
};

export default function UploadBox({ onUploaded }: Props) {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingBlobName = useRef("");
  const pendingExpirationMicros = useRef(0);
  const [file, setFile] = useState<File | null>(null);
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
      if (!file || !account) return;

      const address = account.address.toString();
      const blobName = pendingBlobName.current;
      const explorerUrl = getShelbyExplorerBlobUrl(address, blobName);

      onUploaded({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        uploadedAt: new Date().toISOString(),
        expiresAt: new Date(pendingExpirationMicros.current / 1000).toISOString(),
        blobName,
        ownerAddress: address,
        url: explorerUrl,
        provider: "shelby",
      });
      setSuccess("Uploaded to Shelby. Your file is ready in the explorer.");
      setStage("complete");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    },
    onError: (reason) => {
      setError(friendlyUploadError(reason));
      setTechnicalError(reason.message);
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

  function choose(nextFile?: File) {
    if (!nextFile) return;
    setFile(nextFile);
    resetMessages();
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

    resetMessages();

    try {
      if (!connected || !account || !signAndSubmitTransaction) {
        throw new Error("Connect a supported Aptos wallet before uploading.");
      }

      if (file.size > 50 * 1024 * 1024) {
        throw new Error("File must be 50 MB or smaller.");
      }

      setStage("preparing");
      const blobName = `vault/${Date.now()}-${safeName(file.name)}`;
      pendingBlobName.current = blobName;
      const blobData = new Uint8Array(await file.arrayBuffer());
      const expirationMicros = (Date.now() + expirationDays * DAY_MS) * 1000;
      pendingExpirationMicros.current = expirationMicros;

      setStage("signing");
      uploadBlobs.mutate({
        signer: {
          account: account.address,
          signAndSubmitTransaction: async (transaction) => {
            const response = await signAndSubmitTransaction(transaction);
            setStage("confirming");
            return response;
          },
        },
        blobs: [{ blobName, blobData }],
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
          if (event.key === "Enter" || event.key === " ") {
            inputRef.current?.click();
          }
        }}
      >
        <input ref={inputRef} type="file" onChange={handleChange} hidden />
        <div className="upload-icon" aria-hidden="true">↑</div>
        <strong>Drop your file here</strong>
        <p>or click to browse · max 50 MB</p>
      </div>

      {file ? (
        <>
          <div className="selected-file">
            <div className="file-mark">
              {file.name.split(".").pop()?.slice(0, 4) || "FILE"}
            </div>
            <div className="selected-details">
              <strong>{file.name}</strong>
              <span>{formatBytes(file.size)} · Ready to upload</span>
            </div>
            <button
              className="icon-button"
              onClick={() => setFile(null)}
              aria-label="Remove file"
            >
              ×
            </button>
          </div>

          <fieldset className="expiration-picker" disabled={uploadBlobs.isPending}>
            <legend>File expiration</legend>
            <div className="expiration-options">
              {EXPIRATION_OPTIONS.map((days) => (
                <button
                  key={days}
                  type="button"
                  className={expirationDays === days ? "selected" : ""}
                  onClick={() => setExpirationDays(days)}
                  aria-pressed={expirationDays === days}
                >
                  {days}d
                </button>
              ))}
            </div>
            <p>Stored for {expirationDays} days after upload.</p>
          </fieldset>
        </>
      ) : null}

      {uploadBlobs.isPending || stage === "preparing" ? (
        <ol className="upload-progress" aria-label="Upload progress">
          <ProgressStep label="Prepare file" state={progressState(stage, "preparing")} />
          <ProgressStep label="Sign in wallet" state={progressState(stage, "signing")} />
          <ProgressStep label="Confirm & store" state={progressState(stage, "confirming")} />
        </ol>
      ) : null}

      {error ? (
        <div className="error-message">
          <strong>Upload failed</strong>
          <p>{error}</p>
          {technicalError ? (
            <>
              <button onClick={() => setShowDetails((value) => !value)}>
                {showDetails ? "Hide technical details" : "Show technical details"}
              </button>
              {showDetails ? <code>{technicalError}</code> : null}
            </>
          ) : null}
        </div>
      ) : null}
      {success ? <p className="success-message">{success}</p> : null}

      <button
        className="primary-button"
        onClick={upload}
        disabled={!file || uploadBlobs.isPending}
      >
        {uploadBlobs.isPending ? (
          <>
            <span className="spinner" /> Working with Shelby…
          </>
        ) : (
          <>
            {connected ? "Sign & upload to Shelby" : "Connect wallet to upload"}
            <span>↗</span>
          </>
        )}
      </button>
      <p className="privacy-note">
        Your Aptos wallet signs the transaction. Your private key never enters this app.
      </p>
    </section>
  );
}

function friendlyUploadError(error: Error): string {
  const message = error.message.toLowerCase();

  if (message.includes("reject") || message.includes("cancel")) {
    return "The wallet request was cancelled. Try again when you are ready to sign.";
  }
  if (message.includes("insufficient") || message.includes("balance")) {
    return "Your wallet may not have enough ShelbyNet funds for gas or storage.";
  }
  if (
    message.includes("unauthorized") ||
    message.includes("api key") ||
    message.includes("401")
  ) {
    return "Shelby could not authorize this app. Check the Client API key and allowed website URL.";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "The Shelby network could not be reached. Check your connection and try again.";
  }
  if (message.includes("10 mb") || message.includes("connect your")) {
    return error.message;
  }

  return "Check your wallet, ShelbyNet balance, and Shelby configuration, then try again.";
}

function progressState(
  current: UploadStage,
  step: Exclude<UploadStage, "idle" | "complete">,
): "done" | "active" | "pending" {
  const order: UploadStage[] = ["preparing", "signing", "confirming", "complete"];
  const currentIndex = order.indexOf(current);
  const stepIndex = order.indexOf(step);

  if (currentIndex > stepIndex) return "done";
  if (current === step) return "active";
  return "pending";
}

function ProgressStep({
  label,
  state,
}: {
  label: string;
  state: "done" | "active" | "pending";
}) {
  return (
    <li className={state}>
      <span>{state === "done" ? "✓" : state === "active" ? "•" : ""}</span>
      {label}
    </li>
  );
}
