"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { formatBytes } from "@/lib/format";
import type { StoredFile, UploadResponse } from "@/types/file";

type Props = {
  onUploaded: (file: StoredFile) => void;
};

export default function UploadBox({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function choose(nextFile?: File) {
    if (!nextFile) return;
    setFile(nextFile);
    setError("");
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
    if (!file || uploading) return;

    setUploading(true);
    setError("");

    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body });
      const data = (await response.json()) as UploadResponse | { error?: string };

      if (!response.ok || !("success" in data)) {
        throw new Error("error" in data ? data.error : "Upload failed.");
      }

      onUploaded({
        ...data.file,
        id: crypto.randomUUID(),
        uploadedAt: new Date().toISOString(),
      });
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload failed.");
    } finally {
      setUploading(false);
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
          Testnet ready
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

      <button className="primary-button" onClick={upload} disabled={!file || uploading}>
        {uploading ? (
          <>
            <span className="spinner" /> Uploading…
          </>
        ) : (
          <>Upload to Shelby <span>↗</span></>
        )}
      </button>
      <p className="privacy-note">Demo mode saves metadata locally. Enable Shelby mode for decentralized storage.</p>
    </section>
  );
}
