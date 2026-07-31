"use client";

import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

const HIDDEN_WALLETS = new Set([
  "Continue with Google",
  "Continue with Apple",
]);

function shorten(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function WalletButton() {
  const { account, connected, connect, disconnect, wallets } = useWallet();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const supportedWallets = wallets.filter(
    (wallet) => !HIDDEN_WALLETS.has(wallet.name),
  );

  if (connected && account) {
    const address = account.address.toString();
    return (
      <button
        className="wallet-button connected"
        onClick={() => void disconnect()}
      >
        <span className="wallet-dot" />
        {shorten(address)}
        <small>Disconnect</small>
      </button>
    );
  }

  async function connectWallet(name: string) {
    try {
      setError("");
      await connect(name);
      setOpen(false);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to connect wallet.",
      );
    }
  }

  return (
    <div className="wallet-menu">
      <button
        className="wallet-button"
        onClick={() => setOpen((value) => !value)}
      >
        Connect wallet
      </button>
      {open ? (
        <div className="wallet-popover">
          <strong>Select an Aptos wallet</strong>
          {supportedWallets.length ? (
            supportedWallets.map((wallet) => (
              <button
                key={wallet.name}
                onClick={() => void connectWallet(wallet.name)}
              >
                <span className="wallet-avatar" aria-hidden="true">
                  {wallet.icon ? (
                    // Wallet icons may be data URLs or extension-provided URLs.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={wallet.icon} alt="" />
                  ) : (
                    <span>{wallet.name.slice(0, 1).toUpperCase()}</span>
                  )}
                </span>
                <span>{wallet.name}</span>
                <small>{wallet.readyState}</small>
              </button>
            ))
          ) : (
            <p>
              No supported Aptos wallet detected. Install Petra, Nightly,
              Pontem, Backpack, or OKX Wallet, then refresh this page.
            </p>
          )}
          {error ? <p className="wallet-error">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
