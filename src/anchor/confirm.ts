/**
 * Confirmation depth utilities.
 * Defines what "confirmed" means in terms of Solana commitments.
 */

export type ConfirmationLevel = 'processed' | 'confirmed' | 'finalized'

/**
 * Default confirmation level.
 * 'confirmed' = supermajority of validators voted on this block.
 * This is the standard for application-layer confirmation on Solana.
 */
export const DEFAULT_CONFIRMATION: ConfirmationLevel = 'confirmed'

/**
 * Minimum block confirmations before considering an anchor permanent.
 * Used when polling for confirmation status.
 */
export const MIN_CONFIRMATIONS = 1

/**
 * Enterprise-grade confirmation depth.
 * For high-value documents, wait for this many confirmations.
 */
export const ENTERPRISE_CONFIRMATIONS = 32

/**
 * Check if a status string represents a confirmed anchor.
 */
export function isConfirmed(status: string): boolean {
  return status.toLowerCase() === 'confirmed'
}

/**
 * Check if a status is terminal (no further state changes expected).
 */
export function isTerminal(status: string): boolean {
  const s = status.toLowerCase()
  return s === 'confirmed' || s === 'failed' || s === 'revoked'
}

/**
 * Poll for confirmation with exponential backoff.
 * Resolves when status is terminal or maxAttempts is reached.
 *
 * @param getStatus - Function that returns current status string
 * @param maxAttempts - Maximum number of polls. Default: 20
 * @param baseDelayMs - Initial delay between polls. Default: 2000ms
 */
export async function pollForConfirmation(
  getStatus: () => Promise<string>,
  maxAttempts = 20,
  baseDelayMs = 2000
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getStatus()
    if (isTerminal(status)) return status

    if (attempt < maxAttempts - 1) {
      // Exponential backoff capped at 30 seconds
      const delay = Math.min(baseDelayMs * Math.pow(1.5, attempt), 30_000)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  return 'pending'
}
