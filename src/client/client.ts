import type { AxiosInstance } from 'axios'
import type { SipHeronConfig } from '../types'
import type {
  AnchorOptions,
  AnchorResult,
  BatchAnchorOptions,
  BatchAnchorResult,
  VerifyOptions,
  VerificationResult,
} from '../types'
import { resolveConfig, buildExplorerUrl, buildVerifyUrl } from './config'
import type { ResolvedConfig } from './config'
import { createHttpClient, withRetry } from './http'
import { hashDocument, isValidHash, normalizeHash } from '../hash'
import { ValidationError, AnchorNotFoundError, AnchorRevokedError } from '../errors'

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
   * Anchor a document's SHA-256 fingerprint permanently to Solana.
   *
   * When file is provided, hashing happens locally before anything
   * is transmitted — the document bytes never leave your machine.
   *
   * @param options - Anchor options
   * @returns AnchorResult with transaction details and verification URL
   *
   * @throws {ValidationError} If neither file nor hash is provided
   * @throws {AuthenticationError} If API key is invalid
   * @throws {RateLimitError} If per-second rate limit is exceeded
   * @throws {QuotaExceededError} If monthly quota is exceeded
   * @throws {NetworkError} If network request fails
   *
   * @example
   * const anchor = await sipheron.anchor({
   *   file: fs.readFileSync('./contract.pdf'),
   *   name: 'Service Agreement — Acme Corp',
   * })
   * console.log(anchor.verificationUrl)
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

    // Post to API
    const response = await withRetry(
      () => this.http.post('/api/hashes', {
        hash,
        metadata: options.name || options.metadata?.name || null,
        ...(options.metadata && { tags: Object.keys(options.metadata) }),
      }, { headers }),
      this.config.retries
    )

    return this._mapAnchorResponse(response.data)
  }

  /**
   * Anchor multiple documents in a batch.
   * Processes up to 500 documents per call.
   *
   * @param options - Batch anchor options
   * @returns BatchAnchorResult with individual results
   */
  async anchorBatch(options: BatchAnchorOptions): Promise<BatchAnchorResult> {
    if (!options.documents || options.documents.length === 0) {
      throw new ValidationError('documents array cannot be empty')
    }
    if (options.documents.length > 500) {
      throw new ValidationError('Maximum 500 documents per batch')
    }

    const results: BatchAnchorResult['results'] = []
    let successful = 0
    let failed = 0

    for (const doc of options.documents) {
      try {
        const result = await this.anchor(doc)
        results.push(result)
        successful++
      } catch (error) {
        if (options.stopOnError) throw error
        results.push({
          error: (error as Error).message,
          input: doc,
        })
        failed++
      }
    }

    return { results, successful, failed, total: options.documents.length }
  }

  /**
   * Verify a document against its blockchain anchor.
   *
   * When file is provided, hashing happens locally — the document
   * bytes are never transmitted.
   *
   * @param options - Verify options
   * @returns VerificationResult with authentic boolean and anchor details
   *
   * @throws {ValidationError} If neither file nor hash is provided
   * @throws {AnchorNotFoundError} If no anchor record exists for this hash
   * @throws {AnchorRevokedError} If the anchor has been revoked
   *
   * @example
   * const result = await sipheron.verify({ file })
   * if (result.authentic) {
   *   console.log('Document is authentic')
   * } else {
   *   console.log('Document has been modified')
   * }
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

    const response = await withRetry(
      () => this.http.post('/api/verify', { hash }),
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

    const response = await withRetry(
      () => this.http.get(`/api/hashes/${normalized}/status`),
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
      timestamp: String(anchor.blockTimestamp || anchor.createdAt || ''),
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
