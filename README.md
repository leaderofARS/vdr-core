# @sipheron/vdr-core

**The Cryptographic Engine of SipHeron VDR.**

SipHeron VDR is a protocol for permanently notarizing documents to the Solana blockchain.
`@sipheron/vdr-core` is the independent, foundational SDK that allows developers to interact with the SipHeron smart contract on Solana — either fully independently (no API key required) or via the managed SipHeron platform.

## The Architecture Visualization

```text
@sipheron/vdr-core
│
├── DIRECT (no SipHeron account needed)
│   ├── hashDocument()          — SHA-256 client-side
│   ├── anchorToSolana()        — Direct blockchain write
│   ├── verifyOnChain()         — Direct blockchain read
│   ├── deriveAnchorAddress()   — PDA derivation
│   └── verifyWebhookSignature() — HMAC verification
│
└── HOSTED (SipHeron API key required)
    └── SipHeron (Client)
        ├── anchors.create()
        ├── anchors.get()
        ├── verify.check()
```

The separation between DIRECT and HOSTED is very deliberate. Any sophisticated buyer or external auditor can view the open source implementation in `vdr-core` and confirm that we offer **true, autonomous cryptographic independence**. `anchorToSolana()` and `verifyOnChain()` work purely using RPC nodes. By utilizing our hosted features, you only gain convenience — metadata, certificates, dashboards, and compliance features — without giving up the fundamental blockchain promise.

---

## Installation

```bash
npm install @sipheron/vdr-core
# and the peer dependency if utilizing Direct On-Chain functions
npm install @solana/web3.js
```

---

## 1. Direct, On-Chain Usage (Open Source)
No API keys, no monthly fees (beyond Solana gas), no dashboard. You talk directly with the immutable smart contract. 

### A. Document Hashing (Client-Side)
Everything is generated client-side to ensure documents never touch external servers unhashed.

```typescript
import { hashDocument, hashFile, hashStream, hashBase64 } from '@sipheron/vdr-core'

// Browser: File / Blob
const hash1 = await hashDocument(fileBuffer)

// Node.js: Disc files
const hash2 = await hashFile('/path/to/contract.pdf')

// Streams (Node or Web Streams)
const hash3 = await hashStream(readableStream)

// APIs: Base64
const hash4 = await hashBase64('JVBERi0xLjQKJcOkw...')
```

### B. Direct Anchoring to Solana
You bring your own Solana Keypair. The library invokes the SipHeron Contract on-chain directly via JSON RPC.

```typescript
import { anchorToSolana } from '@sipheron/vdr-core'
import { Keypair } from '@solana/web3.js'

const issuerKeypair = Keypair.fromSecretKey(...) // Your wallet

const result = await anchorToSolana({
  buffer: fileBuffer,
  keypair: issuerKeypair,
  network: 'mainnet',
  metadata: 'My Private Contract v1.2' 
})

console.log('Record PDA Address:', result.pda)
console.log('Solana Transaction:', result.explorerUrl)
```

### C. Direct On-Chain Verification
Look up your anchor explicitly parsing the Program Data Accounts.

```typescript
import { verifyOnChain, deriveAnchorAddress } from '@sipheron/vdr-core'

const check = await verifyOnChain({
  hash: documentHash,
  network: 'mainnet',
  ownerPublicKey: issuerKeypair.publicKey
})

console.log(check.authentic) // true if hash matches and not revoked
```

### D. Webhook Verification
If your server receives SipHeron Webhooks (when using the hosted platform), manually verify signatures cryptographically using constant-time comparison.

```typescript
import { parseWebhookEvent } from '@sipheron/vdr-core'

const event = parseWebhookEvent({
  body: rawRequestBody,
  signature: req.headers['x-sipheron-signature'],
  secret: process.env.SIPHERON_WEBHOOK_SECRET
})

console.log(event.type) // 'anchor.confirmed'
```

---

## 2. Hosted Platform Usage (SipHeron Client)
For developers looking to integrate the SaaS aspects (generating PDF Certificates, maintaining managed analytics dashboards, fetching hosted compliance logs), the SDK exposes the exact same logic over our convenience wrapper API.

```typescript
import { SipHeron } from '@sipheron/vdr-core'

// 1. Initialize client
const sipheron = new SipHeron({
  apiKey: process.env.SIPHERON_API_KEY,
  network: 'devnet' // or 'mainnet'
})

// 2. Wrap and anchor via Platform 
const record = await sipheron.anchors.create({
  file: documentBuffer, 
  name: 'Employment Verification' 
})
console.log('Certificate URL:', record.verificationUrl)

// 3. Batch Verification API
const verification = await sipheron.verify.check({ file: documentBuffer })
```

---

## Error Handling

Clean, consistent, programmatic error classes. 

```typescript
import { 
  SipHeronError, 
  SolanaConnectionError, 
  TransactionError, 
  HashMismatchError 
} from '@sipheron/vdr-core'

try {
  await anchorToSolana(...)
} catch (err) {
  if (err instanceof TransactionError) {
    console.log('Wallet rejected or Tx dropped')
  }
}
```

---

## Interactive Studio Example

If you want to fully test the direct engine visually, we built a stunning Interactive Studio directly into our `examples` directory:

```bash
cd examples/vdr-studio
npm install
node server.js
```

Navigate to `http://localhost:3050` to drag-and-drop secure documents, generate PDAs, hash completely client-side, and directly verify/anchor to Solana.

---

## Building

```bash
npm run build
```

## Licensing & Security

Open Source SDK licensed under standard Apache-2.0. To report a security vulnerability or timing attack related bug within Hashing/Webhook signatures, please coordinate via `security@sipheron.com`.
