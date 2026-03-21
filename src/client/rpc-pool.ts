/**
 * RPC node pool with automatic failover.
 * Rotates through available nodes when one fails.
 */
export class RPCPool {
  private nodes: string[]
  private currentIndex: number = 0
  private failures: Map<string, number> = new Map()

  constructor(nodes: string[]) {
    this.nodes = nodes
  }

  getCurrent(): string {
    return this.nodes[this.currentIndex]
  }

  markFailed(node: string): void {
    const failures = (this.failures.get(node) || 0) + 1
    this.failures.set(node, failures)
    if (failures >= 3) {
      this.rotate()
    }
  }

  markSuccess(node: string): void {
    this.failures.delete(node)
  }

  private rotate(): void {
    this.currentIndex = (this.currentIndex + 1) % this.nodes.length
  }
}

export const DEFAULT_RPC_NODES = {
  devnet: [
    'https://api.devnet.solana.com',
    'https://devnet.helius-rpc.com',
    'https://rpc-devnet.helius.xyz'
  ],
  mainnet: [
    'https://api.mainnet-beta.solana.com',
    'https://rpc.helius.xyz',
    'https://solana-api.projectserum.com'
  ]
}
