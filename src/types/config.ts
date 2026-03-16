export type NetworkType = 'devnet' | 'mainnet'

export interface SipHeronConfig {
  /** Your SipHeron API key. Get one free at app.sipheron.com */
  apiKey: string
  /** Solana network. Default: 'devnet' */
  network?: NetworkType
  /** Request timeout in milliseconds. Default: 30000 */
  timeout?: number
  /** Number of retry attempts on failure. Default: 3 */
  retries?: number
  /** Override the base API URL. Default: https://api.sipheron.com */
  baseUrl?: string
}
