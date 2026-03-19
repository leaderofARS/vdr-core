/**
 * @module verify/compare
 *
 * @description
 * Hash comparison primitives used in local and on-chain verification paths.
 *
 * ## Security design
 * Both exported functions ultimately delegate to `constantTimeCompare()` in
 * `hash/utils.ts`, which uses XOR-accumulation to ensure that execution time
 * is constant regardless of **where** a mismatch occurs. This prevents
 * side-channel timing attacks that could otherwise reveal partial hash values.
 *
 * ## Functions
 * - `compareHashes(a, b)` — Normalises both hashes to lowercase and compares
 *   them in constant time. Returns `true` only if they are byte-identical.
 * - `verifyBuffer(file, expectedHash)` — Convenience wrapper that hashes a
 *   document `Buffer` locally with SHA-256 and then calls `compareHashes`.
 *   The document bytes are **never** transmitted.
 *
 * @internal
 * Used internally by `verify/verify.ts` (`verifyLocally`). Not part of the
 * primary public API surface.
 */
import { constantTimeCompare, normalizeHash } from '../hash'

/**
 * Compare two SHA-256 hashes for equality.
 * Uses constant-time comparison to prevent timing attacks.
 * Both hashes are normalized to lowercase before comparison.
 *
 * @param hashA - First hash
 * @param hashB - Second hash
 * @returns true if hashes are identical
 */
export function compareHashes(hashA: string, hashB: string): boolean {
  return constantTimeCompare(
    normalizeHash(hashA),
    normalizeHash(hashB)
  )
}

/**
 * Verify a document Buffer matches a known hash.
 * Hashing happens locally — document never transmitted.
 */
export async function verifyBuffer(
  file: Buffer,
  expectedHash: string
): Promise<boolean> {
  const { hashDocument } = await import('../hash')
  const computed = await hashDocument(file)
  return compareHashes(computed, expectedHash)
}
