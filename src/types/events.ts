export type WebhookEventType =
  | 'anchor.created'
  | 'anchor.confirmed'
  | 'anchor.failed'
  | 'verification.performed'
  | 'anomaly.detected'
  | 'quota.warning'
  | 'quota.exceeded'
  | 'certificate.generated'

export interface WebhookEvent<T = Record<string, unknown>> {
  /** Unique event ID — evt_* prefix */
  id: string
  /** Event type */
  event: WebhookEventType
  /** ISO 8601 timestamp when the event was created */
  created: string
  /** Event-specific payload */
  data: T
}

export interface AnchorCreatedEvent {
  hash: string
  metadata?: string
  status: 'pending'
  organizationId: string
  createdAt: string
}

export interface AnchorConfirmedEvent {
  hash: string
  metadata?: string
  status: 'confirmed'
  txSignature: string
  blockNumber: string
  blockTimestamp: string
  explorerUrl: string
  organizationId: string
  confirmedAt: string
}

export interface AnchorFailedEvent {
  hash: string
  metadata?: string
  status: 'failed'
  error: string
  organizationId: string
  failedAt: string
}

export interface VerificationPerformedEvent {
  hash: string
  authentic: boolean
  status: string
  verifiedAt: string
  metadata?: string
}

export interface QuotaWarningEvent {
  organizationId: string
  plan: string
  threshold: number
  used: number
  limit: number
  remaining: number
  percentUsed: string
  resetAt: string
}

export interface AnomalyDetectedEvent {
  hash: string
  anomalyType: 'high_verification_frequency'
  verificationCount: number
  windowMinutes: number
  threshold: number
  detectedAt: string
}
