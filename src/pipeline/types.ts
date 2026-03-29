/**
 * @file types.ts
 * @description Types for the RAG/AI Compliance Pipeline.
 */

export type PipelineEventType = 'retrieval' | 'generation' | 'output' | 'custom';
export type ComplianceFramework = 'eu_ai_act' | 'soc2' | 'gdpr' | 'hipaa' | 'custom';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface PipelineEventPayload {
  [key: string]: any;
  _ai_metrics?: AiMetrics;
}

export interface AiMetrics {
  modelId?: string | null;
  modelVersion?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalCost?: number | null;
  latencyMs?: number | null;
  piiDetected?: boolean;
  toxicityScore?: number | null;
  groundingScore?: number | null;
  userFeedback?: number | null;
  temperature?: number | null;
  maxTokens?: number | null;
  topP?: number | null;
  systemPromptHash?: string | null;
  contextLength?: number | null;
  generationSpeed?: number | null;
  stopReason?: string | null;
}

export interface PipelineEventOptions {
  eventType: PipelineEventType;
  stepName?: string;
  payload: any;
  pipelineId?: string;
  complianceFramework?: ComplianceFramework;
  riskLevel?: RiskLevel;
  userId?: string;
  sessionId?: string;
  modelId?: string;
  modelVersion?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalCost?: number;
  latencyMs?: number;
  piiDetected?: boolean;
  toxicityScore?: number;
  groundingScore?: number;
  userFeedback?: number;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  systemPromptHash?: string;
  contextLength?: number;
  generationSpeed?: number;
  stopReason?: string;
}

export interface PipelineEventResult {
  id: string;
  organizationId: string;
  pipelineId: string | null;
  eventType: PipelineEventType;
  stepName: string | null;
  payload: any;
  payloadHash: string;
  txSignature: string | null;
  pdaAddress: string | null;
  anchorStatus: 'PENDING' | 'CONFIRMED' | 'FAILED';
  anchoredAt: string | null;
  blockNumber: string | null;
  blockTimestamp: string | null;
  complianceFramework: ComplianceFramework | null;
  riskLevel: RiskLevel | null;
  userId: string | null;
  sessionId: string | null;
  modelId: string | null;
  modelVersion: string | null;
  verificationUrl: string | null;
  createdAt: string;
  promptTokens: number | null;
  completionTokens: number | null;
  totalCost: number | null;
  latencyMs: number | null;
  piiDetected: boolean;
  toxicityScore: number | null;
  groundingScore: number | null;
  userFeedback: number | null;
  explorerUrl: string | null;
  pdaExplorerUrl: string | null;
}

export interface PipelineConfig {
  id: string;
  organizationId: string;
  name: string;
  framework: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  eventCount?: number;
}

export interface PipelineSessionSummary {
  sessionId: string;
  totalEvents: number;
  confirmedEvents: number;
  eventTypes: string[];
  startedAt: string;
  endedAt: string;
  durationMs: number;
  isComplete: boolean;
}
