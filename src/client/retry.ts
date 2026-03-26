/**
 * @module client/retry
 * 
 * @description
 * Generic retry logic with exponential backoff for SipHeron VDR operations.
 */

export interface RetryConfig {
  /** Maximum number of attempts including the first call. */
  maxAttempts: number      // default: 3
  /** Initial delay before first retry in milliseconds. */
  baseDelayMs: number      // default: 1000
  /** Maximum delay between retries in milliseconds. */
  maxDelayMs: number       // default: 30000
  /** Factor to multiply delay by after each failed attempt. */
  backoffMultiplier: number // default: 2
  /** Error codes (from SipHeronError.code) that should trigger a retry. */
  retryableErrors: string[] // error codes that should retry
  /** Optional custom predicate to determine if an error is retryable. */
  shouldRetry?: (error: any) => boolean
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: [
    'NETWORK_ERROR',
    'SOLANA_CONNECTION_ERROR',
    'RATE_LIMIT_ERROR',
    'TRANSACTION_TIMEOUT'
  ]
}

/**
 * Wraps an asynchronous operation with exponential backoff retry logic.
 * 
 * @param operation - The async function to execute.
 * @param config - Partial retry configuration to override defaults.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const cfg = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: Error

  for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      let isRetryable = false
      
      if (cfg.shouldRetry) {
        isRetryable = cfg.shouldRetry(error)
      } else {
        isRetryable = cfg.retryableErrors.some(code =>
          (error as any).code === code
        )
      }

      if (!isRetryable || attempt === cfg.maxAttempts) {
        throw error
      }

      const delay = Math.min(
        cfg.baseDelayMs * Math.pow(cfg.backoffMultiplier, attempt - 1),
        cfg.maxDelayMs
      )

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}
