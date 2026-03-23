# Changelog

All notable changes to the `@sipheron/vdr-core` SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Soft Revocation Registry**: Implement cryptographic soft revocation. Mark anchors as superseded without deleting the immutable blockchain record.
  - Added `client.anchors.revoke()` method to manually trigger a revocation flag on a managed SipHeron anchor.
  - Verification operations now correctly consume `Status: 'REVOKED'`, resolving with `authentic: true` alongside detailed revocation metrics (`revokedAt`, `supersededByAnchorId`, etc.).
  - Added robust exported Types (`RevocationReason`, `RevocationRecord`) inside natively supported SDK interfaces.
- **Document Version Chain (Linked Anchors)**: Link a series of document versions into a verifiable chain.
  - Added `previousAnchorId` field to anchor options to link amended versions to their originals.
  - Added `client.anchors.getVersionChain()` method to automatically retrieve and trace a document's provable history lifecycle.

---

## [0.1.19] - 2026-03-20

### Fixed
- **Playground SHA512 Bug Fixes**: Resolved "NOT FOUND" errors when verifying SHA-512 hashes in the devnet playground.
- Improved the local-side digest buffer compilation and ensured case-insensitive hash normalizations passed correctly to the backend.

---

## [0.1.18] - 2026-03-19

### Added
- **Streaming Hash Support**: Implemented chunked pipeline processors (`hashFileStream` and `hashFileWithProgress`) to digest multi-gigabyte files (up to unlimited size limits) without overflowing Node.js available RAM or locking the thread.
- Progress events callbacks appended to the `hashFileStream` implementation to track loading of huge assets in real-time.

---

## [0.1.17] - 2026-03-17

### Fixed
- Fixed CLI transaction logic to explicitly state transaction modes and properly warn about local wallet funding requirements.

---

## [0.1.16] - 2026-03-17

### Changed
- Improved Business Plan tier placeholders.

---

## [0.1.15] - 2026-03-17

### Added
- Multi-thread batch anchoring logic (`anchorBatch()`). Can submit batches of up to 500 hashes efficiently without manual async wait times.

---

## [0.1.14] - 2026-03-17

### Changed
- Improved Webhook event structure, parsing HMAC payload outputs reliably against raw Node Request buffers.

---

## [0.1.13] - 2026-03-17

### Fixed
- Dedicated verification route logic specifically for playground deployments.

---

## [0.1.12] - 2026-03-17

### Changed
- Minor bug fixes and refinement to VDR Watcher concurrency models. File anchoring now properly awaits total file-closure state.

---

## [0.1.11] - 2026-03-16

### Changed
- Updated the Certificate rendering engine to enforce the official SipHeron Logo over legacy shield indicators.

---

## [0.1.10] - 2026-03-16

### Fixed
- Correctly parse external ID payload schemas on metadata fields.

---

## [0.1.9] - 2026-03-16

### Added
- Added `VerificationCache` helper utility to prevent unnecessary redundant `verify` calls to the RPC within typical 60s windows.

---

## [0.1.8] - 2026-03-16

### Changed
- Internal updates to `IdempotencyKey` middleware mapping.

---

## [0.1.7] - 2026-03-16

### Added
- Webhook signature parsing utility function (`parseWebhookEvent`) exposed directly out of SDK roots.

---

## [0.1.6] - 2026-03-16

### Fixed
- Edge cases in parsing `devnet` versus `mainnet` URLs when the default SDK `NetworkType` falls back gracefully.

---

## [0.1.5] - 2026-03-16

### Changed
- Added strict `ValidationError` and `AuthenticationError` objects inside `src/errors.ts` for clean programmatic try-catch handling.

---

## [0.1.4] - 2026-03-16

### Added
- Direct Solana Program verification features (`anchorToSolana`, `verifyOnChain`).
- High-level proxy client wrapper (`SipHeron` class) for SaaS workflow operations.

---

## [0.1.3] - 2026-03-16

### Changed
- Enhancements to Native Browser usage bridging for SubtleCrypto implementations allowing hashing directly on frontend frameworks (React, Next.js).

---

## [0.1.2] - 2026-03-16

### Added
- Built-in validation schema exports (`LEGAL_CONTRACT_SCHEMA`, `CLINICAL_TRIAL_SCHEMA` etc) to enforce typed Metadata entries on-chain.

---

## [0.1.1] - 2026-03-16

### Added
- Full local buffer manipulation methods mapping out robust SHA-256 fingerprinting schemas (`hashFile`, `hashDocument`).

---

## [0.1.0] - 2026-03-16

### Added
- Initial public release of `@sipheron/vdr-core`.
