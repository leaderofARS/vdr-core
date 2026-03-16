import { describe, it, expect } from '@jest/globals'
import { prepareAnchor, mapToAnchorResult } from '../../src/anchor'
import { ValidationError } from '../../src/errors'
import { TEST_BUFFERS } from '../fixtures/known-hashes'

describe('prepareAnchor', () => {
  it('hashes file and returns normalized hash', async () => {
    const result = await prepareAnchor({ file: TEST_BUFFERS.HELLO })
    expect(result.hash).toHaveLength(64)
    expect(/^[a-f0-9]{64}$/.test(result.hash)).toBe(true)
  })

  it('accepts pre-computed hash', async () => {
    const hash = 'a3f4b2c1d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5'
    const result = await prepareAnchor({ hash })
    expect(result.hash).toBe(hash)
  })

  it('normalizes uppercase hash to lowercase', async () => {
    const hash = 'A3F4B2C1D8E9F0A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5'
    const result = await prepareAnchor({ hash })
    expect(result.hash).toBe(hash.toLowerCase())
  })

  it('throws ValidationError when neither file nor hash provided', async () => {
    await expect(prepareAnchor({})).rejects.toThrow(ValidationError)
  })

  it('throws ValidationError for invalid hash format', async () => {
    await expect(prepareAnchor({ hash: 'not-a-valid-hash' }))
      .rejects.toThrow(ValidationError)
  })

  it('sets metadata from name option', async () => {
    const result = await prepareAnchor({
      file: TEST_BUFFERS.HELLO,
      name: 'Test Document',
    })
    expect(result.metadata).toBe('Test Document')
  })
})

describe('mapToAnchorResult', () => {
  const mockApiResponse = {
    id: 'test-id',
    hash: 'a3f4b2c1d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5',
    txSignature: '3xK9mPqRabcdef1234',
    blockNumber: 284847291,
    blockTimestamp: '2026-03-16T04:36:02Z',
    createdAt: '2026-03-16T04:36:03Z',
    status: 'CONFIRMED',
    metadata: 'Test Document',
  }

  it('maps response to AnchorResult', () => {
    const result = mapToAnchorResult(mockApiResponse)
    expect(result.id).toBe('test-id')
    expect(result.hash).toHaveLength(64)
    expect(result.status).toBe('confirmed')
    expect(result.transactionSignature).toBe('3xK9mPqRabcdef1234')
  })

  it('builds correct verification URL', () => {
    const result = mapToAnchorResult(mockApiResponse)
    expect(result.verificationUrl).toContain(mockApiResponse.hash)
    expect(result.verificationUrl).toContain('app.sipheron.com/verify')
  })

  it('builds correct explorer URL for devnet', () => {
    const result = mapToAnchorResult(mockApiResponse, 'devnet')
    expect(result.explorerUrl).toContain('cluster=devnet')
    expect(result.explorerUrl).toContain(mockApiResponse.txSignature)
  })

  it('maps status correctly', () => {
    expect(mapToAnchorResult({ ...mockApiResponse, status: 'CONFIRMED' }).status)
      .toBe('confirmed')
    expect(mapToAnchorResult({ ...mockApiResponse, status: 'PENDING' }).status)
      .toBe('pending')
    expect(mapToAnchorResult({ ...mockApiResponse, status: 'FAILED' }).status)
      .toBe('failed')
  })
})
