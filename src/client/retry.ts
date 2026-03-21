export interface RetryConfig {
  maxAttempts: number      // default: 3
  baseDelayMs: number      // default: 1000
  maxDelayMs: number       // default: 30000
  backoffMultiplier: number // default: 2
  retryableErrors: string[] // error codes that should retry
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
      const isRetryable = cfg.retryableErrors.some(code =>
        (error as any).code === code
      )

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
