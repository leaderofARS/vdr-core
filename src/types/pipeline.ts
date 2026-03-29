export type PipelineEventType = 'retrieval' | 'generation' | 'output' | 'custom';

export interface PipelineEventPayload {
  eventType: PipelineEventType;
  stepName?: string;
  payload: Record<string, any>;
  pipelineId?: string;
  complianceFramework?: string;
  riskLevel?: string;
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
  message: string;
  eventId: string;
  payloadHash: string;
}

export interface BatchPipelineEventPayload {
  events: PipelineEventPayload[];
}

export interface BatchPipelineEventResult {
  message: string;
  insertedCount: number;
  failedCount?: number;
}
