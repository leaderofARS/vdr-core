/**
 * Solana-specific utilities for the vdr-core library.
 *
 * Note: This module provides utilities for working with Solana
 * transaction data — it does NOT handle transaction signing
 * or wallet key management. Those operations happen server-side
 * in the SipHeron platform.
 *
 * For direct Solana integration, use the SipHeron API.
 */

export const SOLANA_NETWORKS = {
  devnet:  'https://api.devnet.solana.com',
  mainnet: 'https://api.mainnet-beta.solana.com',
} as const

export const SIPHERON_CONTRACT = '6ecWPUK87zxwZP2pARJ75wbpCka92mYSGP1szrJxzAwo'

export const EXPLORER_URLS = {
  devnet: {
    tx:      (sig: string) => `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
    address: (addr: string) => `https://explorer.solana.com/address/${addr}?cluster=devnet`,
    block:   (slot: number) => `https://explorer.solana.com/block/${slot}?cluster=devnet`,
  },
  mainnet: {
    tx:      (sig: string) => `https://explorer.solana.com/tx/${sig}`,
    address: (addr: string) => `https://explorer.solana.com/address/${addr}`,
    block:   (slot: number) => `https://explorer.solana.com/block/${slot}`,
  },
} as const

/**
 * Build a Solana Explorer URL for a transaction.
 */
export function getExplorerUrl(
  txSignature: string,
  network: 'devnet' | 'mainnet' = 'devnet'
): string {
  return EXPLORER_URLS[network].tx(txSignature)
}

/**
 * Validate a Solana transaction signature format.
 * Signatures are base58-encoded 64-byte values — typically 87-88 chars.
 */
export function isValidTxSignature(sig: string): boolean {
  return typeof sig === 'string' &&
         sig.length >= 43 &&
         sig.length <= 128 &&
         /^[1-9A-HJ-NP-Za-km-z]+$/.test(sig)
}

/**
 * Estimate the approximate SOL cost of anchoring a document.
 * Based on average Solana transaction fees as of 2026.
 */
export function estimateAnchorCost(): {
  lamports: number
  sol: number
  usdApprox: string
} {
  const lamports = 5000 // ~0.000005 SOL per transaction
  return {
    lamports,
    sol: lamports / 1_000_000_000,
    usdApprox: '< $0.01',
  }
}
