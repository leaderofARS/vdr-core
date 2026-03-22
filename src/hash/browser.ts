/**
 * @module hash/browser
 *
 * @description
 * Browser-native SHA-256 using the Web Crypto API.
 * **Zero dependencies.** Works in all modern browsers, Deno, Bun,
 * Cloudflare Workers, Vercel Edge Functions, and any runtime that
 * exposes `crypto.subtle`.
 *
 * Produces **identical output** to the Node.js `crypto.createHash('sha256')`
 * implementation — the same document always produces the same 64-character
 * lowercase hex digest regardless of which runtime is used.
 *
 * ## Functions
 * | Function                     | Environment       | Input                                 |
 * |------------------------------|-------------------|---------------------------------------|
 * | `hashDocumentBrowser(input)` | Browser / Edge    | `File`, `Blob`, `ArrayBuffer`, `Uint8Array` |
 * | `hashAuto(input)`            | Any runtime       | All of the above **plus** Node `Buffer`     |
 *
 * ## Why two functions?
 * - Use **`hashDocumentBrowser`** when you *know* you are in a browser or
 *   edge runtime — it has a smaller import footprint because it never
 *   touches the Node.js `crypto` module.
 * - Use **`hashAuto`** when your code must run in *both* Node.js and the
 *   browser — it detects the environment at runtime and picks the fastest
 *   available implementation automatically.
 *
 * @example
 * ```ts
 * // Browser — hash a File from an <input type="file">
 * import { hashDocumentBrowser } from '@sipheron/vdr-core'
 *
 * const file = document.getElementById('upload').files[0]
 * const hash = await hashDocumentBrowser(file)
 * console.log(hash) // 64-char hex
 * ```
 *
 * @example
 * ```ts
 * // Isomorphic — works everywhere
 * import { hashAuto } from '@sipheron/vdr-core'
 *
 * const hash = await hashAuto(someInput) // Buffer, File, Blob, ArrayBuffer …
 * ```
 */

import { ValidationError } from '../errors'
import type { HashOptions } from '../types'

// ── Minimal type declarations for browser APIs ────────────────────────────────
// These avoid requiring the full DOM lib in tsconfig while still giving
// compile-time safety for the browser hashing functions.

/** Duck-typed interface that covers both `File` and `Blob`. */
interface BlobLike {
  arrayBuffer(): Promise<ArrayBuffer>
}

