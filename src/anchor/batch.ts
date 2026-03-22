import type { AnchorResult, HashAlgorithm } from '../types'
import { SipHeron } from '../client'

export interface BatchAnchorOptions {
  documents: Array<{
    file?: Buffer
    hash?: string
    name?: string
    metadata?: Record<string, string>
    hashAlgorithm?: HashAlgorithm
  }>
  concurrency?: number         // default: 5, max: 20
  onProgress?: (completed: number, total: number, result: BatchItemResult) => void
  continueOnError?: boolean    // default: true
  delayBetweenBatchesMs?: number // default: 100
  /** Global algorithm for the entire batch if not specified on individual documents. */
  hashAlgorithm?: HashAlgorithm
}

export interface BatchItemResult {
  index: number
  success: boolean
  anchor?: AnchorResult
  error?: string
}

export interface BatchAnchorResult {
  total: number
  succeeded: number
  failed: number
  results: BatchItemResult[]
  durationMs: number
}

export async function anchorBatch(
  client: SipHeron,
  options: BatchAnchorOptions
): Promise<BatchAnchorResult> {
  const {
    documents,
    concurrency = 5,
    onProgress,
    continueOnError = true,
    delayBetweenBatchesMs = 100
  } = options

  const startTime = Date.now()
  const results: BatchItemResult[] = []
  let succeeded = 0
  let failed = 0

  // Process in chunks respecting concurrency limit
  for (let i = 0; i < documents.length; i += concurrency) {
    const chunk = documents.slice(i, i + concurrency)

    const chunkResults = await Promise.allSettled(
      chunk.map(async (doc, chunkIndex) => {
        const index = i + chunkIndex
        try {
          const anchor = await client.anchor({
            ...doc,
            hashAlgorithm: doc.hashAlgorithm || options.hashAlgorithm
          })
          return { index, success: true, anchor }
        } catch (error) {
          if (!continueOnError) throw error
          return {
            index,
            success: false,
            error: (error as Error).message
          }
        }
      })
    )

    for (let c = 0; c < chunkResults.length; c++) {
      const result = chunkResults[c]
      const index = i + c

      let item: BatchItemResult
      if (result.status === 'fulfilled') {
        item = result.value as BatchItemResult
      } else {
        item = { index, success: false, error: (result as any).reason?.message }
      }

      results.push(item)
      if (item.success) succeeded++
      else failed++

      onProgress?.(results.length, documents.length, item)
    }

    // Respect rate limits between chunks
    if (i + concurrency < documents.length) {
      await new Promise(r => setTimeout(r, delayBetweenBatchesMs))
    }
  }

  return {
    total: documents.length,
    succeeded,
    failed,
    results: results.sort((a, b) => a.index - b.index),
    durationMs: Date.now() - startTime
  }
}
