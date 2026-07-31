"use client";

import { useState } from "react";
import { formatBytes, shortId } from "@/lib/format";
import type { StoredFile } from "@/types/file";

type Props = {
  files: StoredFile[];
  onRemove: (id: string) => void;
};

function FileIcon({ type }: { type: string }) {
  const label = type.includes("image")
    ? "IMG"
    : type.includes("pdf")
      ? "PDF"
      : type.includes("video")
        ? "VID"
        : "FILE";
  return <div className="file-icon">{label}</div>;
}

function getViewUrl(file: StoredFile): string | undefined {
  if (file.provider === "shelby" && file.ownerAddress) {
    return (
      `https://explorer.shelby.xyz/testnet/blobs/${file.ownerAddress}` +
      `?blobName=${encodeURIComponent(file.blobName)}`
    );
  }

  return file.url;
}

export default function FileList({ files, onRemove }: Props) {
  const [copied, setCopied] = useState("");

  async function copy(value: string, id: string) {
    await navigator.clipboard.writeText(value);
    setCopied(id);
    window.setTimeout(() => setCopied(""), 1600);
  }

  return (
    <section className="panel files-panel" aria-labelledby="files-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Your collection</span>
          <h2 id="files-title">My files</h2>
        </div>
        <span className="file-count">{files.length} {files.length === 1 ? "file" : "files"}</span>
      </div>

      {files.length === 0 ? (
        <div className="empty-state">
          <div className="empty-orbit">◇</div>
          <strong>Your vault is waiting.</strong>
          <p>Uploaded files will appear here with their Shelby blob name and retrieval link.</p>
        </div>
      ) : (
        <div className="file-list">
          {files.map((file) => (
            <article className="file-row" key={file.id}>
              <FileIcon type={file.type} />
              <div className="file-info">
                <div className="name-line">
                  <strong title={file.name}>{file.name}</strong>
                  <span className={`provider-badge ${file.provider}`}>
                    {file.provider === "shelby" ? "Shelby" : "Demo"}
                  </span>
                </div>
                <span>
                  {formatBytes(file.size)} · {new Date(file.uploadedAt).toLocaleDateString()}
                </span>
                <code title={file.blobName}>{shortId(file.blobName)}</code>
              </div>
              <div className="file-actions">
                {getViewUrl(file) ? (
                  <a className="small-button" href={getViewUrl(file)} target="_blank" rel="noreferrer">
                    View ↗
                  </a>
                ) : null}
                <button className="small-button" onClick={() => copy(file.blobName, file.id)}>
                  {copied === file.id ? "Copied!" : "Copy ID"}
                </button>
                <button className="icon-button danger" onClick={() => onRemove(file.id)} aria-label={`Remove ${file.name}`}>
                  ×
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
