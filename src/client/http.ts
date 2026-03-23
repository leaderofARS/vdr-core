/**
 * @module client/http
 *
 * @description
 * Axios-based HTTP client factory and retry logic for the SipHeron REST API.
 *
 * ## `createHttpClient(config)`
 * Creates a pre-configured `AxiosInstance` that:
 * - Sets `baseURL`, `timeout`, and standard headers automatically.
 * - Forces IPv4 via `httpsAgent`/`httpAgent` to avoid IPv6 resolution issues
 *   in some Node.js environments.
 * - Attaches a **response interceptor** that maps HTTP error codes to strongly
 *   typed `SipHeronError` subclasses, giving callers programmatic error handling:
 *
 * | HTTP Status | Thrown class          |
 * |-------------|-----------------------|
 * | 401         | `AuthenticationError` |
 * | 400         | `ValidationError`     |
 * | 404         | `AnchorNotFoundError` |
 * | 429 (quota) | `QuotaExceededError`  |
 * | 429 (rate)  | `RateLimitError`      |
 * | 5xx         | `NetworkError`        |
 *
 * ## `withRetry(fn, maxAttempts)`
 * Wraps any async function with **exponential backoff**:
 * - Retries on `RateLimitError`, `NetworkError`, and 5xx server errors.
 * - Does **not** retry on client errors (4xx) except rate limits.
 * - Each attempt doubles the sleep delay, starting at 1 second.
 *
 * @internal
 */
import axios, { AxiosInstance, AxiosError } from 'axios'
import http from 'http'
import https from 'https'
import type { ResolvedConfig } from './config'
import {
  AuthenticationError,
  NetworkError,
  RateLimitError,
  QuotaExceededError,
  ValidationError,
  AnchorNotFoundError,
  SipHeronError,
} from '../errors'

export function createHttpClient(config: ResolvedConfig): AxiosInstance {
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': '@sipheron/vdr-core/0.1.0 Node/' + process.version,
  }

  if (config.apiKey) {
    defaultHeaders['x-api-key'] = config.apiKey
  }

  const instance = axios.create({
    baseURL: config.baseUrl,
    timeout: config.timeout,
    headers: defaultHeaders,
    httpsAgent: new https.Agent({ family: 4 }),
    httpAgent: new http.Agent({ family: 4 }),
  })

  // Response interceptor — map HTTP errors to typed SipHeron errors
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (!error.response) {
        // Network error — no response received
        throw new NetworkError(
          `Network request failed: ${error.message}`,
          error
        )
      }

      const { status, data } = error.response
      const body = data as Record<string, unknown>
      const message = String(body?.message || body?.error || error.message)

      switch (status) {
        case 401:
          throw new AuthenticationError(message)

        case 400:
          throw new ValidationError(message)

        case 404:
          throw new AnchorNotFoundError(
            String(body?.hash || 'unknown')
          )

        case 429: {
          const errorCode = String(body?.error || '')

          if (errorCode === 'MONTHLY_QUOTA_EXCEEDED') {
            const limit = body?.limit as Record<string, unknown>
            throw new QuotaExceededError(
              Number(limit?.used ?? 0),
              Number(limit?.limit ?? 0),
              String(limit?.resetAt ?? ''),
              String(body?.upgrade ?? '')
            )
          }

          const retryAfter = Number(
            error.response.headers['retry-after'] ?? 60
          )
          throw new RateLimitError(
            retryAfter,
            String(body?.plan ?? ''),
            String(body?.upgrade ?? '')
          )
        }

        case 500:
        case 502:
        case 503:
          throw new NetworkError(`Server error (${status}): ${message}`)

        default:
          throw new SipHeronError(message, 'API_ERROR', status)
      }
    }
  )

  return instance
}

/**
 * Retry a function with exponential backoff.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Do not retry on client errors (4xx) except rate limits
      if (error instanceof SipHeronError) {
        const isRetryable =
          error instanceof RateLimitError ||
          error instanceof NetworkError ||
          (error.statusCode !== undefined && error.statusCode >= 500)

        if (!isRetryable) throw error
      }

      if (attempt === maxAttempts) break

      const delay = baseDelayMs * Math.pow(2, attempt - 1)
      await sleep(delay)
    }
  }

  throw lastError!
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
