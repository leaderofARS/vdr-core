/**
 * @module anchor/solana
 *
 * @description
 * Solana-specific constants and utility functions for the VDR SDK.
 *
 * This module is a **pure utility layer** — it does not send any transactions
 * or manage private keys. All signing happens in `anchor/direct.ts` using the
 * caller-supplied `Keypair`.
 *
 * ## Constants
 * | Name                     | Value / Description                                        |
 * |--------------------------|------------------------------------------------------------|
 * | `SOLANA_NETWORKS`        | Public RPC endpoints for devnet and mainnet.               |
 * | `SIPHERON_PROGRAM_ID`    | `PublicKey` map keyed by network for the VDR contract.     |
 * | `SIPHERON_CONTRACT`      | Base58 string of the deployed program address.             |
 * | `ANCHOR_SEED`            | PDA seed string prefix (`'anchor'`).                       |
 * | `PROTOCOL_VERSION`       | Current on-chain protocol version integer.                 |
 * | `MAX_BATCH_SIZE`         | Maximum documents per batch anchor call (500).             |
 * | `HASH_LENGTH`            | Required SHA-256 hex digest length (64 chars).             |
 * | `CONFIRMATION_DEPTH`     | Enterprise confirmation block depth (32).                  |
 * | `EXPLORER_URLS`          | Helper functions for Solana Explorer deep-links.           |
 *
 * ## Functions
 * - `getExplorerUrl(txSig, network)` — Build a Solana Explorer URL for a transaction.
 * - `isValidTxSignature(sig)`        — Validate base58 tx signature format.
 * - `estimateAnchorCost()`           — Return estimated lamport cost per anchor.
 */


import { PublicKey } from '@solana/web3.js'

export const SOLANA_NETWORKS = {
  devnet:  'https://api.devnet.solana.com',
  mainnet: 'https://api.mainnet-beta.solana.com',
} as const

export const SIPHERON_CONTRACT_BASE58 = '6ecWPUK87zxwZP2pARJ75wbpCka92mYSGP1szrJxzAwo'

export const SIPHERON_PROGRAM_ID = {
  devnet: new PublicKey(SIPHERON_CONTRACT_BASE58),
  mainnet: new PublicKey(SIPHERON_CONTRACT_BASE58)
}

export const ANCHOR_SEED = 'anchor'
export const PROTOCOL_VERSION = 1
export const MAX_BATCH_SIZE = 500
export const HASH_LENGTH = 64
export const CONFIRMATION_DEPTH = 32

export const SIPHERON_CONTRACT = SIPHERON_CONTRACT_BASE58

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
