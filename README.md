<div align="center">
  <h1>SipHeron VDR Core Compute Layer</h1>
  <p>Fundamental primitives for cryptographically secure anchoring and validation of digital assets on the Solana public ledger.</p>
</div>

<br>

**`@sipheron/vdr-core`** provides the base architectural components for interacting with the SipHeron Verified Document Registry. Built for absolute cryptographic safety, high-throughput capability, and zero-knowledge paradigms, it enables institutions to interface directly with immutable state transition networks.

For a deep dive into the underlying cryptography, deterministic computing, and ledger consensus models, refer to our [Architecture Whitepaper](./ARCHITECTURE.md).

## 🚀 Native Installation

Install the compute layer into your Node.js or TypeScript execution environments:

```bash
npm install @sipheron/vdr-core
```

## 🧠 Core Architectural Primitives

1. **Zero-Knowledge Information Architecture**: The physical data buffers of your payloads **never traverse network boundaries**. Hashing operations invoke native `crypto.createHash('sha256')` purely on the local computational edge.
2. **Deterministic On-Chain Consensus**: Asset fingerprints are bound permanently to the Solana blockchain's Proof-of-History state, ensuring deep cryptographic finality and indisputable chronometric ordering.
3. **Resilient Network Protocol**: The execution environment integrates deterministic exponential backoff algorithms, strict Type-Safe error handling, and intelligent idempotency key mapping to ensure zero-loss transaction capability under compromised network connections.

## ⚡ API Integrations

### Asset Anchoring Pipeline
Collapse a binary payload into a deterministic 64-character SHA-256 scalar, and execute an immutable state change on the Solana execution layer.

```typescript
import { SipHeron } from '@sipheron/vdr-core'

const sipheron = new SipHeron({ apiKey: 'YOUR_INSTITUTIONAL_KEY' })

const anchorReceipt = await sipheron.anchor({ 
  file: buffer, 
  name: 'Corporate Charter v2.1' 
})

console.log(`Verification URI: ${anchorReceipt.verificationUrl}`)
```

### Decentralized State Validation
Perform a zero-knowledge sub-routine verification against an established historical ledger record.

```typescript
const verificationState = await sipheron.verify({ file: testBuffer })

if (verificationState.authentic) {
  console.log(`[VALIDATED] Anchor confirmed at block state: ${verificationState.anchor?.blockNumber}`)
} else {
  console.error(`[FAULT] Cryptographic checksum sequence mismatch detected.`)
}
```

## 📚 Technical Resource Index
- [Architecture & Cryptography Methodology](./ARCHITECTURE.md)
- [Security & Threat Model Definition](./SECURITY.md)
- [Engineering Contribution Framework](./CONTRIBUTING.md)
- [Process Execution Examples](./examples/README.md)
