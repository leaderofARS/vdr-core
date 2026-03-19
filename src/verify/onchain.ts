/**
 * @module verify/onchain
 *
 * @description
 * **Direct on-chain verification** — no SipHeron account or API key required.
 *
 * Reads anchor records directly from the Solana blockchain via JSON-RPC,
 * bypassing the SipHeron managed API entirely. Any engineer can run this code
 * against a public Solana RPC node and confirm anchors independently.
 *
 * ## `deriveAnchorAddress(hash, ownerPublicKey, networkOrId)`
 * Computes the Program Derived Address (PDA) for a given hash + owner pair.
 * - Pure math — no network call.
 * - Accepts either a `'devnet' | 'mainnet'` network string (uses the default
 *   SipHeron program ID) or a custom `PublicKey` for use with your own program.
 *
 * ## `verifyOnChain(options)`
 * Fetches the `hashRecord` account at the derived PDA and checks:
 * 1. The account exists (record was anchored).
 * 2. `isRevoked` is `false`.
 * Returns full record metadata: `owner`, `timestamp`, `metadata`, `pda`.
 *
 * ### Custom program support
 * Pass `programId` (base58 string) in the options to target a different
 * deployed VDR program than the default SipHeron contract.
 *
 * @example
 * ```ts
 * import { verifyOnChain } from '@sipheron/vdr-core'
 * import { PublicKey } from '@solana/web3.js'
 *
 * const result = await verifyOnChain({
 *   hash: documentHash,
 *   network: 'mainnet',
 *   ownerPublicKey: new PublicKey('issuerWalletAddress...'),
 * })
 *
 * console.log(result.authentic)  // true
 * console.log(result.timestamp)  // Unix seconds when anchored
 * ```
 *
 * @see {@link OnChainVerificationOptions}
 * @see {@link OnChainVerificationResult}
 */
import { Connection, PublicKey, Keypair } from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor'
import { SIPHERON_PROGRAM_ID, SOLANA_NETWORKS } from '../anchor/solana'
import idl from '../anchor/idl.json'
import { hashDocument } from '../hash'
import { ValidationError, SolanaConnectionError } from '../errors'

export interface OnChainVerificationOptions {
  hash?: string
  buffer?: Buffer
  network: 'devnet' | 'mainnet'
  rpcUrl?: string
  ownerPublicKey?: PublicKey | string
  /**
   * Override the Solana program ID to use for verification.
   * Defaults to the SipHeron VDR contract: 6ecWPUK87zxwZP2pARJ75wbpCka92mYSGP1szrJxzAwo
   * Supply your own base58 program address here if you have deployed
   * a fork or a custom VDR program.
   */
  programId?: string
}

export interface OnChainVerificationResult {
  authentic: boolean
  hash: string
  pda?: string
  owner?: string
  timestamp?: number
  isRevoked?: boolean
  metadata?: string
}

/**
 * Derive the Program Derived Address (PDA) for any anchor record.
 *
 * @param hashString     - 64-char hex SHA-256 hash of the document
 * @param ownerPublicKey - Solana public key of the document owner
 * @param networkOrId    - network name ('devnet' | 'mainnet') OR a custom
 *                         PublicKey pointing to your own deployed program.
 *                         Defaults to the SipHeron VDR program.
 *
 * @example
 * // Default (SipHeron program)
 * deriveAnchorAddress(hash, ownerPk, 'mainnet')
 *
 * // Custom program
 * deriveAnchorAddress(hash, ownerPk, new PublicKey('YourProgram...'))
 */
export function deriveAnchorAddress(
  hashString: string,
  ownerPublicKey: PublicKey,
  networkOrId: 'devnet' | 'mainnet' | PublicKey
): PublicKey {
  const hashBuffer = Buffer.from(hashString, 'hex')
  const programId =
    networkOrId instanceof PublicKey
      ? networkOrId
      : SIPHERON_PROGRAM_ID[networkOrId]

  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('hash_record'), hashBuffer, ownerPublicKey.toBuffer()],
    programId
  )
  return pda
}

/**
 * Verify an anchor record directly by reading the Solana blockchain.
 * Does not require a SipHeron API key or server connection.
 */
export async function verifyOnChain(options: OnChainVerificationOptions): Promise<OnChainVerificationResult> {
  const { network, rpcUrl, ownerPublicKey, programId: customProgramId } = options

  if (!options.hash && !options.buffer) {
    throw new ValidationError('Must provide either a hash or file buffer')
  }

  if (!ownerPublicKey) {
    throw new ValidationError('ownerPublicKey is required for direct on-chain verification in v1 layout')
  }

  const hashString = options.buffer 
    ? await hashDocument(options.buffer) 
    : options.hash!.toLowerCase()

  const connectionUrl = rpcUrl || SOLANA_NETWORKS[network]
  const connection = new Connection(connectionUrl, 'confirmed')

  const ownerPk = typeof ownerPublicKey === 'string' 
    ? new PublicKey(ownerPublicKey) 
    : ownerPublicKey

  const resolvedProgramId = customProgramId
    ? new PublicKey(customProgramId)
    : SIPHERON_PROGRAM_ID[network]

  const pda = deriveAnchorAddress(hashString, ownerPk, resolvedProgramId)

  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(Keypair.generate()), // Dummy wallet — read-only, no signing needed
    {}
  )
  const program = new anchor.Program(idl as anchor.Idl, provider) as any

  try {
    const record = await program.account.hashRecord.fetch(pda)

    return {
      authentic: !record.isRevoked,
      hash: hashString,
      pda: pda.toBase58(),
      owner: (record.owner as PublicKey).toBase58(),
      timestamp: (record.timestamp as anchor.BN).toNumber(),
      isRevoked: record.isRevoked as boolean,
      metadata: record.metadata as string,
    }
  } catch (err: any) {
    if (err.message && err.message.includes('Account does not exist')) {
       return {
         authentic: false,
         hash: hashString,
       }
    }
    throw new SolanaConnectionError(`Failed to verify on chain: ${err.message}`)
  }
}
