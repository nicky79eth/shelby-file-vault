"use client";

import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

function shorten(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function WalletButton() {
  const { account, connected, connect, disconnect, wallets } = useWallet();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  if (connected && account) {
    const address = account.address.toString();
    return (
      <button className="wallet-button connected" onClick={() => void disconnect()}>
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
      setError(reason instanceof Error ? reason.message : "Unable to connect wallet.");
    }
  }

  return (
    <div className="wallet-menu">
      <button className="wallet-button" onClick={() => setOpen((value) => !value)}>
        Connect wallet
      </button>
      {open ? (
        <div className="wallet-popover">
          <strong>Select an Aptos wallet</strong>
          {wallets.length ? (
            wallets.map((wallet) => (
              <button key={wallet.name} onClick={() => void connectWallet(wallet.name)}>
                {wallet.icon ? <img src={wallet.icon} alt="" /> : null}
                <span>{wallet.name}</span>
                <small>{wallet.readyState}</small>
              </button>
            ))
          ) : (
            <p>
              No Aptos wallet detected. Install Petra, refresh this page, then
              try again.
            </p>
          )}
          {error ? <p className="wallet-error">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
