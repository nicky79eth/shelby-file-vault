"use client";

import { useEffect, useState } from "react";
import FileList from "@/components/FileList";
import UploadBox from "@/components/UploadBox";
import WalletButton from "@/components/WalletButton";
import type { StoredFile } from "@/types/file";

const STORAGE_KEY = "shelby-file-vault:v1";

export default function Home() {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [ready, setReady] = useState(false);

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
          <span className="brand-glyph">S</span>
          <span>Shelby <b>Vault</b></span>
        </a>
        <div className="nav-right">
          <a href="https://docs.shelby.xyz" target="_blank" rel="noreferrer">Docs ↗</a>
          <span className="network-chip"><span /> Testnet</span>
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
          {ready ? <FileList files={files} onRemove={removeFile} /> : <section className="panel loading">Opening your vault…</section>}
        </div>
      </div>

      <footer>
        <span>Built for Shelby · Infra / Tooling</span>
        <span>Open source MVP</span>
      </footer>
    </main>
  );
}
