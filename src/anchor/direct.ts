import * as anchor from '@coral-xyz/anchor'
import { Keypair, Connection, PublicKey, SystemProgram } from '@solana/web3.js'
import { hashDocument } from '../hash'
import { SIPHERON_PROGRAM_ID, SOLANA_NETWORKS, estimateAnchorCost, getExplorerUrl } from './solana'
import idl from './idl.json'
import { ValidationError, SolanaConnectionError, TransactionError } from '../errors'

export interface DirectAnchorOptions {
  hash?: string
  buffer?: Buffer
  keypair: Keypair
  network: 'devnet' | 'mainnet'
  metadata?: string
  rpcUrl?: string
}

export interface DirectAnchorResult {
  hash: string
  transactionSignature: string
  network: 'devnet' | 'mainnet'
  explorerUrl: string
  cost: number
  pda: string
}

/**
 * Directly anchors a document hash to the Solana blockchain.
 * Does not require a SipHeron account or API key.
 *
 * Requirements:
 * 1. A Solana Keypair with sufficient SOL (~0.000005 SOL per anchor).
 *
 * @param options DirectAnchorOptions
 * @returns Complete transaction details including the PDA address.
 */
export async function anchorToSolana(options: DirectAnchorOptions): Promise<DirectAnchorResult> {
  const { keypair, network, metadata = 'Direct Anchor via vdr-core', rpcUrl } = options

  if (!options.hash && !options.buffer) {
    throw new ValidationError('Must provide either a hash or file buffer')
  }

  const hashString = options.buffer 
    ? await hashDocument(options.buffer) 
    : options.hash!.toLowerCase()

  const hashBuffer = Buffer.from(hashString, 'hex')
  const hashArray = Array.from(hashBuffer)

  const connectionUrl = rpcUrl || SOLANA_NETWORKS[network]
  const connection = new Connection(connectionUrl, 'confirmed')

  const programId = SIPHERON_PROGRAM_ID[network]

  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(keypair),
    { preflightCommitment: 'confirmed' }
  )

  const program = new anchor.Program(idl as anchor.Idl, provider) as any

  // Derive PDAs
  const [protocolConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('protocol_config')],
    programId
  )

  const [hashPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('hash_record'), hashBuffer, keypair.publicKey.toBuffer()],
    programId
  )

  try {
    // We need to fetch the treasury public key from the protocol config
    // Raw fetch bypasses IDL size mismatches between devnet/mainnet versions during upgrades
    const accountInfo = await connection.getAccountInfo(protocolConfigPda)
    if (!accountInfo) throw new Error('Protocol config not found on-chain')
    
    // discriminator (8) + admin (32) + fee (8) = 48 -> treasury starts at 48
    const treasury = new PublicKey(accountInfo.data.slice(48, 80))

    const txSig = await program.methods
      .registerHash(hashArray, metadata, new anchor.BN(0)) // 0 means no expiry
      .accounts({
        hashRecord: hashPda,
        protocolConfig: protocolConfigPda,
        treasury,
        organization: null, // Only used in managed platform anchors
        owner: keypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([keypair])
      .rpc()

    return {
      hash: hashString,
      transactionSignature: txSig,
      network,
      explorerUrl: getExplorerUrl(txSig, network),
      cost: estimateAnchorCost().lamports,
      pda: hashPda.toBase58()
    }
  } catch (err: any) {
    if (err.message && err.message.includes('fetch')) {
      throw new SolanaConnectionError(`Failed to connect to Solana or fetch protocol config: ${err.message}`)
    }
    throw new TransactionError(`Failed to broadcast transaction: ${err.message}`)
  }
}
