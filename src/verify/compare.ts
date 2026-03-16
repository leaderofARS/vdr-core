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
