/**
 * @sipheron/vdr-core
 *
 * Core document verification library for SipHeron VDR.
 * Anchor any document's SHA-256 fingerprint permanently to Solana.
 * Verify authenticity anywhere, forever.
 *
 * @example
 * import { SipHeron } from '@sipheron/vdr-core'
 *
 * const sipheron = new SipHeron({ apiKey: 'your-key', network: 'devnet' })
 *
 * const anchor = await sipheron.anchor({ file, name: 'Contract v1' })
 * console.log(anchor.verificationUrl)
 *
 * const result = await sipheron.verify({ file })
 * console.log(result.authentic) // true
 */

// ── Main client ──
export { SipHeron } from './client'

// ── Standalone functions ──
export { hashDocument, isValidHash, normalizeHash } from './hash'
export { verifyHashStandalone as verifyHash } from './verify'
export { verifyLocally } from './verify'

// ── Certificate utilities ──
export {
  generateCertificateId,
  buildCertificateUrl,
  prepareCertificateData,
  getCertificateProofText,
} from './certificate'

// ── Solana utilities ──
export {
  getExplorerUrl,
  isValidTxSignature,
  estimateAnchorCost,
  SIPHERON_CONTRACT,
} from './anchor'

// ── Types ──
export type {
  SipHeronConfig,
  NetworkType,
  AnchorOptions,
  AnchorResult,
  AnchorStatus,
  BatchAnchorOptions,
  BatchAnchorResult,
  VerifyOptions,
  VerificationResult,
  VerificationStatus,
  WebhookEventType,
  WebhookEvent,
  AnchorCreatedEvent,
  AnchorConfirmedEvent,
  AnchorFailedEvent,
  VerificationPerformedEvent,
  QuotaWarningEvent,
  AnomalyDetectedEvent,
} from './types'

// Re-export certificate type (not in types/index.ts)
export type { CertificateData } from './certificate'

// ── Errors ──
export {
  SipHeronError,
  AuthenticationError,
  AnchorNotFoundError,
  HashMismatchError,
  NetworkError,
  RateLimitError,
  ValidationError,
  AnchorRevokedError,
  QuotaExceededError,
} from './errors'
