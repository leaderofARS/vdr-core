/**
 * @module client/config
 *
 * @description
 * Configuration resolution and URL-builder utilities for the `SipHeron` client.
 *
 * ## Responsibilities
 * - Merges caller-supplied `SipHeronConfig` with library defaults into a fully
 *   resolved `ResolvedConfig` object used throughout the HTTP layer.
 * - Validates that `apiKey` is present when targeting mainnet (enforced at
 *   construction time so errors surface immediately).
 * - Provides URL helpers used to construct verificationUrl and explorerUrl
 *   fields in `AnchorResult` objects.
 *
 * ## Default values
 * | Config key   | Default                          |
 * |--------------|----------------------------------|
 * | `network`    | `'devnet'`                       |
 * | `timeout`    | `30 000` ms                      |
 * | `retries`    | `3`                              |
 * | `baseUrl`    | `https://api.sipheron.com`       |
 * | `appUrl`     | `https://app.sipheron.com`       |
 *
 * @internal
 */
import type { SipHeronConfig, NetworkType } from '../types'

export const DEFAULTS = {
  network: 'devnet' as NetworkType,
  timeout: 30_000,
  retries: 3,
  baseUrls: {
    devnet:  'https://api.sipheron.com',
    mainnet: 'https://api.sipheron.com',
  },
  appUrl: 'https://app.sipheron.com',
  contractAddress: '6ecWPUK87zxwZP2pARJ75wbpCka92mYSGP1szrJxzAwo',
  explorerBase: {
    devnet:  'https://explorer.solana.com',
    mainnet: 'https://explorer.solana.com',
  },
} as const

export interface ResolvedConfig {
  apiKey?: string
  network: NetworkType
  timeout: number
  retries: number
  baseUrl: string
  appUrl: string
  contractAddress: string
  explorerBase: string
}

export function resolveConfig(config: SipHeronConfig): ResolvedConfig {
  const network = config.network ?? DEFAULTS.network

  if (network === 'mainnet' && (!config.apiKey || typeof config.apiKey !== 'string')) {
    throw new Error(
      'apiKey is required for mainnet. Get your free API key at https://app.sipheron.com'
    )
  }

  return {
    apiKey: config.apiKey?.trim(),
    network,
    timeout: config.timeout ?? DEFAULTS.timeout,
    retries: config.retries ?? DEFAULTS.retries,
    baseUrl: config.baseUrl ?? DEFAULTS.baseUrls[network],
    appUrl: DEFAULTS.appUrl,
    contractAddress: DEFAULTS.contractAddress,
    explorerBase: DEFAULTS.explorerBase[network],
  }
}

export function buildExplorerUrl(
  txSignature: string,
  network: NetworkType
): string {
  const base = DEFAULTS.explorerBase[network]
  const cluster = network === 'devnet' ? '?cluster=devnet' : ''
  return `${base}/tx/${txSignature}${cluster}`
}

export function buildVerifyUrl(hash: string): string {
  return `${DEFAULTS.appUrl}/verify/${hash}`
}
