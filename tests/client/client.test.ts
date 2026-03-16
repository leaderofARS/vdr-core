import { describe, it, expect } from '@jest/globals'
import { SipHeron } from '../../src/client'
import { ValidationError } from '../../src/errors'

describe('SipHeron constructor', () => {
  it('throws if apiKey is missing', () => {
    expect(() => new SipHeron({ apiKey: '' })).toThrow()
  })

  it('uses devnet as default network', () => {
    const client = new SipHeron({ apiKey: 'test-key' })
    // @ts-ignore accessing private for test
    expect(client.config.network).toBe('devnet')
  })

  it('accepts mainnet network', () => {
    const client = new SipHeron({ apiKey: 'test-key', network: 'mainnet' })
    // @ts-ignore
    expect(client.config.network).toBe('mainnet')
  })

  it('uses default timeout of 30000ms', () => {
    const client = new SipHeron({ apiKey: 'test-key' })
    // @ts-ignore
    expect(client.config.timeout).toBe(30000)
  })

  it('respects custom timeout', () => {
    const client = new SipHeron({ apiKey: 'test-key', timeout: 5000 })
    // @ts-ignore
    expect(client.config.timeout).toBe(5000)
  })
})

describe('SipHeron.anchor input validation', () => {
  const client = new SipHeron({ apiKey: 'test-key' })

  it('throws ValidationError if no file or hash', async () => {
    await expect(client.anchor({} as any)).rejects.toThrow(ValidationError)
  })

  it('throws ValidationError if both file and hash provided', async () => {
    await expect(client.anchor({
      file: Buffer.from('test'),
      hash: 'a'.repeat(64),
    })).rejects.toThrow(ValidationError)
  })

  it('throws ValidationError for invalid hash format', async () => {
    await expect(client.anchor({ hash: 'not-valid' }))
      .rejects.toThrow(ValidationError)
  })
})

describe('SipHeron.verify input validation', () => {
  const client = new SipHeron({ apiKey: 'test-key' })

  it('throws ValidationError if no file or hash', async () => {
    await expect(client.verify({} as any)).rejects.toThrow(ValidationError)
  })

  it('throws ValidationError for invalid hash', async () => {
    await expect(client.verify({ hash: 'bad' }))
      .rejects.toThrow(ValidationError)
  })
})
