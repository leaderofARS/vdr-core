export type AnchorStatus = 'pending' | 'confirmed' | 'failed' | 'revoked'

export interface AnchorOptions {
  /**
   * Document as Buffer.
   * The document is hashed locally — it never leaves your machine.
   * Provide either file or hash, not both.
   */
  file?: Buffer
  /**
   * Pre-computed SHA-256 hash (64 hex characters).
   * Use this if you have already hashed the document locally.
   * Provide either file or hash, not both.
   */
  hash?: string
  /** Human-readable name for this document */
  name?: string
  /** Optional key-value metadata stored alongside the anchor */
  metadata?: Record<string, string>
  /** Optional idempotency key — prevents duplicate anchors on retry */
  idempotencyKey?: string
}

export interface AnchorResult {
  /** SipHeron anchor record ID */
  id: string
  /** SHA-256 fingerprint of the document (64 hex chars) */
  hash: string
  /** Solana transaction signature */
  transactionSignature: string
  /** Solana block number (slot) where the transaction was included */
  blockNumber: number
  /** ISO 8601 timestamp from the Solana block */
  timestamp: string
  /** Public URL — share this with anyone to let them verify */
  verificationUrl: string
  /** Direct link to the transaction on Solana Explorer */
  explorerUrl: string
  /** Current confirmation status */
  status: AnchorStatus
  /** Document name if provided */
  name?: string
  /** Metadata if provided */
  metadata?: Record<string, string>
  /** SipHeron smart contract address */
  contractAddress: string
  /** Solana network this was anchored on */
  network: string
}

export interface BatchAnchorOptions {
  /** Array of documents to anchor */
  documents: AnchorOptions[]
  /** Stop on first failure. Default: false (continue on failure) */
  stopOnError?: boolean
}

export interface BatchAnchorResult {
  /** Results for each document in the same order as input */
  results: (AnchorResult | { error: string; input: AnchorOptions })[]
  /** Number of successful anchors */
  successful: number
  /** Number of failed anchors */
  failed: number
  /** Total documents processed */
  total: number
}
