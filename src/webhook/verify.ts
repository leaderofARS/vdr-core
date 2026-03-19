/**
 * @module webhook/verify
 *
 * @description
 * HMAC-SHA256 webhook signature verification for SipHeron platform events.
 *
 * When the SipHeron platform calls your webhook endpoint it sends a
 * `X-SipHeron-Signature` header containing the HMAC-SHA256 of the raw request
 * body, keyed with your webhook secret. **Always verify this signature before
 * processing the event payload** to ensure the request is authentic and
 * has not been tampered with in transit.
 *
 * ## Security guarantees
 * - Uses `crypto.timingSafeEqual` — execution time is constant regardless of
 *   where a byte mismatch occurs, preventing timing-based forgery attacks.
 * - Signature comparison works on `Buffer` objects of identical length to
 *   avoid implicit length-leaking comparisons.
 *
 * ## `verifyWebhookSignature(opts)`
 * Low-level signature check — returns `true` / `false`.
 * Use when you want to handle verification failure yourself.
 *
 * ## `parseWebhookEvent(opts)`
 * All-in-one: verifies signature AND parses the JSON body.
 * Throws `SipHeronError` (code: `WEBHOOK_SIGNATURE_INVALID`) on bad signature,
 * or `ValidationError` if the body is not valid JSON.
 *
 * @example
 * ```ts
 * import express from 'express'
 * import { parseWebhookEvent } from '@sipheron/vdr-core'
 *
 * app.post('/webhooks/sipheron', express.raw({ type: '*\/*' }), (req, res) => {
 *   const event = parseWebhookEvent({
 *     body: req.body.toString(),
 *     signature: req.headers['x-sipheron-signature'] as string,
 *     secret: process.env.SIPHERON_WEBHOOK_SECRET!,
 *   })
 *   console.log(event.event) // 'anchor.confirmed'
 *   res.sendStatus(200)
 * })
 * ```
 */
import { createHmac, timingSafeEqual } from 'crypto'
import { WebhookEvent } from '../types'
import { SipHeronError, ValidationError } from '../errors'

export interface WebhookVerifyOptions {
  payload: string | Buffer
  signature: string
  secret: string
  tolerance?: number
}

export interface WebhookParseOptions {
  body: string
  signature: string
  secret: string
}

/**
 * Verify a SipHeron webhook signature exactly.
 * Uses constant-time equality to prevent timing attacks.
 */
export function verifyWebhookSignature({
  payload,
  signature,
  secret,
  tolerance = 300 // 5 minutes default tolerance
}: WebhookVerifyOptions): boolean {
  if (!payload || !signature || !secret) {
    return false
  }

  try {
    const payloadBuffer = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf-8')
    const computedSignature = createHmac('sha256', secret)
      .update(payloadBuffer)
      .digest('hex')

    // Optional: if signatures in SipHeron use timestamps (e.g. `t=123,v1=abc`),
    // you would parse that here. For now, assuming direct HMAC hex.
    const sigBuffer = Buffer.from(signature, 'utf8')
    const computedBuffer = Buffer.from(computedSignature, 'utf8')

    if (sigBuffer.length !== computedBuffer.length) {
      return false
    }

    return timingSafeEqual(sigBuffer, computedBuffer)
  } catch (err) {
    return false
  }
}

/**
 * Parses and verifies a webhook payload in one step.
 */
export function parseWebhookEvent({
  body,
  signature,
  secret
}: WebhookParseOptions): WebhookEvent {
  const isValid = verifyWebhookSignature({
    payload: body,
    signature,
    secret
  })

  if (!isValid) {
    throw new SipHeronError('Invalid webhook signature', 'WEBHOOK_SIGNATURE_INVALID', 401)
  }

  try {
    return JSON.parse(body) as WebhookEvent
  } catch (err) {
    throw new ValidationError('Webhook payload is not valid JSON')
  }
}
