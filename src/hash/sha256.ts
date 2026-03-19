/**
 * @module hash/sha256
 *
 * @description
 * SHA-256 hashing utilities — the cryptographic foundation of the VDR SDK.
 *
 * All hashing runs **100 % locally** using Node.js's built-in `crypto` module.
 * Document bytes are never transmitted to any server; only the resulting
 * 64-character hex digest is used for anchoring and verification.
 *
 * ## Functions
 * | Function            | Environment  | Input            |
 * |---------------------|--------------|------------------|
 * | `hashDocument(buf)` | Node + Browser | `Buffer`         |
 * | `hashFile(path)`    | Node only    | filesystem path  |
 * | `hashStream(stream)`| Node + Browser | readable stream |
 * | `hashBase64(b64)`   | Node + Browser | Base64 string   |
 * | `isValidHash(h)`    | —            | any string       |
 * | `normalizeHash(h)`  | —            | any string       |
 *
 * ## Security properties
 * - **Non-reversible** — SHA-256 is a one-way function; the document cannot
 *   be recovered from its hash.
 * - **Collision-resistant** — probability of two different documents sharing
 *   the same hash is negligible (2⁻²⁵⁶).
 * - **Deterministic** — the same document always produces the same hash.
 *
 * @example
 * ```ts
 * import { hashDocument, hashFile } from '@sipheron/vdr-core'
 * import fs from 'fs'
 *
 * // From a Buffer (browser or Node)
 * const hash1 = await hashDocument(fs.readFileSync('./contract.pdf'))
 *
 * // From a file path (Node only)
 * const hash2 = await hashFile('./contract.pdf')
 *
 * console.log(hash1 === hash2) // true
 * ```
 */
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
 * Compute SHA-256 hash of a file on disk (Node.js only).
 *
 * @param filePath - Path to the file
 * @returns 64-character lowercase hex string
 */
export async function hashFile(filePath: string): Promise<string> {
  if (typeof globalThis !== 'undefined' && (globalThis as any).window !== undefined) {
    throw new Error('hashFile is only available in Node.js environments.')
  }
  
  const fs = await import('fs')
  
  if (!fs.existsSync(filePath)) {
    throw new ValidationError(`File not found: ${filePath}`)
  }

  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const rs = fs.createReadStream(filePath)
    rs.on('error', reject)
    rs.on('data', chunk => hash.update(chunk))
    rs.on('end', () => resolve(hash.digest('hex')))
  })
}

/**
 * Compute SHA-256 hash of a string to handle Base64 properly.
 *
 * @param base64 - Base64 encoded document string
 * @returns 64-character lowercase hex string
 */
export async function hashBase64(base64: string): Promise<string> {
  if (!base64 || typeof base64 !== 'string') {
    throw new ValidationError('Valid base64 string is required')
  }
  const buffer = Buffer.from(base64, 'base64')
  return hashDocument(buffer)
}

/**
 * Compute SHA-256 hash from a Readable stream.
 * Compatible with Node.js streams or Web Streams.
 *
 * @param stream - A readable stream
 * @returns 64-character lowercase hex string
 */
export async function hashStream(stream: any): Promise<string> {
  if (!stream) throw new ValidationError('Stream is required')

  // Node.js stream
  if (typeof stream.on === 'function') {
    return new Promise((resolve, reject) => {
      const hash = createHash('sha256')
      stream.on('error', reject)
      stream.on('data', (chunk: Buffer) => hash.update(chunk))
      stream.on('end', () => resolve(hash.digest('hex')))
    })
  }
  
  // Web stream
  if (typeof stream.getReader === 'function') {
    const reader = stream.getReader()
    const hash = createHash('sha256')
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      hash.update(value)
    }
    
    return hash.digest('hex')
  }
  
  throw new ValidationError('Unsupported stream type provided to hashStream')
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
