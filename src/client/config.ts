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
