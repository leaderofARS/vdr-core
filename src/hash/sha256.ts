import { createHash } from 'crypto'
import { ValidationError } from '../errors'

/**
 * Compute SHA-256 hash of a document buffer.
 *
 * This function always runs locally — the document bytes
 * are never transmitted anywhere. Only the resulting
 * 64-character hex digest is used for anchoring.
 *
 * @param file - Document as Buffer
 * @returns 64-character lowercase hex string
 *
 * @example
 * const hash = await hashDocument(fs.readFileSync('./contract.pdf'))
 * // a3f4b2c1d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5
 */
export async function hashDocument(file: Buffer): Promise<string> {
  if (!file) {
    throw new ValidationError('File buffer is required')
  }
  if (file.length === 0) {
    throw new ValidationError('File buffer cannot be empty')
  }

  return createHash('sha256').update(file).digest('hex')
}

/**
 * Validate that a string is a valid SHA-256 hex digest.
 *
 * @param hash - String to validate
 * @returns true if valid SHA-256 hex string
 */
export function isValidHash(hash: string): boolean {
  return typeof hash === 'string' && /^[a-f0-9]{64}$/.test(hash)
}

/**
 * Normalize a hash string to lowercase.
 * SHA-256 output is case-insensitive — normalize to lowercase
 * before any comparison.
 */
export function normalizeHash(hash: string): string {
  return hash.trim().toLowerCase()
}
