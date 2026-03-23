import { 
  validateMetadata, 
  LEGAL_CONTRACT_SCHEMA, 
  CLINICAL_TRIAL_SCHEMA 
} from '../../src/schema'

describe('Metadata Schema Validation', () => {
  test('Legal Contract Schema — Valid Input', () => {
    const metadata = {
      document_type: 'nda',
      party_1: 'Acme Corp',
      party_2: 'SipHeron VDR',
      effective_date: '2026-03-24',
      value_usd: 50000,
    }
    const result = validateMetadata(metadata, LEGAL_CONTRACT_SCHEMA)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('Legal Contract Schema — Missing Required Field', () => {
    const metadata = {
      party_1: 'Acme Corp',
      party_2: 'SipHeron VDR',
      effective_date: '2026-03-24',
    }
    // Missing document_type
    const result = validateMetadata(metadata, LEGAL_CONTRACT_SCHEMA)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('document_type'))).toBe(true)
  })

  test('Legal Contract Schema — Enum Validation', () => {
    const metadata = {
      document_type: 'invalid_type', // Not in ['contract', 'nda', ...]
      party_1: 'Acme Corp',
      party_2: 'SipHeron VDR',
      effective_date: '2026-03-24',
    }
    const result = validateMetadata(metadata, LEGAL_CONTRACT_SCHEMA)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('document_type'))).toBe(true)
  })

  test('Clinical Trial Schema — Pattern (Regex) Validation', () => {
    const metadata = {
      trial_id: 'CT123456',
      document_type: 'protocol',
      site_id: 'SITE_NY_01',
    }
    const result = validateMetadata(metadata, CLINICAL_TRIAL_SCHEMA)
    expect(result.valid).toBe(true)
  })

  test('Clinical Trial Schema — Invalid Pattern', () => {
    const metadata = {
      trial_id: 'ct123', // Lowercase and too short
      document_type: 'protocol',
      site_id: 'SITE_NY_01',
    }
    const result = validateMetadata(metadata, CLINICAL_TRIAL_SCHEMA)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('trial_id'))).toBe(true)
  })

  test('Type Validation — Number and Date', () => {
    const metadata = {
      document_type: 'contract',
      party_1: 'A',
      party_2: 'B',
      effective_date: 'not_a_date',
      value_usd: 'not_a_number',
    }
    const result = validateMetadata(metadata, LEGAL_CONTRACT_SCHEMA)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('effective_date'))).toBe(true)
    expect(result.errors.some(e => e.includes('value_usd'))).toBe(true)
  })
})
