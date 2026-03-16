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
