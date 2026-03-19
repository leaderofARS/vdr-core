/**
 * @module anchor/anchor
 *
 * @description
 * Core anchoring helpers used internally by the `SipHeron` client.
 * These are the pure utility functions that prepare, validate, and map
 * anchor data — they contain no HTTP logic themselves.
 *
 * ## Contents
 * - `prepareAnchor(options)`  — Normalises `AnchorOptions` into a `{ hash, metadata }` object.
 *   Hashes the file locally if a Buffer is provided; validates the format if a raw hash string
 *   is provided. The document bytes are **never** transmitted.
 * - `mapToAnchorResult(data)` — Maps a raw API response object to the typed `AnchorResult`.
 * - `hashDocument`            — Re-exported for convenience in anchor workflows.
 *
 * @internal
 * This module is not part of the public API surface — consumers should use
 * the `SipHeron` client class or the standalone functions from `@sipheron/vdr-core` directly.
 */

import { hashDocument, isValidHash, normalizeHash } from '../hash'
import { ValidationError } from '../errors'
import type { AnchorOptions, AnchorResult } from '../types'
import { buildExplorerUrl, buildVerifyUrl } from '../client/config'

/**
 * Hash a document Buffer and return the SHA-256 hex string.
 * This is a convenience re-export for use in anchor workflows.
 */
export { hashDocument }

/**
 * Prepare anchor data from AnchorOptions.
 * Computes hash if file is provided, validates hash if string is provided.
 * Returns the normalized hash ready for API submission.
 */
export async function prepareAnchor(options: AnchorOptions): Promise<{
  hash: string
  metadata: string | null
}> {
  if (!options.file && !options.hash) {
    throw new ValidationError(
      'Provide either file (Buffer) or hash (string).'
    )
  }

  let hash: string
  if (options.file) {
    hash = await hashDocument(options.file)
  } else {
    hash = normalizeHash(options.hash!)
    if (!isValidHash(hash)) {
      throw new ValidationError(
        'Invalid hash format. Must be 64 hex characters (SHA-256).'
      )
    }
  }

  return {
    hash,
    metadata: options.name || null,
  }
}

/**
 * Map raw API response to AnchorResult.
 */
export function mapToAnchorResult(
  data: Record<string, unknown>,
  network: 'devnet' | 'mainnet' = 'devnet'
): AnchorResult {
  const record = (data.record || data) as Record<string, unknown>
  const hash = String(record.hash || '')
  const txSig = String(record.txSignature || '')

  return {
    id: String(record.id || ''),
    hash,
    transactionSignature: txSig,
    blockNumber: Number(record.blockNumber || 0),
    timestamp: String(record.blockTimestamp || record.createdAt || ''),
    verificationUrl: buildVerifyUrl(hash),
    explorerUrl: txSig ? buildExplorerUrl(txSig, network) : '',
    status: (['confirmed', 'failed', 'revoked', 'pending'] as const)
      .find(s => s === record.status?.toString().toLowerCase()) || 'pending',
    name: record.metadata ? String(record.metadata) : undefined,
    contractAddress: '6ecWPUK87zxwZP2pARJ75wbpCka92mYSGP1szrJxzAwo',
    network,
  }
}
