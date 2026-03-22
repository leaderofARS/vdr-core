import { EventEmitter } from 'events'
import type { AnchorResult } from '../types'
import { SipHeron } from './client'

export interface AnchorMonitorEvents {
  'pending': (anchorId: string) => void
  'confirmed': (anchor: AnchorResult) => void
  'failed': (anchorId: string, error: Error) => void
  'confirmation': (anchorId: string, count: number) => void
}

export class AnchorMonitor extends EventEmitter {
  private watched: Map<string, NodeJS.Timeout> = new Map()

  constructor(
    private client: SipHeron,
    private pollIntervalMs: number = 2000
  ) {
    super()
  }

  /**
   * Watch an anchor until it confirms or fails.
   * Emits 'confirmation' on each new confirmation,
   * 'confirmed' when fully confirmed, 'failed' on error.
   */
  watch(anchorId: string): this {
    // Immediate pending push
    this.emit('pending', anchorId)

    const interval = setInterval(async () => {
      try {
        const anchorResult = await this.client.getStatus(anchorId)

        // SipHeron hashes API can incrementally report confirmations. 
        // We gracefully fallback to 1 if the API just transitioned to confirmed.
        const confirmations = (anchorResult as any).confirmations ?? (anchorResult.status === 'confirmed' ? 1 : 0)
        
        this.emit('confirmation', anchorId, confirmations)

        if (anchorResult.status === 'confirmed') {
          clearInterval(interval)
          this.watched.delete(anchorId)
          this.emit('confirmed', anchorResult)
        } else if (anchorResult.status === 'failed' || anchorResult.status === 'revoked') {
          clearInterval(interval)
          this.watched.delete(anchorId)
          this.emit('failed', anchorId, new Error(`Anchor terminated with status: ${anchorResult.status}`))
        }
      } catch (error) {
        clearInterval(interval)
        this.watched.delete(anchorId)
        this.emit('failed', anchorId, error as Error)
      }
    }, this.pollIntervalMs)

    this.watched.set(anchorId, interval)
    return this
  }

  stopWatching(anchorId: string): void {
    const interval = this.watched.get(anchorId)
    if (interval) {
      clearInterval(interval)
      this.watched.delete(anchorId)
    }
  }

  stopAll(): void {
    this.watched.forEach(interval => clearInterval(interval))
    this.watched.clear()
  }

  // Type overrides for strictly-typed Event Emitter
  on<K extends keyof AnchorMonitorEvents>(event: K, listener: AnchorMonitorEvents[K]): this {
    return super.on(event, listener)
  }
  emit<K extends keyof AnchorMonitorEvents>(event: K, ...args: Parameters<AnchorMonitorEvents[K]>): boolean {
    return super.emit(event, ...args)
  }
}
