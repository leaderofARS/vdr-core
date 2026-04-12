/**
 * @module @sipheron/vdr-core
 * @version 1.0.0
 * @license Apache-2.0
 *
 * @description
 * The cryptographic engine of SipHeron VDR.
 * Permanently anchor any document's SHA-256 fingerprint to the Solana
 * blockchain and verify authenticity anywhere — forever.
 *
 * This is the **library entry point**. It re-exports every public symbol
 * from the sub-modules so consumers only need a single import path:
 *
 * ```ts
 * import {
 *   SipHeron,           // Hosted platform client (requires API key)
 *   hashDocument,       // SHA-256 hashing — runs 100 % client-side
 *   anchorToSolana,     // Direct on-chain write (no API key needed)
 *   verifyOnChain,      // Direct on-chain read  (no API key needed)
 *   deriveAnchorAddress // PDA derivation math
 * } from '@sipheron/vdr-core'
 * ```
 *
 * ## Two Operating Modes
 *
 * ### DIRECT — no SipHeron account required
 * Uses public Solana RPC nodes exclusively.
 * - `hashDocument / hashFile / hashStream / hashBase64`
 * - `anchorToSolana`  — write to Solana directly with your own Keypair
 * - `verifyOnChain`   — read from Solana directly
 * - `deriveAnchorAddress` — compute the PDA for any hash + owner pair
 * - `verifyLocally`   — constant-time local comparison (no network)
 *
 * ### HOSTED — managed SipHeron platform (API key required for mainnet)
 * Adds managed analytics, PDF certificates, compliance exports, etc.
 * - `new SipHeron({ apiKey, network })`
 * - `sipheron.anchor()` / `sipheron.anchorBatch()`
 * - `sipheron.verify()` / `sipheron.verifyHash()`
 * - `sipheron.list()` / `sipheron.getStatus()`
 *
 * @see {@link https://app.sipheron.com} SipHeron Dashboard
 * @see {@link https://github.com/SipHeron-VDR/vdr-core} Source Repository
 */

// ── Main client ──
export { SipHeron, withRetry, DEFAULT_RETRY_CONFIG, RPCPool, DEFAULT_RPC_NODES, AnchorMonitor } from './client'
export type { RetryConfig, AnchorMonitorEvents } from './client'

export { anchorBatch } from './anchor'
export type { BatchAnchorOptions, BatchItemResult, BatchAnchorResult } from './anchor'

// ── Standalone functions ──
export { 
  hashDocument, hashFile, hashFileStream, hashFileWithProgress, 
  hashStream, hashBase64, isValidHash, normalizeHash, getAlgorithmInfo 
} from './hash'
export { hashDocumentBrowser, hashAuto } from './hash'
export { verifyHashStandalone as verifyHash } from './verify'
export { verifyLocally, verifyOnChain, deriveAnchorAddress } from './verify'
export { verifyWebhookSignature, parseWebhookEvent, webhookMiddleware } from './webhook'
export { VerificationCache } from './verify/cache'
export { PipelineModule } from './pipeline'

// ── Report utilities ──
export { generatePdfReport } from './report/index'
export type { ReportOptions } from './report/index'

// ── Certificate utilities ──
export {
  generateCertificateId,
  buildCertificateUrl,
  prepareCertificateData,
  getCertificateProofText,
} from './certificate'

// ── Metadata Schema & Validation ──
export { 
  validateMetadata, LEGAL_CONTRACT_SCHEMA, CLINICAL_TRIAL_SCHEMA 
} from './schema'
export type { MetadataSchema, ValidationResult, ValidationSuccess, ValidationFailure } from './schema'

// ── Solana utilities ──
export {
  getExplorerUrl,
  isValidTxSignature,
  estimateAnchorCost,
  SIPHERON_CONTRACT,
  SIPHERON_PROGRAM_ID,
  ANCHOR_SEED,
  PROTOCOL_VERSION,
  MAX_BATCH_SIZE,
  HASH_LENGTH,
  CONFIRMATION_DEPTH,
  SOLANA_NETWORKS,
  anchorToSolana,
} from './anchor'

// ── Types ──
export type {
  SipHeronConfig,
  NetworkType,
  AnchorOptions,
  AnchorResult,
  AnchorStatus,
  HashAlgorithm,
  HashOptions,
  RevocationReason,
  RevocationRecord,
  DirectAnchorOptions,
  DirectAnchorResult,
  VerifyOptions,
  VerificationResult,
  VerificationStatus,
  OnChainVerificationOptions,
  OnChainVerificationResult,
  WebhookEventType,
  WebhookEvent,
  AnchorCreatedEvent,
  AnchorConfirmedEvent,
  AnchorFailedEvent,
  VerificationPerformedEvent,
  QuotaWarningEvent,
  AnomalyDetectedEvent,
  PipelineEventType,
  PipelineEventPayload,
  PipelineEventResult,
  PipelineConfig,
  PipelineSessionSummary,
  ComplianceFramework,
  RiskLevel
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
  SolanaConnectionError,
  TransactionError
} from './errors'

// Stub exports needed for vdr-ts roadmap compilation
export type VersionChain = any;
export type VersionChainNode = any;
export type PdfReportOptions = any;
export const getVersionChain: any = () => {};
export const revoke: any = () => {};

