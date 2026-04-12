# @sipheron/vdr-core — Agent Instructions

> Canonical AI-agent playbook for the **VDR-Core** SDK.
> Any AI coding assistant working in this package MUST read this file first.

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Package** | `@sipheron/vdr-core` |
| **Version** | `1.0.0` (stable) |
| **License** | Apache-2.0 |
| **Runtime** | Node ≥ 16, Browser (via `@sipheron/vdr-core/browser`) |
| **Language** | TypeScript 5, compiled to CommonJS ES2020 |
| **Blockchain** | Solana (via `@solana/web3.js ^1.98`, `@coral-xyz/anchor ^0.32`) |

## 2. Build & Test Commands

```bash
# Type-check only (no emit)
npx tsc --noEmit

# Full build → dist/
npm run build

# Run entire test suite
npm test

# Run a single test file
npx jest tests/hash/hashDocument.test.ts

# Watch mode during development
npm run test:watch

# Coverage report → coverage/
npm run test:coverage
```

> **Always run `npx tsc --noEmit` before considering any task complete.**

## 3. Architecture & Module Map

```
src/
├── index.ts            # Public barrel — every export consumers see
├── anchor/             # Direct on-chain anchoring (anchorToSolana, anchorBatch)
├── certificate/        # PDF certificate generation & certificate IDs
├── client/             # SipHeron hosted client, retry logic, RPC pool, AnchorMonitor
├── errors/             # Typed error hierarchy (SipHeronError base class)
├── hash/               # SHA-256 hashing: document, file, stream, base64, browser
├── pipeline/           # PipelineModule for vdr-pipeline integration
├── report/             # PDF report generation (pdf-lib)
├── schema/             # JSON metadata validation (legal, clinical schemas)
├── types/              # All TypeScript interfaces & type definitions
├── verify/             # On-chain verification, local verification, verification cache
└── webhook/            # Webhook signature verification (HMAC-SHA256)
```

### Dual Operating Modes

| Mode | Entry Points | Auth Required |
|---|---|---|
| **Direct** | `hashDocument`, `anchorToSolana`, `verifyOnChain`, `deriveAnchorAddress` | None (use own Solana keypair) |
| **Hosted** | `new SipHeron({ apiKey })` → `.anchor()`, `.verify()`, `.list()` | API Key |

### Critical Dependency Chain

`vdr-pipeline` → **`vdr-core`** → `@solana/web3.js` + `@coral-xyz/anchor`

`vdr-core` is the **cryptographic foundation**. All hashing, anchoring, and verification primitives originate here. Downstream SDKs (`vdr-pipeline`, `vdr-cli`) depend on it — never duplicate its logic.

## 4. Coding Conventions

### TypeScript Strictness
The `tsconfig.json` enables **every strict flag**: `strictNullChecks`, `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`. All code must pass under these constraints.

### Error Handling
- **Never** throw raw `Error("message")` in operational code paths.
- Always use or extend the typed hierarchy in `src/errors/` (e.g., `SipHeronError`, `NetworkError`, `HashMismatchError`).
- Network calls must include retry context in the error's `context` property for observability.

### Hashing Invariants
- Raw files **must never** be transmitted unhashed. Only SHA-256 hex digests (64 chars) leave the local environment.
- Use `crypto.createHash('sha256')` on Node, `SubtleCrypto` in the browser.
- Large files use streaming via `hashFileStream()` with 64 KB pipeline blocks to avoid RAM overflow.

### Solana / Anchor Patterns
- PDAs are derived with seeds `["anchor", Buffer.from(hash)]` — this ensures one unique anchor per hash per program.
- `solanaSecretKey` must be `Uint8Array(64)` for Ed25519 keypair creation (`Keypair.fromSecretKey`).
- The program ID constant is `SIPHERON_PROGRAM_ID` exported from `src/anchor/`.

### Import Style
```typescript
// ✅ Correct: use Node built-in crypto
import * as crypto from 'crypto';

// ❌ Wrong: do not install uuid — use crypto.randomUUID()
import { v4 as uuidv4 } from 'uuid';
```

### Test Conventions
- `tsconfig.json` excludes `tests/` — test files must explicitly import Jest globals:
  ```typescript
  import { describe, it, expect } from '@jest/globals';
  ```
- Mock `@solana/web3.js` and `axios` at the module level; never make real network calls in unit tests.
- When mocking async functions, explicitly type the mock to avoid TypeScript inferring `never`:
  ```typescript
  jest.fn<() => Promise<any>>()
  ```

## 5. Security Guardrails

- **HMAC-SHA256 for webhooks:** `parseWebhookEvent` uses **constant-time comparison** (`crypto.timingSafeEqual`) to prevent timing attacks. Never replace this with `===`.
- **No secrets in source:** API keys, keypair bytes, and webhook secrets must come from environment variables or runtime config — never hardcoded.
- **Soft Revocation:** Blockchain anchors are immutable. Revocation is implemented as a registry flag, not deletion. See `client.anchors.revoke()`.

## 6. Files You Should Never Modify Without Explicit Instruction

| File | Reason |
|---|---|
| `src/index.ts` | Public API surface — adding/removing exports is a breaking change |
| `package.json` → `exports` | Subpath export map consumed by downstream packages |
| `scripts/postinstall.js` | Runs on `npm install` for all consumers |
| `src/anchor/constants.ts` | Program ID and protocol version — coordinated with on-chain contract |
