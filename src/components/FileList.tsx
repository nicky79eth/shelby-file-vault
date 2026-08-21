"use client";

import { useState } from "react";
import { formatBytes, shortId } from "@/lib/format";
import {
  getShelbyExplorerBlobUrl,
  getShelbyRawBlobUrl,
} from "@/lib/shelby-network";
import type { StoredFile } from "@/types/file";

type Props = {
  files: StoredFile[];
  onRemove: (id: string) => void;
  syncing?: boolean;
  syncError?: string;
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

function getExplorerUrl(file: StoredFile): string | undefined {
  if (file.provider === "shelby" && file.ownerAddress) {
    return getShelbyExplorerBlobUrl(file.ownerAddress, file.blobName);
  }
  return file.url;
}

function getRawUrl(file: StoredFile): string | undefined {
  if (!file.ownerAddress) return undefined;
  return getShelbyRawBlobUrl(file.ownerAddress, file.blobName);
}

function shortAddress(address?: string) {
  if (!address) return "Unknown owner";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function ImagePreview({ file }: { file: StoredFile }) {
  const [failed, setFailed] = useState(false);
  const url = getRawUrl(file);

  if (!file.type.startsWith("image/") || !url || failed) {
    return <FileIcon type={file.type} />;
  }

  return (
    // Shelby raw blob URLs are dynamic and intentionally bypass Next image optimization.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="file-preview"
      src={url}
      alt=""
      onError={() => setFailed(true)}
    />
  );
}

export default function FileList({
  files,
  onRemove,
  syncing = false,
  syncError,
}: Props) {
  const [copied, setCopied] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const normalizedQuery = query.trim().toLowerCase();
  const filteredFiles = files.filter((file) => {
    const matchesQuery =
      !normalizedQuery ||
      file.name.toLowerCase().includes(normalizedQuery) ||
      file.blobName.toLowerCase().includes(normalizedQuery) ||
      file.ownerAddress?.toLowerCase().includes(normalizedQuery);
    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "image" && file.type.startsWith("image/")) ||
      (typeFilter === "video" && file.type.startsWith("video/")) ||
      (typeFilter === "document" &&
        !file.type.startsWith("image/") &&
        !file.type.startsWith("video/"));

    return matchesQuery && matchesType;
  });

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
        <div className="collection-status">
          {syncing ? <span className="sync-pill"><span className="spinner" /> Syncing</span> : null}
          <span className="file-count">
            {files.length} {files.length === 1 ? "file" : "files"}
          </span>
        </div>
      </div>

      {syncError ? (
        <p className="sync-warning">
          Shelby sync is temporarily unavailable. Local files are still shown.
        </p>
      ) : null}

      {files.length > 0 ? (
        <div className="file-search">
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search file, address or blob..."
            aria-label="Search files"
          />
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            aria-label="Filter file type"
          >
            <option value="all">All types</option>
            <option value="image">Images</option>
            <option value="document">Documents</option>
            <option value="video">Videos</option>
          </select>
          {query ? (
            <button
              className="clear-search"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              ×
            </button>
          ) : null}
        </div>
      ) : null}

      {files.length === 0 ? (
        <div className="empty-state">
          <div className="empty-orbit">◇</div>
          <strong>{syncing ? "Syncing your vault…" : "Your vault is waiting."}</strong>
          <p>
            Connect your wallet to discover existing Shelby blobs, or upload a
            new file to get started.
          </p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="no-results">
          <strong>No matching files.</strong>
          <p>Try another file name, wallet address, blob name, or file type.</p>
          <button onClick={() => { setQuery(""); setTypeFilter("all"); }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="file-list">
          {filteredFiles.map((file) => {
            const explorerUrl = getExplorerUrl(file);
            return (
              <article className="file-row" key={file.id}>
                <ImagePreview file={file} />
                <div className="file-info">
                  <div className="name-line">
                    <strong title={file.name}>{file.name}</strong>
                    <span className={`provider-badge ${file.provider}`}>
                      {file.syncedFromShelby ? "Synced" : "Shelby"}
                    </span>
                  </div>
                  <span>
                    {formatBytes(file.size)} ·{" "}
                    {new Date(file.uploadedAt).toLocaleDateString()}
                  </span>
                  <span className="file-owner" title={file.ownerAddress}>
                    Owner {shortAddress(file.ownerAddress)}
                    {file.expiresAt
                      ? ` · Expires ${new Date(file.expiresAt).toLocaleDateString()}`
                      : ""}
                  </span>
                  <code title={file.blobName}>{shortId(file.blobName)}</code>
                </div>
                <div className="file-actions">
                  {explorerUrl ? (
                    <a
                      className="small-button"
                      href={explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Explorer ↗
                    </a>
                  ) : null}
                  <button
                    className="small-button"
                    onClick={() => copy(file.blobName, file.id)}
                  >
                    {copied === file.id ? "Copied!" : "Copy blob"}
                  </button>
                  {!file.syncedFromShelby ? (
                    <button
                      className="icon-button danger"
                      onClick={() => onRemove(file.id)}
                      aria-label={`Remove ${file.name} from this browser`}
                      title="Remove local metadata"
                    >
                      ×
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
