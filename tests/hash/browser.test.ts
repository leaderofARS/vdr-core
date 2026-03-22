/**
 * Tests for browser-native SHA-256 hashing.
 *
 * Uses Node.js's built-in `crypto.webcrypto` to simulate the Web Crypto API
 * in a Node test environment.  Verifies that browser and Node implementations
 * produce byte-identical output for the same input.
 */
import { webcrypto } from 'crypto'
import { hashDocument } from '../../src/hash/algorithms'
import { hashDocumentBrowser, hashAuto } from '../../src/hash/browser'

// ── Polyfill globalThis.crypto for Node.js test environment ──────────────────
// Node 19+ has this natively; older versions need it injected.
if (!(globalThis as any).crypto?.subtle) {
  (globalThis as any).crypto = webcrypto
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

const TEST_STRING = 'Hello, SipHeron VDR! 🚀'
const TEST_BUFFER = Buffer.from(TEST_STRING, 'utf-8')

// A larger buffer to catch edge-cases with chunked reads / pool slicing
const LARGE_BUFFER = Buffer.alloc(256 * 1024) // 256 KB
for (let i = 0; i < LARGE_BUFFER.length; i++) {
  LARGE_BUFFER[i] = i % 256
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('hashDocumentBrowser', () => {
  it('produces the same hash as Node.js hashDocument for a small input', async () => {
    const nodeHash = await hashDocument(TEST_BUFFER)

    // Convert Buffer → ArrayBuffer (just like a browser File.arrayBuffer() would)
    const arrayBuffer = TEST_BUFFER.buffer.slice(
      TEST_BUFFER.byteOffset,
      TEST_BUFFER.byteOffset + TEST_BUFFER.byteLength
    )
    const browserHash = await hashDocumentBrowser(arrayBuffer)

    expect(browserHash).toBe(nodeHash)
    expect(browserHash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('produces the same hash as Node.js hashDocument for a large input', async () => {
    const nodeHash = await hashDocument(LARGE_BUFFER)

    const arrayBuffer = LARGE_BUFFER.buffer.slice(
      LARGE_BUFFER.byteOffset,
      LARGE_BUFFER.byteOffset + LARGE_BUFFER.byteLength
    )
    const browserHash = await hashDocumentBrowser(arrayBuffer)

    expect(browserHash).toBe(nodeHash)
  })

  it('accepts a Uint8Array and produces the correct hash', async () => {
    const nodeHash = await hashDocument(TEST_BUFFER)
    const u8 = new Uint8Array(TEST_BUFFER)
    const browserHash = await hashDocumentBrowser(u8)

    expect(browserHash).toBe(nodeHash)
  })

  it('accepts a Node.js Buffer directly (via Uint8Array path)', async () => {
    const nodeHash = await hashDocument(TEST_BUFFER)
    // Buffer extends Uint8Array, so it should work through that path
    const browserHash = await hashDocumentBrowser(TEST_BUFFER)

    expect(browserHash).toBe(nodeHash)
  })

  it('accepts a Blob-like object with arrayBuffer()', async () => {
    const nodeHash = await hashDocument(TEST_BUFFER)
    const ab = TEST_BUFFER.buffer.slice(
      TEST_BUFFER.byteOffset,
      TEST_BUFFER.byteOffset + TEST_BUFFER.byteLength
    )

    // Duck-typed Blob-like object (simulates browser File/Blob)
    const blobLike = {
      arrayBuffer: async () => ab,
    }

    const browserHash = await hashDocumentBrowser(blobLike)
    expect(browserHash).toBe(nodeHash)
  })

  it('throws on null/undefined input', async () => {
    await expect(hashDocumentBrowser(null as any)).rejects.toThrow()
    await expect(hashDocumentBrowser(undefined as any)).rejects.toThrow()
  })
})

describe('hashAuto', () => {
  it('handles Buffer input (Node.js fast-path)', async () => {
    const nodeHash = await hashDocument(TEST_BUFFER)
    const autoHash = await hashAuto(TEST_BUFFER)

    expect(autoHash).toBe(nodeHash)
  })

  it('handles ArrayBuffer input', async () => {
    const nodeHash = await hashDocument(TEST_BUFFER)
    const ab = TEST_BUFFER.buffer.slice(
      TEST_BUFFER.byteOffset,
      TEST_BUFFER.byteOffset + TEST_BUFFER.byteLength
    )
    const autoHash = await hashAuto(ab)

    expect(autoHash).toBe(nodeHash)
  })

  it('handles Uint8Array input', async () => {
    const nodeHash = await hashDocument(TEST_BUFFER)
    const u8 = new Uint8Array(TEST_BUFFER)
    const autoHash = await hashAuto(u8)

    expect(autoHash).toBe(nodeHash)
  })

  it('handles Blob-like input', async () => {
    const nodeHash = await hashDocument(TEST_BUFFER)
    const ab = TEST_BUFFER.buffer.slice(
      TEST_BUFFER.byteOffset,
      TEST_BUFFER.byteOffset + TEST_BUFFER.byteLength
    )
    const blobLike = {
      arrayBuffer: async () => ab,
    }
    const autoHash = await hashAuto(blobLike)

    expect(autoHash).toBe(nodeHash)
  })

  it('handles a large buffer correctly', async () => {
    const nodeHash = await hashDocument(LARGE_BUFFER)
    const autoHash = await hashAuto(LARGE_BUFFER)

    expect(autoHash).toBe(nodeHash)
  })

  it('throws on null/undefined input', async () => {
    await expect(hashAuto(null as any)).rejects.toThrow()
    await expect(hashAuto(undefined as any)).rejects.toThrow()
  })

  it('produces a consistent 64-char lowercase hex string', async () => {
    const hash = await hashAuto(TEST_BUFFER)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
    expect(hash.length).toBe(64)
  })

  it('produces different hashes for different inputs', async () => {
    const hash1 = await hashAuto(Buffer.from('document-a'))
    const hash2 = await hashAuto(Buffer.from('document-b'))
    expect(hash1).not.toBe(hash2)
  })
})
