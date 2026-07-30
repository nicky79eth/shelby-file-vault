# Shelby File Vault

A polished, open-source file storage dApp starter for the Shelby Protocol. Users can upload a file, keep its metadata in their browser, copy the Shelby blob name, and open the retrieval URL after a real Shelby upload.

**Shelby application category:** `Infra / Tooling`

## What is included

- Next.js App Router, TypeScript, Tailwind CSS
- Drag-and-drop or file-picker upload
- File validation and a configurable size limit
- Browser `localStorage` metadata
- File list with copy, view, and remove actions
- Server-only API route (private keys never enter browser code)
- Demo provider that works without credentials
- Real Shelby Testnet provider using `@shelby-protocol/sdk`
- Responsive, accessible UI with loading and error states

> Demo mode validates the full app flow and returns generated blob metadata, but it does not persist file bytes. Set `UPLOAD_PROVIDER=shelby` to perform real uploads.

## Quick start

Requirements: Node.js 20.9 or newer and npm.

```bash
git clone https://github.com/nicky79eth/shelby-file-vault.git
cd shelby-file-vault
npm install
copy .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The default `UPLOAD_PROVIDER=demo` needs no API key or funded account.

## Enable real Shelby uploads

The server upload path follows Shelby's official Node SDK flow: create a `ShelbyNodeClient`, sign with an Aptos development account, upload bytes with a blob name and expiration, then return the owner and retrieval URL.

1. Use a dedicated Aptos **testnet development wallet**. Do not use a wallet that holds real assets.
2. Fund it with Aptos testnet APT for gas and the storage token required by Shelby.
3. Obtain a Shelby API key.
4. Copy `.env.example` to `.env.local`.
5. Set:

```dotenv
UPLOAD_PROVIDER=shelby
SHELBY_API_KEY=your_api_key
APTOS_PRIVATE_KEY=ed25519-priv-your_testnet_private_key
SHELBY_RETENTION_DAYS=30
MAX_FILE_SIZE_MB=10
```

6. Restart `npm run dev`, upload a small test file, then use **View** to retrieve it.

Secrets are read only inside `src/lib/shelby.ts`, which is imported by the Node.js API route. Never prefix a private value with `NEXT_PUBLIC_`.

## How it works

```text
Choose or drop a file
        ↓
POST multipart data to /api/upload
        ↓
Validate file and create a safe blob name
        ↓
Demo provider ─── or ─── ShelbyNodeClient upload
        ↓
Return metadata, owner and retrieval URL
        ↓
Save non-sensitive metadata in localStorage
```

Local removal only removes the dashboard entry; it does not delete an uploaded Shelby blob.

## Project structure

```text
src/
├── app/
│   ├── api/upload/route.ts    # validation and provider selection
│   ├── globals.css            # Tailwind plus the visual system
│   ├── layout.tsx
│   └── page.tsx               # dashboard and localStorage state
├── components/
│   ├── FileList.tsx
│   └── UploadBox.tsx
├── lib/
│   ├── format.ts
│   └── shelby.ts              # real server-side Shelby adapter
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
3. Keep `UPLOAD_PROVIDER=demo` for a public UI demo, or configure the Shelby testnet credentials.
4. Deploy and test a small upload.

Review your host's request body and function-duration limits before increasing `MAX_FILE_SIZE_MB`. A production release should replace a shared backend signer with wallet-based signing or another explicit custody model.

## Roadmap

- Aptos wallet adapter and user-signed uploads
- Query on-chain blob metadata by connected wallet
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

Shelby File Vault is a decentralized file management dApp that lets users upload, track, and retrieve digital assets through a clean web dashboard. The MVP provides file validation, locally persisted metadata, Shelby blob identifiers, and direct retrieval links, with a clear upgrade path to wallet-owned encrypted storage and permission-controlled sharing.

**How do you use Shelby?**

Shelby is the application's core storage layer. File bytes are uploaded through the Shelby TypeScript SDK, while the resulting owner address, blob name, and retrieval URL are returned to the dashboard. Browser storage holds only the user's local index of non-sensitive metadata. Future versions will let each user sign uploads with an Aptos wallet and discover their stored blobs from Shelby's on-chain metadata.

## Security notes

- `.env.local` and other environment files are ignored by Git.
- The private key is used only in the server runtime.
- The API rejects empty and oversized files.
- Filenames are normalized before becoming blob names.
- The included backend signer is intended for a testnet MVP, not multi-user production custody.

## References

- [Shelby TypeScript SDK](https://docs.shelby.xyz/sdks/typescript)
- [Shelby file upload guide](https://docs.shelby.xyz/sdks/typescript/node/guides/uploading-file)
- [Shelby React dApp example](https://docs.shelby.xyz/sdks/react/guides/dapp-example)

## License

MIT