/** Subset of the Web Crypto API we actually use. */
interface SubtleCryptoLike {
  digest(algorithm: string, data: ArrayBuffer): Promise<ArrayBuffer>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Resolve `crypto.subtle` from the current runtime, or return `undefined`.
 * Works across browsers, Deno, Bun, Cloudflare Workers, and Node ≥ 15.
 */
function getSubtleCrypto(): SubtleCryptoLike | undefined {
  // globalThis.crypto.subtle — standard location in all modern runtimes
  if (
    typeof globalThis !== 'undefined' &&
    (globalThis as any).crypto?.subtle
  ) {
    return (globalThis as any).crypto.subtle as SubtleCryptoLike
  }
  return undefined
}

/**
 * Convert a SHA-256 `ArrayBuffer` digest to a 64-char lowercase hex string.
 */
function digestToHex(hashBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(hashBuffer)
  let hex = ''
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0')
  }
  return hex
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Browser-native SHA-256 using the Web Crypto API.
 * Zero dependencies. Works in all modern browsers.
 * Produces identical output to the Node.js `hashDocument()` implementation.
 *
 * Acceptable inputs:
 * - `File`       — from `<input type="file">`
 * - `Blob`       — from `fetch()` responses or constructed programmatically
 * - `ArrayBuffer`— raw binary data
 * - `Uint8Array` — typed array views (including Node.js `Buffer`)
 *
 * @param input - The data to hash.
 * @returns 64-character lowercase hex string (SHA-256 digest).
 *
 * @throws {Error} If `crypto.subtle` is not available in the current runtime.
 * @throws {ValidationError} If `input` is falsy or an unsupported type.
 *
 * @example
 * ```ts
 * const hash = await hashDocumentBrowser(file)
 * // 'a3f4b2c1d8e9f0a1b2c3d4e5f6a7b8c9...'
 * ```
 */
export async function hashDocumentBrowser(
  input: BlobLike | ArrayBuffer | Uint8Array,
  options: HashOptions = {}
): Promise<string> {
  if (!input) {
    throw new ValidationError('Input is required for browser hashing')
  }

  const subtle = getSubtleCrypto()
  if (!subtle) {
    throw new Error(
      'Web Crypto API (crypto.subtle) is not available in this environment. ' +
      'Use hashDocument() from @sipheron/vdr-core for Node.js environments instead.'
    )
  }

  let buffer: ArrayBuffer

  if (input instanceof ArrayBuffer) {
    buffer = input
  } else if (input instanceof Uint8Array) {
    // Handle Uint8Array (and Node.js Buffer which extends Uint8Array).
    // Copy into a fresh ArrayBuffer to avoid:
    //   1. Reading garbage from Node's shared Buffer pool
    //   2. SharedArrayBuffer type incompatibility with crypto.subtle
    const copy = new Uint8Array(input)
    buffer = copy.buffer as ArrayBuffer
  } else if (
    typeof (input as BlobLike).arrayBuffer === 'function'
  ) {
    // File or Blob — duck-typed to avoid requiring DOM lib
    buffer = await (input as BlobLike).arrayBuffer()
  } else {
    throw new ValidationError(
      'Unsupported input type. Provide a File, Blob, ArrayBuffer, or Uint8Array.'
    )
  }

  const algorithm = options.algorithm ?? 'sha256'
  let webAlgo = 'SHA-256'
  
  if (algorithm === 'sha512') webAlgo = 'SHA-512'
  if (algorithm === 'md5' || algorithm === 'blake3') {
    throw new Error(`${algorithm.toUpperCase()} is not natively supported in the browser. Use SHA-256 or SHA-512.`)
  }

  const hashBuffer = await subtle.digest(webAlgo, buffer)
  return digestToHex(hashBuffer)
}

/**
 * Auto-detect the runtime environment and use the optimal SHA-256
 * implementation — Node.js `crypto` when available, Web Crypto API otherwise.
 *
 * Works in:
 * - **Node.js** ≥ 16 (uses native `crypto.createHash`)
 * - **Browsers** (uses `crypto.subtle.digest`)
 * - **Deno / Bun** (uses `crypto.subtle.digest`)
 * - **Edge runtimes** — Cloudflare Workers, Vercel Edge (uses `crypto.subtle.digest`)
 *
 * @param input - Buffer, ArrayBuffer, Uint8Array, File, or Blob.
 * @returns 64-character lowercase hex string (SHA-256 digest).
 *
 * @example
 * ```ts
 * import { hashAuto } from '@sipheron/vdr-core'
 *
 * // Works everywhere — Node, browser, edge
 * const hash = await hashAuto(documentBytes)
 * ```
 */
export async function hashAuto(
  input: Buffer | ArrayBuffer | Uint8Array | BlobLike,
  options: HashOptions = {}
): Promise<string> {
  if (!input) {
    throw new ValidationError('Input is required for hashing')
  }

  // ── Path 1: Node.js Buffer → use native crypto (fastest) ───────────────
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(input)) {
    const { hashDocument } = await import('./algorithms')
    return hashDocument(input, options)
  }

  // ── Path 2: Blob / File → must use Web Crypto ──────────────────────────
  // Duck-type check: has `arrayBuffer()` method but is NOT a typed array
  if (
    typeof (input as BlobLike).arrayBuffer === 'function' &&
    !(input instanceof Uint8Array) &&
    !(input instanceof ArrayBuffer)
  ) {
    return hashDocumentBrowser(input as BlobLike, options)
  }

  // ── Path 3: ArrayBuffer / Uint8Array → prefer Node, fallback to Web ────
  if (input instanceof ArrayBuffer || input instanceof Uint8Array) {
    // If Node.js Buffer is available, convert and use native crypto (faster)
    if (typeof Buffer !== 'undefined') {
      const { hashDocument } = await import('./algorithms')
      const buf =
        input instanceof ArrayBuffer
          ? Buffer.from(input)
          : Buffer.from(
              input.buffer,
              input.byteOffset,
              input.byteLength
            )
      return hashDocument(buf, options)
    }

    // Pure browser / edge — use Web Crypto
    return hashDocumentBrowser(input, options)
  }

  throw new ValidationError(
    'Unsupported input type. Provide a Buffer, ArrayBuffer, Uint8Array, File, or Blob.'
  )
}
