/**
 * @module client/client
 *
 * @description
 * The `SipHeron` class — the primary entry point for the **hosted platform** mode.
 *
 * Wraps all SipHeron REST API endpoints behind a clean, typed interface.
 * Document hashing **always happens client-side** before any network call;
 * raw document bytes are never transmitted.
 *
 * ### Instantiation
 * ```ts
 * // Devnet (no API key needed for playground endpoints)
 * const sipheron = new SipHeron({ network: 'devnet' })
 *
 * // Mainnet (API key required)
 * const sipheron = new SipHeron({ apiKey: process.env.SIPHERON_API_KEY, network: 'mainnet' })
 * ```
 *
 * ### Key methods
 * | Method            | Description                                              |
 * |-------------------|----------------------------------------------------------|
 * | `anchor(opts)`    | Hash locally then POST to `/api/hashes` (or playground). |
 * | `anchorBatch(opt)`| Anchor up to 500 documents; requires API key.            |
 * | `verify(opts)`    | Hash locally then POST to `/api/verify`.                 |
 * | `verifyHash(hash)`| Verify by pre-computed hash — no file provided.          |
 * | `getStatus(hash)` | Fetch current anchor status by hash.                     |
 * | `list(opts)`      | List all anchors for the authenticated organisation.     |
 *
 * @see {@link SipHeronConfig} for constructor options.
 */
import type { AxiosInstance } from 'axios'
import type { SipHeronConfig } from '../types'
import type {
  AnchorOptions,
  AnchorResult,
  VerifyOptions,
  VerificationResult,
} from '../types'
import { anchorBatch, BatchAnchorOptions, BatchAnchorResult } from '../anchor/batch'
import { resolveConfig, buildExplorerUrl, buildVerifyUrl } from './config'
import type { ResolvedConfig } from './config'
import { createHttpClient, withRetry } from './http'
import { hashDocument, isValidHash, normalizeHash } from '../hash'
import { ValidationError, AnchorRevokedError, AuthenticationError } from '../errors'

/**
 * Main SipHeron VDR client.
 *
 * @example
 * const sipheron = new SipHeron({ apiKey: 'your-key', network: 'devnet' })
 * const anchor = await sipheron.anchor({ file, name: 'Contract v1' })
 * const result = await sipheron.verify({ file })
 */
export class SipHeron {
  private readonly config: ResolvedConfig
  private readonly http: AxiosInstance

  constructor(config: SipHeronConfig) {
    this.config = resolveConfig(config)
    this.http = createHttpClient(this.config)
  }

  /**
   * Anchors a document's SHA-256 fingerprint permanently to
   * the Solana blockchain. The document itself is never
   * transmitted — only its cryptographic fingerprint.
   *
   * @param options - Anchor configuration
   * @param options.file - Document as Buffer. Hashing occurs
   *   locally before any network call. Provide either `file`
   *   or `hash`, not both.
   * @param options.hash - Pre-computed SHA-256 hash (64 hex chars).
   *   Use this when you've already hashed the document yourself.
   * @param options.name - Human-readable document name for
   *   display in the dashboard. Not stored on-chain.
   * @param options.metadata - Arbitrary key-value pairs stored
   *   in SipHeron's database alongside the anchor record.
   *   Not stored on-chain. Max 20 keys, 500 chars per value.
   *
   * @returns Promise resolving to AnchorResult containing the
   *   Solana transaction signature, block number, timestamp,
   *   and permanent verification URL.
   *
   * @throws {AuthenticationError} If API key is invalid or missing
   * @throws {ValidationError} If hash format is invalid
   * @throws {RateLimitError} If monthly quota is exceeded
   * @throws {NetworkError} If Solana RPC is unreachable after retries
   *
   * @example
   * // Anchor from file buffer
   * const file = readFileSync('./contract.pdf')
   * const anchor = await client.anchor({ file, name: 'Q4 Agreement' })
   * console.log(anchor.verificationUrl)
   * // https://verify.sipheron.com/a3f4b2c1...
   *
   * @example
   * // Anchor from pre-computed hash
   * const hash = await hashDocument(fileBuffer)
   * const anchor = await client.anchor({ hash })
   *
   * @see {@link https://docs.sipheron.com/api/anchor}
   * @since 0.1.0
   */
  async anchor(options: AnchorOptions): Promise<AnchorResult> {
    // Validate input
    if (!options.file && !options.hash) {
      throw new ValidationError(
        'Provide either file (Buffer) or hash (string). Neither was provided.'
      )
    }
    if (options.file && options.hash) {
      throw new ValidationError(
        'Provide either file or hash — not both.'
      )
    }

    // Compute hash locally if file provided
    let hash: string
    if (options.file) {
      hash = await hashDocument(options.file)
    } else {
      hash = normalizeHash(options.hash!)
      if (!isValidHash(hash)) {
        throw new ValidationError(
          'Invalid hash format. Must be a 64-character lowercase hex string (SHA-256).'
        )
      }
    }

    // Build request headers
    const headers: Record<string, string> = {}
    if (options.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey
    }

    if (!this.config.apiKey && this.config.network !== 'devnet') {
      throw new AuthenticationError('apiKey is required to anchor on mainnet.')
    }

    const endpoint = !this.config.apiKey ? '/api/playground/anchor' : '/api/hashes'

    // Post to API
    const response = await withRetry(
      () => this.http.post(endpoint, {
        hash,
        filename: options.name || options.metadata?.name || null,
        metadata: options.name || options.metadata?.name || null,
        ...(options.metadata && { tags: Object.keys(options.metadata) }),
      }, { headers }),
      this.config.retries
    )

    return this._mapAnchorResponse(response.data)
  }

