/**
 * Base error class for all SipHeron errors.
 * All errors have a machine-readable code for programmatic handling.
 */
export class SipHeronError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number
  ) {
    super(message)
    this.name = 'SipHeronError'
    // Maintains proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

/**
 * Thrown when the API key is missing, invalid, or revoked.
 */
export class AuthenticationError extends SipHeronError {
  constructor(message = 'Invalid or missing API key.') {
    super(message, 'AUTHENTICATION_ERROR', 401)
    this.name = 'AuthenticationError'
  }
}

/**
 * Thrown when no anchor record is found for the given hash.
 */
export class AnchorNotFoundError extends SipHeronError {
  constructor(public readonly hash: string) {
    super(
      `No anchor record found for hash: ${hash.slice(0, 16)}...`,
      'ANCHOR_NOT_FOUND',
      404
    )
    this.name = 'AnchorNotFoundError'
  }
}

/**
 * Thrown when the document hash does not match the anchored hash.
 * This means the document has been modified since anchoring.
 */
export class HashMismatchError extends SipHeronError {
  constructor(
    public readonly computedHash: string,
    public readonly anchoredHash: string
  ) {
    super(
      'Document hash does not match anchor record. The document may have been modified.',
      'HASH_MISMATCH'
    )
    this.name = 'HashMismatchError'
  }
}

/**
 * Thrown when a network request fails.
 */
export class NetworkError extends SipHeronError {
  constructor(message: string, public readonly originalError?: Error) {
    super(message, 'NETWORK_ERROR')
    this.name = 'NetworkError'
  }
}

/**
 * Thrown when the API rate limit is exceeded.
 * Check retryAfter to know when to retry.
 */
export class RateLimitError extends SipHeronError {
  constructor(
    public readonly retryAfter: number,
    public readonly plan?: string,
    public readonly upgradeUrl = 'https://app.sipheron.com/dashboard/billing'
  ) {
    super(
      `Rate limit exceeded. Retry after ${retryAfter} seconds.`,
      'RATE_LIMIT_ERROR',
      429
    )
    this.name = 'RateLimitError'
  }
}

/**
 * Thrown when request parameters are invalid.
 */
export class ValidationError extends SipHeronError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

/**
 * Thrown when an anchor has been revoked.
 */
export class AnchorRevokedError extends SipHeronError {
  constructor(
    public readonly hash: string,
    public readonly revokedAt?: string,
    public readonly reason?: string
  ) {
    super(
      `Anchor for hash ${hash.slice(0, 16)}... has been revoked.`,
      'ANCHOR_REVOKED'
    )
    this.name = 'AnchorRevokedError'
  }
}

/**
 * Thrown when the monthly quota is exceeded.
 */
export class QuotaExceededError extends SipHeronError {
  constructor(
    public readonly used: number,
    public readonly limit: number,
    public readonly resetAt: string,
    public readonly upgradeUrl = 'https://app.sipheron.com/dashboard/billing'
  ) {
    super(
      `Monthly anchor quota exceeded (${used}/${limit}). Resets at ${resetAt}.`,
      'QUOTA_EXCEEDED',
      429
    )
    this.name = 'QuotaExceededError'
  }
}
