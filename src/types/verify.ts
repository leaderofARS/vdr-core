/**
 * @module types/verify
 *
 * @description
 * TypeScript type definitions for verification operations.
 *
 * ## Types
 *
 * ### `VerifyOptions`
 * Input to `sipheron.verify()` or `verifyHashStandalone()`.
 * Supply **either** `file` (hashed locally and never transmitted) **or** a
 * pre-computed `hash` string — never both.
 *
 * ### `VerificationStatus`
 * The detailed outcome of a verification attempt:
 * - `'authentic'`  — Hash found on-chain AND anchor status is `'confirmed'`.
 * - `'mismatch'`   — A record exists but the hash does not match.
 * - `'not_found'`  — No anchor record found for this hash.
 * - `'revoked'`    — Anchor exists but has been explicitly revoked.
 * - `'pending'`    — Anchor exists but transaction not yet confirmed.
 *
 * ### `VerificationResult`
 * Return value of all `verify*` methods. The boolean `authentic` field is the
 * fast-path check; inspect `status` for the full picture.
 */
import type { AnchorResult } from './anchor'

export interface VerifyOptions {
  /**
   * Document as Buffer.
   * Hashed locally — never transmitted.
   * Provide either file or hash, not both.
   */
  file?: Buffer
  /**
   * Pre-computed SHA-256 hash (64 hex characters).
   * Provide either file or hash, not both.
   */
  hash?: string
  /** Verify against a specific anchor ID */
  anchorId?: string
}

export type VerificationStatus =
  | 'authentic'
  | 'mismatch'
  | 'not_found'
  | 'revoked'
  | 'pending'

export interface VerificationResult {
  /**
   * True if and only if the document matches its blockchain anchor
   * AND the anchor status is 'confirmed'.
   */
  authentic: boolean
  /** Detailed status of the verification */
  status: VerificationStatus
  /** The hash that was checked */
  hash: string
  /** ISO 8601 timestamp of this verification */
  verifiedAt: string
  /** Full anchor record if found */
  anchor?: AnchorResult
  /** The hash from the anchor record (for mismatch comparison) */
  anchoredHash?: string
}