  /**
   * Anchors multiple documents in a single batch request efficiently.
   * Instead of waiting for individual Solana transactions, this function
   * submits hashes to the SipHeron queue where they are processed via
   * bulk on-chain transactions or parallelized natively.
   *
   * @param options - Batch anchor configuration
   * @param options.documents - Array of up to 500 documents. Each document
   *   object must contain either `file` (Buffer) or `hash` (string).
   * @param options.stopOnError - If true, the batch fails entirely on the
   *   first error. If false, operations on successful documents continue.
   *
   * @returns Promise resolving to a BatchAnchorResult containing summary stats
   *   and an array of discrete results/errors for each input.
   *
   * @throws {AuthenticationError} If API key is missing (devnet playground
   *   does not support batch operations).
   * @throws {ValidationError} If the batch size exceeds 500 or is empty.
   *
   * @example
   * const results = await client.anchorBatch({
   *   documents: [
   *     { file: buffer1, name: 'Doc 1' },
   *     { file: buffer2, name: 'Doc 2' }
   *   ]
   * })
   * console.log(`Anchored ${results.successful} out of ${results.total}`)
   *
   * @see {@link https://docs.sipheron.com/api/anchor-batch}
   * @since 0.1.0
   */
  async anchorBatch(options: BatchAnchorOptions): Promise<BatchAnchorResult> {
    if (!this.config.apiKey) {
      throw new AuthenticationError('apiKey is required for batch anchoring. Use single anchor() for devnet playground.')
    }
    return anchorBatch(this, options)
  }

  /**
   * Verifies the absolute authenticity of a document against the
   * immutable Solana blockchain. 
   *
   * When providing a `file` buffer, the document is locally hashed,
   * guaranteeing zero-knowledge verification — document bytes are
   * never transmitted over the network.
   *
   * @param options - Verification configuration
   * @param options.file - Document as Buffer to be hashed locally.
   *   Cannot be provided simultaneously with `hash`.
   * @param options.hash - Pre-computed SHA-256 hash string to verify.
   *   Cannot be provided simultaneously with `file`.
   *
   * @returns Promise resolving to VerificationResult. 
   *   `authentic: true` implies a perfect cryptograhic match exists on-chain.
   *   `authentic: false` implies the document has been altered or never existed.
   *
   * @throws {ValidationError} If inputs are malformed or missing both params
   * @throws {AnchorRevokedError} If the document anchor was computationally revoked
   * @throws {NetworkError} If SIPHERON verification nodes are completely unavailable
   *
   * @example
   * const file = readFileSync('./received_contract.pdf')
   * const result = await client.verify({ file })
   * 
   * if (result.authentic) {
   *   console.log('Valid! Anchored at:', result.timestamp)
   * } else {
   *   console.error('TAMPERED OR UNKNOWN DOCUMENT')
   * }
   *
   * @see {@link https://docs.sipheron.com/api/verify}
   * @since 0.1.0
   */
  async verify(options: VerifyOptions): Promise<VerificationResult> {
    if (!options.file && !options.hash) {
      throw new ValidationError(
        'Provide either file (Buffer) or hash (string). Neither was provided.'
      )
    }

    // Compute hash locally if file provided
    let hash: string
    if (options.file) {
      hash = await hashDocument(options.file)
    } else {
      hash = normalizeHash(options.hash!)
      if (!isValidHash(hash)) {
        throw new ValidationError(
          'Invalid hash format. Must be a 64-character hex string (SHA-256).'
        )
      }
    }

    const endpoint = !this.config.apiKey ? '/api/playground/verify' : '/api/verify'

    const response = await withRetry(
      () => this.http.post(endpoint, { hash }),
      this.config.retries
    )

    const data = response.data

    // Handle revoked
    if (data.status === 'REVOKED') {
      throw new AnchorRevokedError(
        hash,
        data.anchor?.revokedAt,
        data.anchor?.revocationNote
      )
    }

    return {
      authentic: data.authentic === true,
      status: this._mapVerifyStatus(data.status),
      hash,
      verifiedAt: data.verified_at,
      anchor: data.anchor ? this._mapAnchorResponse(data) : undefined,
      anchoredHash: data.anchor?.hash,
    }
  }

