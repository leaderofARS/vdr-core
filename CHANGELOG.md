# 📈 SipHeron VDR Core Compute Layer — Changelog

All notable state implementations, protocol updates, and cryptographic enhancements directed to the `@sipheron/vdr-core` compute layer will be formally documented here.

This framework aligns strictly with [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) structural patterns and adheres mathematically to [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

## [0.1.0] — Operational Baseline Registration

### Implemented State Structures
- **Compute Interface Layer (`SipHeron`):** Root topological client mapping `anchor()`, `verify()`, `verifyHash()`, `getStatus()`, `list()`, and `anchorBatch()` functions to core architectural backends.
- **Client-Side SHA-256 Protocol (`hashDocument`):** Zero-trust execution limits. Raw file structures are strictly hashed on absolute computational endpoints and subsequently discarded natively.
- **Constant-Time Memory Validation (`verifyLocally`):** Mitigates side-channel CPU analysis and latency derivations via binary assertion `crypto.timingSafeEqual` mapping.
- **Zero-Dependency Core (`verifyHashStandalone`):** Immutable public verification parameters executable devoid of computational API barriers. 
- **Type-Safe Domain Validation:** Strict TypeScript parsing sequences covering fundamental deterministic logic, HTTP interception (`AxiosError`), and complete Webhook payload arrays (`WebhookEvent`).
- **Resilient Execution Modifiers:** Geometric API logic implementation executing strict idempotent retry pipelines handling temporary (5xx) backoffs.
- **Formalized Error Domains (`SipHeronError`):** Absolute structural mapping of execution variables—specifically bounds checking across `AuthenticationError`, `RateLimitError`, `AnchorRevokedError`, and limits matrices (`QuotaExceededError`).

### Underlining Ledger Functionality
- `generateCertificateId`, `buildCertificateUrl` parameter mappings parsing structural receipt structures deterministically.
- `getExplorerUrl` and `isValidTxSignature` bounds checkers analyzing exact Base58 length strings parsed from Solana block execution.
- Operational polling implementations (`pollForConfirmation`, `isTerminal`) parsing topological nodes across distributed states.

### Execution Logistics
- Comprehensive native test matrix (`npm test`) covering base algorithmic bounds, fault testing, API boundaries, and local payload sizes up to hardware capabilities.
- 6 isolated functional implementations (`basic-anchor.ts`, `batch-anchor.ts`, `independent-verify.ts`) demonstrating real-world institutional lifecycle flows.
- Node.js native `crypto` requirement > `16.0.0`.
- Open ecosystem Apache 2.0 release mapping.
- Native Solana Devnet & Mainnet execution compatibility over `6ecWPUK87zxwZP2pARJ75wbpCka92mYSGP1szrJxzAwo`.
