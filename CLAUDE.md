# vdr-core SDK: Claude Guidelines

## Build & Test Commands

*   **Type Checking:** `npx tsc --noEmit` (Run before resolving any task)
*   **Run All Tests:** `npx jest`
*   **Run Specific Test:** `npx jest tests/hash/hashDocument.test.ts`
*   **Coverage:** `npm run test:coverage`
*   **Full Build:** `npm run build` (compiles to `dist/`)

## Project Architecture & Structure

*   **`src/index.ts`:** Public barrel file. Every consumer-facing symbol is re-exported here. Changing exports is a **breaking change**.
*   **`src/hash/`:** Client-side SHA-256 hashing. `hashDocument` (Buffer), `hashFile` (path), `hashFileStream` (streaming 64KB blocks), `hashBase64`, `hashDocumentBrowser` (SubtleCrypto). Raw files **never leave the machine** — only 64-char hex digests.
*   **`src/anchor/`:** Direct Solana anchoring. `anchorToSolana` writes a hash on-chain via PDA seeds `["anchor", hash]`. `anchorBatch` handles concurrent multi-document writes. Constants: `SIPHERON_PROGRAM_ID`, `PROTOCOL_VERSION`, `MAX_BATCH_SIZE`.
*   **`src/verify/`:** `verifyOnChain` reads the PDA account data. `verifyLocally` does constant-time hex comparison. `VerificationCache` provides TTL-based caching for repeated lookups.
*   **`src/client/`:** `SipHeron` class — hosted API wrapper (requires API key). `withRetry` for exponential backoff. `RPCPool` for multi-endpoint failover. `AnchorMonitor` for real-time status polling.
*   **`src/errors/`:** Typed hierarchy rooted at `SipHeronError`. Includes `NetworkError`, `HashMismatchError`, `AnchorNotFoundError`, `RateLimitError`, `TransactionError`, etc.
*   **`src/webhook/`:** `parseWebhookEvent` validates HMAC-SHA256 signatures using `crypto.timingSafeEqual` (constant-time). Never replace with `===`.
*   **`src/certificate/`:** Certificate ID generation and PDF certificate data preparation.
*   **`src/report/`:** `generatePdfReport` using `pdf-lib` for audit-ready PDF evidence packages.
*   **`src/schema/`:** JSON metadata validation with pre-built schemas (`LEGAL_CONTRACT_SCHEMA`, `CLINICAL_TRIAL_SCHEMA`).
*   **`src/pipeline/`:** `PipelineModule` integration point consumed by `@sipheron/vdr-pipeline`.

## Core Engineering Principles

1.  **Zero-Knowledge Guarantee:** vdr-core exists to ensure raw document content is **never** transmitted over any network. Only SHA-256 hex digests (64 characters) are sent to Solana or the SipHeron API. This is a non-negotiable invariant.
2.  **Dual-Mode Architecture:** Every anchoring/verification operation supports two paths — **Direct** (own Solana keypair, no API key) and **Hosted** (SipHeron API key). Both share the same underlying cryptographic logic.
3.  **Downstream Foundation:** `vdr-pipeline` and `vdr-cli` depend on this package. **Never** re-implement hashing, PDA derivation, or Solana transaction logic in downstream packages — always import from `vdr-core`.
4.  **Immutability + Soft Revocation:** Blockchain anchors cannot be deleted. Revocation is a registry flag (`status: 'revoked'`) with `supersededByAnchorId` for compliance traceability.

## Style & Writing Guidelines

*   **TypeScript strict mode is maximal:** `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch` are **all enabled**. Code must compile cleanly under every flag.
*   **tsconfig excludes `tests/`:** Test files must explicitly import Jest globals — `import { describe, it, expect } from '@jest/globals';` — to avoid red-lines.
*   **Native Node APIs only:** Use `crypto.randomUUID()` not `uuid`. Use `import * as crypto from 'crypto'` not default import.
*   **Solana keypair format:** `solanaSecretKey` is always `Uint8Array(64)` for Ed25519. Use `Keypair.fromSecretKey()`.
*   **Async mock typing:** When mocking async functions, type explicitly — `jest.fn<() => Promise<any>>()` — to prevent TS inferring `never`.

## Error Handling

*   Never throw generic `Error("string")` in operational code paths.
*   Always use or extend the typed error hierarchy from `src/errors/`.
*   Network requests (Solana RPC, SipHeron API) must catch failures and embed retry-attempt breakdowns into the error's `context` parameter for deep observability.
*   Webhook validation failures must throw `AuthenticationError`, not generic errors.

## Key Constants

| Constant | Location | Purpose |
|---|---|---|
| `SIPHERON_PROGRAM_ID` | `src/anchor/` | On-chain program address |
| `ANCHOR_SEED` | `src/anchor/` | PDA derivation prefix (`"anchor"`) |
| `PROTOCOL_VERSION` | `src/anchor/` | Wire protocol version |
| `MAX_BATCH_SIZE` | `src/anchor/` | Maximum documents per batch anchor |
| `HASH_LENGTH` | `src/anchor/` | Expected hex digest length (64) |
| `CONFIRMATION_DEPTH` | `src/anchor/` | Solana confirmation commitment level |
