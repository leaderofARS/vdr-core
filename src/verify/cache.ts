import { VerificationResult } from '../types'

// Dynamic import for 'fs' to support browser environments
const isNode = typeof process !== 'undefined' && !!process.versions && !!process.versions.node
const isBrowser = !isNode


/**
 * Single entry in the verification cache.
 */
export interface CacheEntry {
  /** The cached verification result object. */
  result: VerificationResult
  /** Timestamp (ms) when this result was stored in cache. */
  cachedAt: number
  /** Time-to-live in milliseconds. */
  ttlMs: number
}

/**
 * Configuration options for the local verification cache.
 */
export interface VerificationCacheOptions {
  /** 
   * How long a result remains valid in the cache. 
   * @default 300000 (5 minutes)
   */
  ttlMs?: number
  /** 
   * Maximum number of entries to store before eviction. 
   * @default 1000 
   */
  maxEntries?: number
  /** 
   * Optional file path to persist the cache to disk. 
   * Useful for survival across process restarts.
   */
  persistPath?: string
}

/**
 * Local cache for verification results to prevent redundant network calls.
 * 
 * Support in-memory storage with optional LRU-style eviction and 
 * filesystem persistence.
 */
export class VerificationCache {
  private cache: Map<string, CacheEntry> = new Map()
  private ttlMs: number
  private maxEntries: number
  private persistPath?: string

  constructor(options: VerificationCacheOptions = {}) {
    this.ttlMs = options.ttlMs ?? 300_000
    this.maxEntries = options.maxEntries ?? 1000
    this.persistPath = options.persistPath
    
    if (this.persistPath) {
      this.loadFromDisk()
    }
  }

  /**
   * Look up a verification result by document hash.
   * 
   * @param hash - The SHA-256 fingerprint to look up.
   * @returns The cached VerificationResult if valid, or null if expired/missing.
   */
  get(hash: string): VerificationResult | null {
    const entry = this.cache.get(hash)
    if (!entry) return null
    
    const now = Date.now()
    if (now - entry.cachedAt > entry.ttlMs) {
      this.cache.delete(hash)
      return null
    }
    
    return {
      ...entry.result,
      fromCache: true,
      cachedTimestamp: entry.cachedAt
    }
  }

  /**
   * Store a verification result in the cache.
   * 
   * @param hash - The SHA-256 fingerprint of the document.
   * @param result - The fresh verification outcome to cache.
   */
  set(hash: string, result: VerificationResult): void {
    if (this.cache.size >= this.maxEntries && !this.cache.has(hash)) {
      // Basic LRU: Evict the oldest entry based on cachedAt
      let oldestHash: string | null = null
      let oldestTime = Infinity
      
      for (const [h, entry] of this.cache.entries()) {
        if (entry.cachedAt < oldestTime) {
          oldestTime = entry.cachedAt
          oldestHash = h
        }
      }
      
      if (oldestHash) {
        this.cache.delete(oldestHash)
      }
    }

    this.cache.set(hash, {
      result,
      cachedAt: Date.now(),
      ttlMs: this.ttlMs
    })

    if (this.persistPath) {
      this.saveToDisk()
    }
  }

  /**
   * Remove a specific hash from the cache.
   */
  invalidate(hash: string): void {
    this.cache.delete(hash)
    if (this.persistPath) {
      this.saveToDisk()
    }
  }

  /**
   * Wipe the entire cache.
   */
  clear(): void {
    this.cache.clear()
    if (this.persistPath) {
      this.saveToDisk()
    }
  }

  private loadFromDisk(): void {
    if (!this.persistPath || isBrowser) return
    try {
      const fs = require('fs')
      if (!fs.existsSync(this.persistPath)) return
      const raw = fs.readFileSync(this.persistPath, 'utf-8')
      const data = JSON.parse(raw)
      
      // Data is stored as an object, reconstruct Map
      for (const [key, value] of Object.entries(data)) {
        this.cache.set(key, value as CacheEntry)
      }
    } catch {
      // Silently fail on corruption
    }
  }

  private saveToDisk(): void {
    if (!this.persistPath || isBrowser) return
    try {
      const fs = require('fs')
      const data = Object.fromEntries(this.cache)
      fs.writeFileSync(this.persistPath, JSON.stringify(data, null, 2), 'utf-8')
    } catch {
      // Silently fail on write permissions/disk issues
    }
  }
}
