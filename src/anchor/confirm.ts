/**
 * @module anchor/confirm
 *
 * @description
 * Solana confirmation-depth utilities.
 *
 * Solana has three commitment levels that describe how "final" a block is:
 *
 * | Level       | Meaning                                                         |
 * |-------------|-----------------------------------------------------------------|
 * | `processed` | Block has been processed by this node but not yet voted on.     |
 * | `confirmed` | Supermajority of validators voted on this block. ✅ Default.   |
 * | `finalized` | Block reached maximum lockout — economically irreversible. 🔒  |
 *
 * ## Contents
 * - `ConfirmationLevel`       — Union type of the three commitment levels.
 * - `DEFAULT_CONFIRMATION`    — `'confirmed'` — safe for most applications.
 * - `MIN_CONFIRMATIONS`       — Minimum block count before treating as permanent.
 * - `ENTERPRISE_CONFIRMATIONS`— Depth threshold for high-value document use cases.
 * - `isConfirmed(status)`     — Returns `true` when status === `'confirmed'`.
 * - `isTerminal(status)`      — Returns `true` when no further state change is expected.
 * - `pollForConfirmation(fn)` — Polls with exponential backoff until terminal status.
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
 * Enterprise-grade confirmation depth heuristic.
 * 
 * NOTE: Solana finality is time/slot-based rather than confirmation-count based.
 * 32 slots (roughly 13-15 seconds) is the traditional threshold for maximum 
 * confidence before a block is considered irreversible by the cluster.
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
