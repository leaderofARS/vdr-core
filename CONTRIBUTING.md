# Contributing to SipHeron VDR Core

So you want to contribute to the engine of decentralized document trust? Awesome! 

We welcome contributions of all sizes and skill levels. By contributing to `vdr-core`, you're helping secure thousands of documents cryptographically on the Solana blockchain.

## Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [Project Philosophy](#project-philosophy)
3. [Setting Up Your Development Environment](#setting-up-your-development-environment)
4. [Testing Guidelines](#testing-guidelines)
5. [Pull Request Process](#pull-request-process)
6. [Architectural Contributions](#architectural-contributions)

---

## Code of Conduct

This project and everyone participating in it is governed by the [SipHeron Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

## Project Philosophy

When writing code for `vdr-core`, remember these three golden rules:

1. **Zero-Knowledge (No Unhashed Data Transfers):** We *never* send raw files over the internet. Any new `anchor()` method or wrapper must hash the document locally before communicating with the API or an RPC node.
2. **Deterministic Processing:** Hashes must be pure and reproducible. Streaming chunks must calculate exactly identical buffers to file pointers.
3. **No Lock-In:** The SDK must always provide two paths. The `DIRECT` path (requires no SipHeron account, communicates straight to Solana RPC using a user-provided Keypair) and the `HOSTED` path (communicates with our managed API infrastructure).

---

## Setting Up Your Development Environment

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v8.0.0 or higher)
- A basic understanding of Solana Keypairs (optional, but encouraged for Direct testing)

### Installation
1. Fork the repo.
2. Clone your fork locally.
3. Install dependencies:
   ```bash
   cd vdr-core
   npm install
   ```
4. Build the TypeScript core:
   ```bash
   npm run build
   ```

---

## Testing Guidelines

Because `vdr-core` handles cryptography and blockchain state, our test suite is extensive and highly rigid.

**Run all tests:**
```bash
npm run test
```

### Adding New Tests
If you add a feature, you *must* add a corresponding test in the `tests/` directory using Jest.
- Are you adding a new `HashAlgorithm`? Add a vector collision test in `tests/hash/`.
- Are you changing API behavior? Mock the Axios payload in `tests/client/`.

**Do not check in Solana secret keys.** All tests must use randomly generated Keypairs for Direct testing.

---

## Pull Request Process

1. Create a feature branch originating from `master`. (`git checkout -b feature/streaming-hashes`)
2. Make your programmatic changes, adhering to the standard strict TypeScript syntax without any `@ts-ignore` overrides unless explicitly reviewed.
3. Ensure PRs pass `npm run test` and `npm run build`.
4. Update the `CHANGELOG.md` with your modifications under the `[Unreleased]` tag in the format described there.
5. Create a descriptive PR outlining what problem your code solves. 
6. Wait for a core protocol maintainer to review your code. 

## Architectural Contributions

If you are proposing a massive architectural rewrite (e.g. migrating off `axios` to `fetch`, or modifying the Solana PDA seeds), please open an Issue with the tag `[architecture]` to discuss it prior to writing massive amounts of code. 

Thank you for helping us make the internet more verifiable!
