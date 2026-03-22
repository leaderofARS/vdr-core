/**
 * @module hash/algorithms
 * 
 * @description
 * Multi-algorithm hashing engine supporting SHA-256, SHA-512, BLAKE3, and MD5.
 * 
 * All hashing runs **100% locally**. SipHeron VDR provides flexibility for 
 * enterprise integration by supporting multiple standards while maintaining 
 * cryptographic integrity.
 * 
 * ## Performance note
 * - **BLAKE3** is the fastest for large document streams but requires an 
 *   optional native dependency.
 * - **SHA-256** is the industry standard and works natively everywhere.
 * - **SHA-512** provides maximum collision resistance.
 */
import { createHash as cryptoCreateHash } from 'crypto'
import { ValidationError } from '../errors'
import { HashAlgorithm, HashOptions } from '../types'

/**
 * Returns metadata about a supported hashing algorithm.
 */
export function getAlgorithmInfo(algorithm: HashAlgorithm) {
  const info = {
    sha256: { bits: 256, outputLength: 64, recommended: true, label: 'SHA-256' },
    sha512: { bits: 512, outputLength: 128, recommended: true, label: 'SHA-512' },
    blake3: { bits: 256, outputLength: 64, recommended: true, fast: true, label: 'BLAKE3' },
    md5:    { bits: 128, outputLength: 32, recommended: false, label: 'MD5',
              warning: 'MD5 is cryptographically broken. Use only for legacy compatibility.' }
  }
  return info[algorithm]
}

/**
 * Internal helper to dynamically import BLAKE3 if available.
 */
async function importBlake3() {
  try {
    // @ts-ignore - optional dependency
    return await import('blake3')
  } catch (e) {
    throw new Error(
      'BLAKE3 support requires the "blake3" package to be installed. ' +
      'Run: npm install blake3'
    )
  }
}

/**
 * Compute the hash of a document buffer using the specified algorithm.
 *
 * @param file - Document as Buffer
 * @param options - Hashing configuration (algorithm, encoding)
 * @returns Lowercase hex or base64 digest
 */
export async function hashDocument(
  file: Buffer,
  options: HashOptions = {}
): Promise<string> {
  const algorithm = options.algorithm ?? 'sha256'
  const encoding = options.encoding ?? 'hex'

  if (!file) {
    throw new ValidationError('File buffer is required')
  }

  if (file.length === 0) {
    throw new ValidationError('File buffer cannot be empty')
  }

  if (algorithm === 'blake3') {
    const { createHash } = await importBlake3()
    return createHash().update(file).digest(encoding as any)
  }

  return cryptoCreateHash(algorithm).update(file).digest(encoding as any)
}

/**
 * Compute hash of a file on disk (Node.js only).
 */
export async function hashFile(
  filePath: string,
  options: HashOptions = {}
): Promise<string> {
  if (typeof globalThis !== 'undefined' && (globalThis as any).window !== undefined) {
    throw new Error('hashFile is only available in Node.js environments.')
  }
  
  const fs = await import('fs')
  const algorithm = options.algorithm ?? 'sha256'
  const encoding = options.encoding ?? 'hex'
  
  if (!fs.existsSync(filePath)) {
    throw new ValidationError(`File not found: ${filePath}`)
  }

  if (algorithm === 'blake3') {
    const { createHash } = await importBlake3()
    const hasher = createHash()
    const rs = fs.createReadStream(filePath)
    return new Promise((resolve, reject) => {
      rs.on('error', reject)
      rs.on('data', chunk => hasher.update(chunk))
      rs.on('end', () => resolve(hasher.digest(encoding as any)))
    })
  }

  return new Promise((resolve, reject) => {
    const hash = cryptoCreateHash(algorithm)
    const rs = fs.createReadStream(filePath)
    rs.on('error', reject)
    rs.on('data', chunk => hash.update(chunk))
    rs.on('end', () => resolve(hash.digest(encoding as any)))
  })
}

/**
 * Hash a file using streaming for large files.
 */
export async function hashFileStream(
  filePath: string,
  options: HashOptions = {}
): Promise<string> {
  return hashFile(filePath, options)
}

/**
 * Hash with progress reporting for large files.
 */
export async function hashFileWithProgress(
  filePath: string,
  onProgress?: (bytesProcessed: number, totalBytes: number) => void,
  options: HashOptions = {}
): Promise<string> {
  if (typeof globalThis !== 'undefined' && (globalThis as any).window !== undefined) {
    throw new Error('hashFileWithProgress is only available in Node.js environments.')
  }
  const { statSync, createReadStream } = await import('fs')
  const algorithm = options.algorithm ?? 'sha256'
  const encoding = options.encoding ?? 'hex'
  
  const totalBytes = statSync(filePath).size
  let bytesProcessed = 0

  let hasher: any
  if (algorithm === 'blake3') {
    const { createHash } = await importBlake3()
    hasher = createHash()
  } else {
    hasher = cryptoCreateHash(algorithm)
  }

  return new Promise((resolve, reject) => {
    const stream = createReadStream(filePath, {
      highWaterMark: 64 * 1024
    })

    stream.on('data', (chunk) => {
      hasher.update(chunk)
      bytesProcessed += chunk.length
      onProgress?.(bytesProcessed, totalBytes)
    })
    stream.on('end', () => resolve(hasher.digest(encoding as any)))
    stream.on('error', reject)
  })
}

/**
 * Compute hash of a base64 string.
 */
export async function hashBase64(
  base64: string,
  options: HashOptions = {}
): Promise<string> {
  if (!base64 || typeof base64 !== 'string') {
    throw new ValidationError('Valid base64 string is required')
  }
  const buffer = Buffer.from(base64, 'base64')
  return hashDocument(buffer, options)
}

/**
 * Compute hash from a Readable stream.
 */
export async function hashStream(
  stream: any,
  options: HashOptions = {}
): Promise<string> {
  if (!stream) throw new ValidationError('Stream is required')
  const algorithm = options.algorithm ?? 'sha256'
  const encoding = options.encoding ?? 'hex'

  let hasher: any
  if (algorithm === 'blake3') {
    const { createHash } = await importBlake3()
    hasher = createHash()
  } else {
    hasher = cryptoCreateHash(algorithm)
  }

  // Node.js stream
  if (typeof stream.on === 'function') {
    return new Promise((resolve, reject) => {
      stream.on('error', reject)
      stream.on('data', (chunk: Buffer) => hasher.update(chunk))
      stream.on('end', () => resolve(hasher.digest(encoding as any)))
    })
  }
  
  // Web stream
  if (typeof stream.getReader === 'function') {
    const reader = stream.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      hasher.update(value)
    }
    return hasher.digest(encoding as any)
  }
  
  throw new ValidationError('Unsupported stream type provided to hashStream')
}

/**
 * Validate that a string is a valid hex digest for the given algorithm.
 */
export function isValidHash(hash: string, algorithm: HashAlgorithm = 'sha256'): boolean {
  if (typeof hash !== 'string') return false
  const info = getAlgorithmInfo(algorithm)
  const regex = new RegExp(`^[a-f0-9]{${info.outputLength}}$`)
  return regex.test(hash)
}

/**
 * Normalize a hash string.
 */
export function normalizeHash(hash: string): string {
  return hash.trim().toLowerCase()
}
