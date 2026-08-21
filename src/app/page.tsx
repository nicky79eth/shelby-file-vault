"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useAccountBlobs } from "@shelby-protocol/react";
import FileList from "@/components/FileList";
import UploadBox from "@/components/UploadBox";
import WalletButton from "@/components/WalletButton";
import { shelbyBrowserClient } from "@/lib/shelby-browser";
import { SHELBY_EXPLORER_URL } from "@/lib/shelby-network";
import type { StoredFile } from "@/types/file";

const STORAGE_KEY = "shelby-file-vault:v1";

export default function Home() {
  const { account, connected } = useWallet();
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [ready, setReady] = useState(false);
  const walletAddress = account?.address.toString();
  const accountBlobs = useAccountBlobs({
    client: shelbyBrowserClient,
    account: walletAddress ?? "0x0",
    enabled: Boolean(connected && walletAddress),
  });

  const displayedFiles = useMemo(() => {
    const localByBlob = new Map(
      files.map((file) => [
        `${file.ownerAddress?.toLowerCase()}:${file.blobName}`,
        file,
      ]),
    );
    const remoteBlobs =
      connected && walletAddress ? (accountBlobs.data ?? []) : [];
    const remoteFiles: StoredFile[] = remoteBlobs
      .filter((blob) => !blob.isDeleted)
      .map((blob) => {
        const ownerAddress = blob.owner.toString();
        const blobName = blob.blobNameSuffix;
        const local = localByBlob.get(
          `${ownerAddress.toLowerCase()}:${blobName}`,
        );
        const basename = blobName.split("/").pop() ?? blobName;

        return {
          id: local?.id ?? `shelby:${ownerAddress}:${blobName}`,
          name: local?.name ?? basename.replace(/^\d+-/, ""),
          size: blob.size,
          type: local?.type ?? inferMimeType(basename),
          uploadedAt:
            local?.uploadedAt ??
            new Date(blob.creationMicros / 1000).toISOString(),
          // Shelby SDK 0.8 no longer exposes expiration in account-list metadata.
          expiresAt: local?.expiresAt,
          blobName,
          ownerAddress,
          provider: "shelby",
          syncedFromShelby: !local,
        };
      });
    const remoteKeys = new Set(
      remoteFiles.map(
        (file) => `${file.ownerAddress?.toLowerCase()}:${file.blobName}`,
      ),
    );
    const localOnly = files.filter(
      (file) =>
        !remoteKeys.has(
          `${file.ownerAddress?.toLowerCase()}:${file.blobName}`,
        ),
    );

    return [...remoteFiles, ...localOnly].sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    );
  }, [accountBlobs.data, connected, files, walletAddress]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) setFiles(JSON.parse(saved) as StoredFile[]);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      } finally {
        setReady(true);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  function persist(next: StoredFile[]) {
    setFiles(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function addFile(file: StoredFile) {
    persist([file, ...files]);
  }

  function removeFile(id: string) {
    persist(files.filter((file) => file.id !== id));
  }

  return (
    <main>
      <nav className="nav-shell">
        <a className="brand" href="#" aria-label="Shelby File Vault home">
          <span className="brand-glyph" aria-hidden="true" />
          <span>Shelby File <b>Vault</b></span>
        </a>
        <div className="nav-right">
          <span className="network-chip"><span /> ShelbyNet</span>
          <WalletButton />
        </div>
      </nav>

      <div className="page-shell">
        <header className="hero">
          <div className="hero-copy">
            <span className="hero-label">DECENTRALIZED HOT STORAGE</span>
            <h1>Your files.<br /><em>Built to outlast.</em></h1>
            <p>
              Upload, track, and retrieve digital assets through Shelby&apos;s
              high-performance decentralized storage network.
            </p>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="orb orb-one" />
            <div className="orb orb-two" />
            <div className="vault-core">
              <span>◇</span>
              <small>VAULT</small>
            </div>
          </div>
        </header>

        <div className="stats-strip">
          <div><span>Storage</span><strong>Decentralized</strong></div>
          <div><span>Metadata</span><strong>Private to browser</strong></div>
          <div><span>Retrieval</span><strong>Direct &amp; verifiable</strong></div>
        </div>

        <div className="content-grid">
          <UploadBox onUploaded={addFile} />
          {ready ? (
            <FileList
              files={displayedFiles}
              onRemove={removeFile}
              syncing={accountBlobs.isLoading || accountBlobs.isFetching}
              syncError={accountBlobs.error?.message}
            />
          ) : (
            <section className="panel loading">Opening your vault…</section>
          )}
        </div>
      </div>

      <footer className="site-footer">
        <div>
          <strong>Shelby File Vault</strong>
          <span>Built for Shelby · Infra / Tooling · ShelbyNet</span>
        </div>
        <nav aria-label="Project links">
          <a href="https://github.com/nicky79eth/shelby-file-vault" target="_blank" rel="noreferrer">GitHub ↗</a>
          <a href={SHELBY_EXPLORER_URL} target="_blank" rel="noreferrer">Explorer ↗</a>
          <a href="https://docs.shelby.xyz" target="_blank" rel="noreferrer">Docs ↗</a>
        </nav>
        <p>ShelbyNet is a prototype network. Data may be reset and should not be treated as permanent production storage.</p>
      </footer>
    </main>
  );
}

function inferMimeType(name: string): string {
  const extension = name.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    mp4: "video/mp4",
    webm: "video/webm",
    pdf: "application/pdf",
    txt: "text/plain",
    json: "application/json",
  };

  return types[extension ?? ""] ?? "application/octet-stream";
}
