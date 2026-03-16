# 🏛️ SipHeron VDR Implementation Models

This execution environment provides heavily-typed architectural models representing the standard institutional lifecycles for utilizing the underlying cryptographic endpoints of `@sipheron/vdr-core`.

These examples demonstrate rigorous state management, boundary conditions, and absolute isolation from external computational environments.

## Execution Provisioning

Before initializing the evaluation instances, configure the execution binaries and inject your institutional state keys:

```bash
npm install
export SIPHERON_API_KEY="YOUR_INSTITUTIONAL_KEY"

# Execute a parameterized runtime model
npx ts-node examples/basic-anchor.ts
```

## Implemented Process Architectures

| Executable Model | Architectural Concept |
| ---- | ----------- |
| `basic-anchor.ts` | Foundational implementation of the zero-trust state boundary anchoring procedure. Demonstrates local-only buffer processing. |
| `basic-verify.ts` | Verification topology executing cryptographic digest matching against immutable network states. |
| `verify-from-hash.ts` | Memory-efficient scalar validation pipeline operating precisely on pre-computed hexadecimal `sha256` digest outputs. |
| `batch-anchor.ts` | High-throughput concurrent imprinting leveraging geometric exponential retry logic networks for large dataset scale. |
| `webhook-listener.ts` | Scalable daemon processor configured to explicitly parse structural webhook anomalies and PoH immutability events. |
| `independent-verify.ts` | Procedural demonstration isolating the mathematical independence of the proof systems completely outside the active SipHeron framework ecosystem. |

---

### Key Requirements Parameter

SipHeron maintains a robust developer infrastructure allocation. The initial API provisioning provides **100 anchor/month limits** with no financial barrier constraints. 

To provision your operational keys, interface with the [Computational Portal Gateway](https://app.sipheron.com).
