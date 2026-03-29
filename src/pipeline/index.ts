/**
 * @file index.ts
 * @description SDK implementation for RAG/AI Compliance Pipeline.
 */

import { SipHeron } from '../client';
import { 
  PipelineEventOptions, 
  PipelineEventResult, 
  PipelineConfig, 
  PipelineSessionSummary 
} from './types';

/**
 * AI Compliance Pipeline Module
 */
export class PipelineModule {
  constructor(private client: SipHeron) {}

  /**
   * Anchor a single AI pipeline event (retrieval, generation, output).
   * Automatically hashes the payload and injectors AI metrics.
   */
  async anchorEvent(options: PipelineEventOptions): Promise<PipelineEventResult> {
    const response = await this.client.request('POST', '/api/pipeline/events', options);
    return response.event;
  }

  /**
   * Anchor multiple AI pipeline events at once (max 50).
   */
  async anchorEvents(events: PipelineEventOptions[]): Promise<{
    summary: { total: number; anchored: number; failed: number };
    results: any[];
  }> {
    return this.client.request('POST', '/api/pipeline/events/batch', { events });
  }

  /**
   * List pipeline events for the current organization.
   */
  async listEvents(params: {
    page?: number;
    limit?: number;
    search?: string;
    eventType?: string;
    anchorStatus?: string;
    pipelineId?: string;
    sessionId?: string;
    complianceFramework?: string;
    riskLevel?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    events: PipelineEventResult[];
    total: number;
    page: number;
    pages: number;
  }> {
    return this.client.request('GET', '/api/pipeline/events', params);
  }

  /**
   * Get detail for a specific pipeline event.
   */
  async getEvent(id: string): Promise<PipelineEventResult> {
    const response = await this.client.request('GET', `/api/pipeline/events/${id}`);
    return response.event;
  }

  /**
   * Get all events in a specific session.
   */
  async getSession(sessionId: string): Promise<{
    session: PipelineSessionSummary;
    events: PipelineEventResult[];
  }> {
    return this.client.request('GET', `/api/pipeline/sessions/${sessionId}`);
  }

  /**
   * List pipeline configurations.
   */
  async listConfigs(): Promise<PipelineConfig[]> {
    const response = await this.client.request('GET', '/api/pipeline/configs');
    return response.configs;
  }

  /**
   * Create a new pipeline configuration.
   */
  async createConfig(data: {
    name: string;
    framework?: 'langchain' | 'pathway' | 'llamaindex' | 'custom';
    description?: string;
  }): Promise<PipelineConfig> {
    const response = await this.client.request('POST', '/api/pipeline/configs', data);
    return response.config;
  }

  /**
   * Delete a pipeline configuration.
   */
  async deleteConfig(id: string): Promise<void> {
    await this.client.request('DELETE', `/api/pipeline/configs/${id}`);
  }
}

export * from './types';
export * from './pii';
