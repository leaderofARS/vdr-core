/**
 * @module hash
 *
 * @description
 * Public barrel for the `hash` sub-system.
 *
 * Exports all hashing primitives and low-level buffer utilities from a single
 * import path. Consumers of `@sipheron/vdr-core` should import via the root
 * entry point; internal modules import from `'../hash'`.
 *
 * ### Exported functions
 * From `hash/sha256.ts` (cryptographic core):
 * - `hashDocument` — SHA-256 of a `Buffer`
 * - `hashFile`     — SHA-256 of a file on disk (Node.js only)
 * - `hashStream`   — SHA-256 of a readable stream
 * - `hashBase64`   — SHA-256 of a base64-encoded string
 * - `isValidHash`  — Validates 64-char hex format
 * - `normalizeHash`— Lowercases and trims a hash string
 *
 * From `hash/utils.ts` (low-level helpers):
 * - `hexToBuffer`, `bufferToHex`, `constantTimeCompare`,
 *   `formatFileSize`, `truncateHash`
 */
export { hashDocument, hashFile, hashStream, hashBase64, isValidHash, normalizeHash } from './sha256'
export { hexToBuffer, bufferToHex, constantTimeCompare,
         formatFileSize, truncateHash } from './utils'
