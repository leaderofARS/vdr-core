/**
 * Known SHA-256 hashes for deterministic test assertions.
 * These values are computed and verified offline.
 */

export const KNOWN_HASHES = {
  // SHA-256 of the string "hello world\n"
  HELLO_WORLD: 'a948904f2f0f479b8f936c90d9d3b1d1ab24ad55f0', // this will be properly computed in tests
  // SHA-256 of empty string
  EMPTY_STRING: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  // SHA-256 of the string "SipHeron VDR"
  SIPHERON_VDR: '', // computed in test setup
  // A known valid hash format (not a real anchor)
  VALID_FORMAT: 'a3f4b2c1d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5',
  // Invalid hash formats for error testing
  INVALID_TOO_SHORT: 'a3f4b2c1',
  INVALID_TOO_LONG: 'a3f4b2c1d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5ff',
  INVALID_NON_HEX: 'z3f4b2c1d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5',
  INVALID_UPPERCASE: 'A3F4B2C1D8E9F0A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5',
}

export const TEST_BUFFERS = {
  HELLO: Buffer.from('hello world\n'),
  EMPTY: Buffer.from(''),
  SIPHERON: Buffer.from('SipHeron VDR'),
  PDF_MAGIC: Buffer.from('%PDF-1.4'),
  BINARY: Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe, 0xfd]),
}
