# Shelby File Vault

A polished, open-source file storage dApp for the Shelby Protocol. Users connect an Aptos wallet, sign their own upload transaction, discover blobs owned by their wallet, copy blob names, and open files in Shelby Explorer.

**Shelby application category:** `Infra / Tooling`
https://shelby-file-vault.vercel.app

## What is included

- Next.js App Router, TypeScript, Tailwind CSS
- Drag-and-drop or file-picker upload
- File validation and a configurable size limit
- Wallet-based Shelby blob discovery combined with browser metadata
- File list with copy, view, and remove actions
- Aptos wallet adapter with Petra and compatible wallets
- User-signed Shelby uploads through `@shelby-protocol/react`
- No backend signer or private key custody
- Responsive, accessible UI with loading and error states

> Uploads require a connected Aptos wallet, a Shelby Client API key, and the network assets required for storage and gas.

## Quick start

Requirements: Node.js 20.9 or newer and npm.

```bash
git clone https://github.com/nicky79eth/shelby-file-vault.git
cd shelby-file-vault
npm install
copy .env.example .env.local
npm run dev
```

Add your Shelby Client key to `.env.local`, then open [http://localhost:3000](http://localhost:3000).

## Enable real Shelby uploads

The upload path follows Shelby's official React SDK flow: the app requests a signature from the connected wallet, registers the blob commitment, uploads the bytes, and returns the owner and retrieval URL.

1. Install Petra or another Aptos wallet supported by the wallet adapter.
2. Select ShelbyNet and fund the wallet with ShelbyNet APT and ShelbyUSD.
3. Create a **Client** API key in Geomi and allow `http://localhost:3000`.
4. Copy `.env.example` to `.env.local`.
5. Set:

```dotenv
NEXT_PUBLIC_SHELBYNET_API_KEY=your_client_api_key
```

6. Restart `npm run dev`, upload a small test file, then use **View** to retrieve it.

The client key is restricted by allowed Web App URLs and is intended for frontend use. Never use a Server key or wallet private key in a `NEXT_PUBLIC_` variable.

## How it works

```text
Choose or drop a file
        ↓
Connect Petra and choose a file
        ↓
Create a safe blob name and encode bytes
        ↓
Request the transaction signature from Petra
        ↓
Upload with Shelby React SDK
        ↓
Save richer non-sensitive metadata in localStorage
        ↓
Sync the connected wallet's blob metadata from Shelby
```

Local removal only removes the dashboard entry; it does not delete an uploaded Shelby blob.

## Project structure

```text
src/
├── app/
│   ├── globals.css            # Tailwind plus the visual system
│   ├── layout.tsx
│   └── page.tsx               # dashboard and localStorage state
├── components/
│   ├── AppProviders.tsx
│   ├── FileList.tsx
│   ├── UploadBox.tsx
│   └── WalletButton.tsx
├── lib/
│   ├── format.ts
│   └── shelby-browser.ts      # browser Shelby client
└── types/file.ts
```

## Commands

```bash
npm run dev     # local development
npm run lint    # ESLint checks
npm run build   # production build
npm run start   # run the production build
```

## Deployment

Deploy to any Node-compatible Next.js host. For Vercel:

1. Import this repository.
2. Add the environment variables from `.env.example`.
3. Add `NEXT_PUBLIC_SHELBYNET_API_KEY` using your restricted Client key.
4. Deploy and test a small upload.

Add the deployed Vercel domain to the Client key's allowed Web App URLs, then redeploy. The app never receives the user's private key.

## Roadmap

- Encrypted client-side uploads
- Multi-file upload with progress
- Permission-controlled sharing
- Expiration renewal and on-chain delete

## Shelby application form

**Project name**

Shelby File Vault

**Category**

Infra / Tooling

**Project description**

Shelby File Vault is a decentralized file management dApp that lets users upload, discover, track, and retrieve digital assets through a clean web dashboard. The MVP provides wallet-signed uploads, connected-wallet blob discovery, locally enriched metadata, Shelby blob identifiers, search and direct Explorer links.

**How do you use Shelby?**

Shelby is the application's core storage layer. File bytes are uploaded through the Shelby React and TypeScript SDKs after the user signs with an Aptos wallet. The dashboard queries blob metadata associated with the connected wallet and combines it with non-sensitive local metadata such as the original MIME type. Users can search their collection and open each blob in Shelby Explorer.

## Security notes

- `.env.local` and other environment files are ignored by Git.
- No private key is stored or transmitted by the app.
- The API rejects empty and oversized files.
- Filenames are normalized before becoming blob names.
- Wallet signatures are requested by the installed wallet; the app never handles private keys.

## References

- [Shelby TypeScript SDK](https://docs.shelby.xyz/sdks/typescript)
- [Shelby file upload guide](https://docs.shelby.xyz/sdks/typescript/node/guides/uploading-file)
- [Shelby React dApp example](https://docs.shelby.xyz/sdks/react/guides/dapp-example)

## License

MIT
