# Security Policy

SipHeron is built on the philosophy of decentralized trust and cryptographic guarantees. As such, the security of `@sipheron/vdr-core` is our highest operational priority. The SDK facilitates localized hashing, programmatic smart contract derivation, and immutable state verification. 

## Supported Versions

The following table displays the status of security updates for major releases of `@sipheron/vdr-core`. 
It is universally advised to use the latest minor version of `0.1.x`.

| Version | Supported          | Status |
| ------- | ------------------ | ------ |
| > 0.1.5 | :white_check_mark: | Active Development |
| < 0.1.4 | :x:                | Deprecated / No Patches |

## Reporting a Vulnerability

We request that you do **not** disclose any vulnerability details publicly or by opening a GitHub Issue, as this could immediately put our independent developer ecosystem and users at risk prior to a patch release.

Please email your security findings directly to:
**[security@sipheron.com](mailto:security@sipheron.com)**

### What to report:
- **Hashing Leaks**: If you discover a scenario where the SDK inadvertently transmits a raw file or buffer to an external endpoint instead of compiling the SHA-256 hash locally.
- **Timing attacks**: In the Webhook signature validation (`verifyWebhookSignature`), if our constant-time equality checks are susceptible.
- **Validation Bypasses**: Anomalies where revoked or forged signatures resolve as `authentic: true` against the verification engines locally or via Solana Program Derived Addresses.

### Response timeline:
1. We will acknowledge receipt of your vulnerability report within **48 hours**.
2. If confirmed, we will issue a patch in a minor bump alongside a Github Security Advisory immediately.
3. We operate internally on a 72-hour max mitigation pipeline for `vdr-core` critical cryptographic issues.

## Threat Model (By Design)

Please note that `@sipheron/vdr-core` allows users to invoke the *direct* route without needing validation from SipHeron's SaaS architecture. If users compromise their own local Solana wallets (`Keypair`), or use compromised Solana RPC endpoints (unverified nodes pushing false blocks), SipHeron cannot cryptographically intervene. 

For the highest security posture when verifying high-value documents, ensure your RPC URL is trusted and your Keypairs are airgapped or heavily encrypted.
