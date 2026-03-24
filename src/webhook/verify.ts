import { createHmac, timingSafeEqual } from 'crypto'
import { WebhookEvent } from '../types'
import { SipHeronError, ValidationError } from '../errors'

export interface WebhookVerifyOptions {
  tolerance?: number     // seconds, default 300 (5 min)
  throwOnExpired?: boolean
}

export function verifyWebhookSignature(params: {
  payload: string | Buffer
  signature: string
  secret: string
  options?: WebhookVerifyOptions
}): { valid: boolean; expired: boolean; event?: WebhookEvent } {
  const { payload, signature, secret, options = {} } = params
  const tolerance = options.tolerance ?? 300

  if (!payload || !signature || !secret) {
    return { valid: false, expired: false }
  }

  // Parse signature header: t=timestamp,v1=hash
  const parts = signature.split(',')
  const timestampStr = parts.find(p => p.startsWith('t='))?.slice(2)
  const hash = parts.find(p => p.startsWith('v1='))?.slice(3)

  let timestamp = parseInt(timestampStr ?? '0', 10)
  
  // Backwards compatibility for raw hex hashes (no t=,v1=)
  if (!timestampStr && !hash) {
    timestamp = Date.now() // Bypass age check for old payloads
  }

  const actualHash = hash || signature

  // Check timestamp tolerance
  const age = Math.floor(Date.now() / 1000) - timestamp
  // If age is huge because of Date.now() difference, it means no timestamp was given (backwards compat)
  // Wait, if timestamp=Date.now(), age is roughly - (Date.now()/1000). Let's fix that.
  let expired = false
  if (timestampStr) {
    expired = age > tolerance
  }

  if (expired && options.throwOnExpired) {
    throw new Error(`Webhook expired: ${age}s old (tolerance: ${tolerance}s)`)
  }

  const payloadStr = Buffer.isBuffer(payload) ? payload.toString('utf-8') : payload

  // Verify HMAC
  let expectedHash;
  if (timestampStr) {
    expectedHash = createHmac('sha256', secret)
      .update(`${timestamp}.${payloadStr}`)
      .digest('hex')
  } else {
    expectedHash = createHmac('sha256', secret)
      .update(payloadStr)
      .digest('hex')
  }

  let valid = false
  try {
    const sigBuffer = Buffer.from(actualHash, 'utf8')
    const computedBuffer = Buffer.from(expectedHash, 'utf8')
    if (sigBuffer.length === computedBuffer.length) {
      valid = timingSafeEqual(sigBuffer, computedBuffer)
    }
  } catch (err) {
    // ignore
  }

  if (!valid) return { valid: false, expired }

  try {
    const event = JSON.parse(payloadStr) as WebhookEvent
    return { valid: true, expired, event }
  } catch {
    return { valid: true, expired }
  }
}

export interface WebhookParseOptions {
  body: string | Buffer
  signature: string
  secret: string
  tolerance?: number
}

/**
 * Parses and verifies a webhook payload in one step.
 */
export function parseWebhookEvent({
  body,
  signature,
  secret,
  tolerance
}: WebhookParseOptions): WebhookEvent {
  const result = verifyWebhookSignature({
    payload: body,
    signature,
    secret,
    options: { tolerance, throwOnExpired: true }
  })

  if (!result.valid) {
    throw new SipHeronError('Invalid webhook signature', 'WEBHOOK_SIGNATURE_INVALID', 401)
  }

  if (!result.event) {
    throw new ValidationError('Webhook payload is not valid JSON')
  }

  return result.event
}

// Framework-specific helpers
export const webhookMiddleware = {
  express: (secret: string) => (req: any, res: any, next: any) => {
    const { valid } = verifyWebhookSignature({
      payload: req.rawBody,
      signature: req.headers['x-sipheron-signature'] as string,
      secret
    })
    if (!valid) return res.status(401).json({ error: 'Invalid signature' })
    next()
  },

  nextjs: (secret: string) => async (req: any) => {
    const body = await req.text()
    const { valid } = verifyWebhookSignature({
      payload: body,
      signature: req.headers.get('x-sipheron-signature') ?? '',
      secret
    })
    return valid
  },

  fastify: (secret: string) => (req: any, reply: any, done: any) => {
    const { valid } = verifyWebhookSignature({
      payload: req.rawBody,
      signature: req.headers['x-sipheron-signature'] as string,
      secret
    })
    if (!valid) return reply.status(401).send({ error: 'Invalid signature' })
    done()
  },

  awsLambda: (secret: string) => (event: any) => {
    const { valid } = verifyWebhookSignature({
      payload: event.body,
      signature: event.headers['x-sipheron-signature'] ?? event.headers['X-Sipheron-Signature'] ?? '',
      secret
    })
    return valid
  },

  cloudflare: (secret: string) => async (req: any) => {
    const body = await req.clone().text()
    const { valid } = verifyWebhookSignature({
      payload: body,
      signature: req.headers.get('x-sipheron-signature') ?? '',
      secret
    })
    return valid
  }
}
