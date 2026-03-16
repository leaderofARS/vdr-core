import { describe, it, expect } from '@jest/globals'
import { createHash } from 'crypto'
import { hashDocument, isValidHash, normalizeHash } from '../../src/hash'
import { ValidationError } from '../../src/errors'
import { TEST_BUFFERS } from '../fixtures/known-hashes'

describe('hashDocument', () => {
  it('produces a 64-character hex string', async () => {
    const hash = await hashDocument(TEST_BUFFERS.HELLO)
    expect(hash).toHaveLength(64)
    expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true)
  })

  it('produces deterministic output — same file always same hash', async () => {
    const hash1 = await hashDocument(TEST_BUFFERS.HELLO)
    const hash2 = await hashDocument(TEST_BUFFERS.HELLO)
    expect(hash1).toBe(hash2)
  })

  it('matches Node.js crypto createHash output', async () => {
    const expected = createHash('sha256')
      .update(TEST_BUFFERS.HELLO)
      .digest('hex')
    const actual = await hashDocument(TEST_BUFFERS.HELLO)
    expect(actual).toBe(expected)
  })

  it('different files produce different hashes', async () => {
    const hash1 = await hashDocument(TEST_BUFFERS.HELLO)
    const hash2 = await hashDocument(TEST_BUFFERS.SIPHERON)
    expect(hash1).not.toBe(hash2)
  })

  it('handles binary data', async () => {
    const hash = await hashDocument(TEST_BUFFERS.BINARY)
    expect(hash).toHaveLength(64)
  })

  it('handles PDF magic bytes', async () => {
    const hash = await hashDocument(TEST_BUFFERS.PDF_MAGIC)
    expect(hash).toHaveLength(64)
  })

  it('throws ValidationError for empty buffer', async () => {
    await expect(hashDocument(TEST_BUFFERS.EMPTY))
      .rejects.toThrow(ValidationError)
  })

  it('throws ValidationError for null input', async () => {
    await expect(hashDocument(null as any)).rejects.toThrow(ValidationError)
  })

  it('changing one byte changes the hash completely', async () => {
    const original = Buffer.from('hello world')
    const modified = Buffer.from('hello World') // capital W
    const hash1 = await hashDocument(original)
    const hash2 = await hashDocument(modified)
    expect(hash1).not.toBe(hash2)
    // Avalanche effect — many bits should differ
    let diffBits = 0
    for (let i = 0; i < hash1.length; i++) {
      diffBits += (hash1.charCodeAt(i) !== hash2.charCodeAt(i)) ? 1 : 0
    }
    expect(diffBits).toBeGreaterThan(10)
  })
})

describe('isValidHash', () => {
  it('accepts valid 64-char hex strings', () => {
    expect(isValidHash('a'.repeat(64))).toBe(true)
    expect(isValidHash('0'.repeat(64))).toBe(true)
    expect(isValidHash('a3f4b2c1d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5')).toBe(true)
  })

  it('rejects too short strings', () => {
    expect(isValidHash('a3f4b2c1')).toBe(false)
  })

  it('rejects too long strings', () => {
    expect(isValidHash('a'.repeat(65))).toBe(false)
  })

  it('rejects non-hex characters', () => {
    expect(isValidHash('z' + 'a'.repeat(63))).toBe(false)
  })

  it('rejects uppercase hex', () => {
    expect(isValidHash('A'.repeat(64))).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidHash('')).toBe(false)
  })
})

describe('normalizeHash', () => {
  it('converts to lowercase', () => {
    expect(normalizeHash('A3F4B2C1' + 'a'.repeat(56)))
      .toBe('a3f4b2c1' + 'a'.repeat(56))
  })

  it('trims whitespace', () => {
    expect(normalizeHash('  ' + 'a'.repeat(64) + '  ')).toBe('a'.repeat(64))
  })
})
