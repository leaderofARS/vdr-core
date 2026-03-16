# SipHeron VDR — Core Technical Architecture

*The `@sipheron/vdr-core` library provides the foundational primitives for cryptographically secure anchoring and validation of digital assets on the Solana public ledger.*

In the same way that cryptographic libraries must be rigorously constructed to prevent vulnerabilities, a Verified Document Registry (VDR) engine requires uncompromising guarantees around data privacy, deterministic computation, and algorithmic zero-knowledge properties. Our design doctrine adheres to strict localized computation, ensuring user payloads never leave the machine boundaries.

---

## 1. Zero-Knowledge Information Architecture

### Deterministic Local Hashing (`crypto/sha256`)
The fundamental principle of the SipHeron architecture is that **raw document binaries (`Buffer`) are never transmitted over the wire**. 

When `.anchor({ file: data })` or `.verify({ file: data })` is called:
1. The client intercepts the memory buffer directly.
2. The payload is chunked and streamed into Node.js native `crypto.createHash('sha256')`.
3. The cryptographic operation collapses the binary payload into a definitive, 64-character hexadecimal digest representing the mathematical fingerprint of the asset.
4. **Only the fingerprint is transmitted** to the SipHeron API routing layer.

Because SHA-256 is fundamentally non-reversible and collision-resistant across $2^{256}$ possibilities, the document's content remains perfectly obfuscated while retaining strict mathematical verifiability. 

### Constant-Time Threat Mitigation
To prevent side-channel timing attacks where an adversary might infer the validity of sequential hash bytes by analyzing CPU response latencies, `vdr-core` utilizes constant-time comparison metrics (`crypto.timingSafeEqual`) during local verification events (`verifyLocally`). Execution time remains identical whether the first byte mismatches or the last byte mismatches.

---

## 2. On-Chain Ledger Consensus

### Immutable Anchoring Parity
A verifiable document is represented as a state transition on the Solana blockchain under the SipHeron smart contract (`6ecWPUK87zx...`). 

The anchoring process binds the $H(doc)$ fingerprint to a timestamped block. Solana's Proof-of-History (PoH) consensus mechanism provides strict chronological ordering and deep finality, ensuring that the existence of $H(doc)$ at time $T_0$ is mathematically indisputable.

### Independent Verifiability Axiom
SipHeron is an orchestrator, not a centralized source of truth. The underlying records are permanently hosted on the public ledger. 

`vdr-core` provides `examples/independent-verify.ts` as a cryptographic guarantee of our architectural axioms. Any engineering team can bypass the `vdr-core` dependency entirely and utilize base OS hashing tools (like `sha256sum`) and a standard Solana blockchain explorer to validate the transaction signatures directly. If SipHeron ceases to exist, the proofs remain permanent and functional independently.

---

## 3. Network Resiliency & State Machine

### Fault-Tolerant Request Handling
To ensure enterprise-grade stability under volatile network conditions, the internal HTTP client (`src/client/http.ts`) implements a managed interception layer.

- **Exponential Backoff**: Transitory network failures (502, 503, 504) or API throughput limitations (HTTP 429 Rate Limits) trigger an automated geometric retry protocol. Base sleep intervals expand strictly up to pre-configured bounds. 
- **Type-Strict Error Bubbling**: Broad `AxiosError` exceptions are preemptively caught, modeled, and re-thrown as specific, heavily-typed exceptions (e.g., `QuotaExceededError`, `AnchorRevokedError`) so integrators can build programmatic fallback logic based on explicit deterministic failure codes.

### Idempotency
Because network layers can experience packet loss leading to duplicated API requests, `vdr-core` handles idempotent key routing. Submitting the exact same transaction fingerprint multiple times with an `Idempotency-Key` prevents duplicated Solana transaction fees and duplicate anchor events from muddying enterprise audit rails.

---

## 4. Platform Cryptographic Types 

`vdr-core` ships with extensive TypeScript validation guarding input/output flow. It maps the complex graph of webhook responses to rigorous interfaces (`WebhookEvent`, `AnchorConfirmedEvent`, `AnomalyDetectedEvent`). 

This provides intellisense autocomplete and compile-time certainty across event-driven infrastructure, enabling institutions to securely link verification actions into high-compliance CRMs and supply chain systems.

---

## Conclusion
`@sipheron/vdr-core` represents a hardened interface designed around zero-trust client models. It treats cryptographic privacy as an absolute axiom, offloads immutability entirely to deterministic external networks (Solana), and provides a resilient interface for scale.
