import { describe, it, expect } from '@jest/globals'
import {
  hexToBuffer,
  bufferToHex,
  constantTimeCompare,
  formatFileSize,
  truncateHash,
} from '../../src/hash'

describe('hexToBuffer / bufferToHex roundtrip', () => {
  it('converts hex to buffer and back', () => {
    const hex = 'a3f4b2c1d8e9f0a1'
    const buf = hexToBuffer(hex)
    expect(bufferToHex(buf)).toBe(hex)
  })
})

describe('constantTimeCompare', () => {
  it('returns true for identical strings', () => {
    expect(constantTimeCompare('abc', 'abc')).toBe(true)
  })

  it('returns false for different strings of same length', () => {
    expect(constantTimeCompare('abc', 'abd')).toBe(false)
  })

  it('returns false for different lengths', () => {
    expect(constantTimeCompare('ab', 'abc')).toBe(false)
  })

  it('returns true for empty strings', () => {
    expect(constantTimeCompare('', '')).toBe(true)
  })

  it('is case sensitive', () => {
    expect(constantTimeCompare('ABC', 'abc')).toBe(false)
  })
})

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500.00 B')
  })
  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1.00 KB')
  })
  it('formats megabytes', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.00 MB')
  })
  it('formats gigabytes', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB')
  })
  it('handles zero', () => {
    expect(formatFileSize(0)).toBe('0 B')
  })
})

describe('truncateHash', () => {
  const fullHash = 'a3f4b2c1d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5'

  it('truncates long hashes', () => {
    const result = truncateHash(fullHash, 8)
    expect(result).toBe('a3f4b2c1...d2e3f4a5')
  })

  it('returns short strings unchanged', () => {
    expect(truncateHash('abc', 8)).toBe('abc')
  })
})
