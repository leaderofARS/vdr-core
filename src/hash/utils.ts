/**
 * @module hash/utils
 *
 * @description
 * Low-level buffer and hash utility helpers used across the VDR SDK.
 *
 * These are pure utility functions with no external dependencies — they
 * operate entirely on in-memory data and perform no I/O.
 *
 * ## Functions
 * - `hexToBuffer(hex)`           — Decode a hex string into a `Buffer`.
 * - `bufferToHex(buf)`           — Encode a `Buffer` as a lowercase hex string.
 * - `constantTimeCompare(a, b)`  — Side-channel-safe string equality check.
 *   Uses XOR accumulation so execution time is identical regardless of where
 *   a mismatch occurs, preventing timing attacks on hash comparison.
 * - `formatFileSize(bytes)`      — Human-readable file size string (B / KB / MB …).
 * - `truncateHash(hash, chars)`  — Shorten a hash for display: `a3f4b2c1...f8a9b0c1`.
 *
 * @internal
 * Not part of the public `@sipheron/vdr-core` API surface — used internally by
 * `hash/sha256.ts` and `verify/compare.ts`.
 */

/**
 * Convert a hex string to a Buffer.
 */
export function hexToBuffer(hex: string): Buffer {
  return Buffer.from(hex, 'hex')
}

/**
 * Convert a Buffer to a lowercase hex string.
 */
export function bufferToHex(buffer: Buffer): string {
  return buffer.toString('hex')
}

/**
 * Constant-time string comparison.
 * Prevents timing attacks when comparing hash values.
 * Both strings must be the same length — returns false if lengths differ.
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Format file size in human-readable format.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`
}

/**
 * Truncate a hash for display purposes.
 * Example: a3f4b2c1...f8a9b0c1
 */
export function truncateHash(hash: string, chars = 8): string {
  if (hash.length <= chars * 2 + 3) return hash
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`
}
