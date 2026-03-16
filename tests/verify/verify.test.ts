import { describe, it, expect } from '@jest/globals'
import { verifyLocally } from '../../src/verify'
import { hashDocument } from '../../src/hash'
import { ValidationError } from '../../src/errors'
import { TEST_BUFFERS } from '../fixtures/known-hashes'

describe('verifyLocally', () => {
  it('returns authentic=true when buffer matches hash', async () => {
    const hash = await hashDocument(TEST_BUFFERS.HELLO)
    const result = await verifyLocally(TEST_BUFFERS.HELLO, hash)
    expect(result.authentic).toBe(true)
    expect(result.computedHash).toBe(hash)
  })

  it('returns authentic=false when buffer does not match hash', async () => {
    const hash = await hashDocument(TEST_BUFFERS.HELLO)
    const result = await verifyLocally(TEST_BUFFERS.SIPHERON, hash)
    expect(result.authentic).toBe(false)
    expect(result.computedHash).not.toBe(result.anchorHash)
  })

  it('accepts pre-computed hash as first argument', async () => {
    const hash = await hashDocument(TEST_BUFFERS.HELLO)
    const result = await verifyLocally(hash, hash)
    expect(result.authentic).toBe(true)
  })

  it('is case-insensitive for hash comparison', async () => {
    const hash = await hashDocument(TEST_BUFFERS.HELLO)
    const result = await verifyLocally(TEST_BUFFERS.HELLO, hash.toUpperCase())
    expect(result.authentic).toBe(true)
  })

  it('throws ValidationError for invalid anchor hash', async () => {
    await expect(verifyLocally(TEST_BUFFERS.HELLO, 'invalid'))
      .rejects.toThrow(ValidationError)
  })

  it('detects one-byte modification', async () => {
    const original = Buffer.from('Important contract text')
    const modified = Buffer.from('Important Contract text') // capital C
    const hash = await hashDocument(original)
    const result = await verifyLocally(modified, hash)
    expect(result.authentic).toBe(false)
  })
})
