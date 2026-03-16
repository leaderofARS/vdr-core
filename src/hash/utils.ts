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