  /**
   * Get the current status of an anchor by hash.
   *
   * @param hash - 64-character SHA-256 hash
   * @returns AnchorResult with current status
   */
  async getStatus(hash: string): Promise<AnchorResult> {
    const normalized = normalizeHash(hash)
    if (!isValidHash(normalized)) {
      throw new ValidationError('Invalid hash format.')
    }

    const endpoint = !this.config.apiKey 
        ? `/api/hashes/public/${normalized}` 
        : `/api/hashes/${normalized}/status`

    const response = await withRetry(
      () => this.http.get(endpoint),
      this.config.retries
    )

    return this._mapAnchorResponse(response.data)
  }

  /**
   * List anchors for the authenticated organization.
   *
   * @param options - Filtering and pagination options
   */
  async list(options?: {
    page?: number
    limit?: number
    status?: string
    search?: string
  }): Promise<{ records: AnchorResult[]; total: number; page: number; pages: number }> {
    if (!this.config.apiKey) {
      throw new AuthenticationError('apiKey is required to list hashes.')
    }

    const params = new URLSearchParams()
    if (options?.page) params.set('page', String(options.page))
    if (options?.limit) params.set('limit', String(options.limit))
    if (options?.status) params.set('status', options.status)
    if (options?.search) params.set('search', options.search)

    const response = await withRetry(
      () => this.http.get(`/api/hashes?${params}`),
      this.config.retries
    )

    const data = response.data
    const records = (data.records || data.hashes || []).map(
      (r: Record<string, unknown>) => this._mapAnchorResponse({ anchor: r })
    )

    return {
      records,
      total: data.total || 0,
      page: data.page || 1,
      pages: data.pages || 1,
    }
  }

  /**
   * Verify a pre-computed hash without providing the document.
   * Use this when you already have the SHA-256 hash.
   *
   * @param hash - 64-character SHA-256 hash
   * @returns VerificationResult
   */
  async verifyHash(hash: string): Promise<VerificationResult> {
    return this.verify({ hash })
  }

  // ── Private helpers ──

  private _mapAnchorResponse(data: Record<string, unknown>): AnchorResult {
    const anchor = (data.anchor || data.record || data) as Record<string, unknown>
    const blockchain = (data.blockchain || {}) as Record<string, unknown>
    const hash = String(anchor.hash || '')

    const txSig = String(
      anchor.txSignature || blockchain.txSignature || ''
    )

    return {
      id: String(anchor.id || ''),
      hash,
      transactionSignature: txSig,
      blockNumber: Number(anchor.blockNumber || blockchain.blockNumber || 0),
      timestamp: String(anchor.blockTimestamp || anchor.createdAt || anchor.registeredAt || ''),
      verificationUrl: buildVerifyUrl(hash),
      explorerUrl: txSig
        ? buildExplorerUrl(txSig, this.config.network)
        : '',
      status: this._mapStatus(String(anchor.status || 'pending')),
      name: anchor.metadata ? String(anchor.metadata) : undefined,
      contractAddress: this.config.contractAddress,
      network: this.config.network,
    }
  }

  private _mapStatus(status: string): AnchorResult['status'] {
    const s = status.toLowerCase()
    if (s === 'confirmed') return 'confirmed'
    if (s === 'failed') return 'failed'
    if (s === 'revoked') return 'revoked'
    return 'pending'
  }

  private _mapVerifyStatus(status: string): VerificationResult['status'] {
    const s = (status || '').toLowerCase()
    if (s === 'confirmed') return 'authentic'
    if (s === 'revoked') return 'revoked'
    if (s === 'not_found') return 'not_found'
    if (s === 'pending') return 'pending'
    return 'not_found'
  }
}
