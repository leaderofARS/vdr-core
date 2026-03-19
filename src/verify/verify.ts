/**
 * @module verify/verify
 *
 * @description
 * Document verification functions — local and hosted API modes.
 *
 * ## `verifyLocally(fileOrHash, anchorHash)`
 * Fully offline comparison with **no network call**.
 * - Accepts either a document `Buffer` (hashed locally) or a pre-computed hash string.
 * - Compares against a known `anchorHash` using constant-time equality (`crypto.timingSafeEqual`).
 * - Returns `{ authentic, computedHash, anchorHash }`.
 * - Use this when you already retrieved the anchor record and want to check the document
 *   without making a second round-trip to the API.
 *
 * ## `verifyHashStandalone(hash, apiBaseUrl?)`
 * Calls the SipHeron public `/api/verify` endpoint without authentication.
 * - No API key required.
 * - `apiBaseUrl` defaults to `https://api.sipheron.com` but can be overridden
 *   for self-hosted deployments.
 * - Returns a full `VerificationResult`.
 *
 * @example
 * ```ts
 * import { verifyLocally, verifyHashStandalone } from '@sipheron/vdr-core'
 * import fs from 'fs'
 *
 * // Pure local — no network
 * const local = await verifyLocally(fs.readFileSync('./contract.pdf'), knownAnchorHash)
 * console.log(local.authentic) // true / false
 *
 * // API check — no API key needed
 * const result = await verifyHashStandalone(documentHash)
 * console.log(result.status) // 'authentic' | 'not_found' | 'revoked' | 'pending'
 * ```
 */
import { hashDocument, isValidHash, normalizeHash } from '../hash'
import { compareHashes } from './compare'
import { ValidationError } from '../errors'
import type { VerificationResult } from '../types'

/**
 * Perform a standalone local verification.
 * Compares a document or hash against a known anchor hash.
 * No network call — purely local comparison.
 *
 * Use this when you have the anchor hash and want to verify
 * a document locally without making an API call.
 *
 * @param file - Document as Buffer, OR
 * @param hash - Pre-computed SHA-256 hash
 * @param anchorHash - The hash stored in the anchor record
 * @returns Local verification result
 */
export async function verifyLocally(
  fileOrHash: Buffer | string,
  anchorHash: string
): Promise<{ authentic: boolean; computedHash: string; anchorHash: string }> {
  if (!anchorHash || !isValidHash(normalizeHash(anchorHash))) {
    throw new ValidationError(
      'anchorHash must be a valid 64-character SHA-256 hex string'
    )
  }

  let computedHash: string

  if (Buffer.isBuffer(fileOrHash)) {
    computedHash = await hashDocument(fileOrHash)
  } else {
    const normalized = normalizeHash(fileOrHash)
    if (!isValidHash(normalized)) {
      throw new ValidationError(
        'Invalid hash format. Must be 64 hex characters.'
      )
    }
    computedHash = normalized
  }

  return {
    authentic: compareHashes(computedHash, anchorHash),
    computedHash,
    anchorHash: normalizeHash(anchorHash),
  }
}

/**
 * Standalone verifyHash function.
 * Calls the SipHeron public verification API without authentication.
 * Use this for simple hash lookups without the full client.
 *
 * @param hash - 64-character SHA-256 hash
 * @param apiBaseUrl - API base URL. Default: https://api.sipheron.com
 */
export async function verifyHashStandalone(
  hash: string,
  apiBaseUrl = 'https://api.sipheron.com'
): Promise<VerificationResult> {
  const normalized = normalizeHash(hash)
  if (!isValidHash(normalized)) {
    throw new ValidationError(
      'Invalid hash format. Must be a 64-character SHA-256 hex string.'
    )
  }

  const response = await fetch(`${apiBaseUrl}/api/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hash: normalized }),
  })

  const data = (await response.json()) as Record<string, any>

  return {
    authentic: data.authentic === true,
    status: data.status === 'CONFIRMED' ? 'authentic'
          : data.status === 'REVOKED'   ? 'revoked'
          : data.error === 'NOT_FOUND'  ? 'not_found'
          : 'not_found',
    hash: normalized,
    verifiedAt: data.verified_at || new Date().toISOString(),
    anchor: data.anchor,
  }
}
