/**
 * Interfaces para integração com Claude
 */

export interface ClaudeOptions {
  apiKey: string;
  model?: ClaudeModel;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  timeout?: number;
  maxRetries?: number;
}

export enum ClaudeModel {
  CLAUDE_3_5_SONNET = 'claude-3-5-sonnet-20241022',
  CLAUDE_3_5_HAIKU = 'claude-3-5-haiku-20241022',
  CLAUDE_3_OPUS = 'claude-3-opus-20240229',
  CLAUDE_3_SONNET = 'claude-3-sonnet-20240229',
  CLAUDE_3_HAIKU = 'claude-3-haiku-20240307',
}

export interface Message {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}

export interface ContentBlock {
  type: 'text' | 'image';
  text?: string;
  source?: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

export interface CompletionRequest {
  messages: Message[];
  model?: ClaudeModel;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  system?: string;
  stream?: boolean;
  stopSequences?: string[];
  metadata?: Record<string, any>;
}

export interface CompletionResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: ContentBlock[];
  model: string;
  stopReason: 'end_turn' | 'max_tokens' | 'stop_sequence';
  stopSequence?: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface StreamChunk {
  type: 'message_start' | 'content_block_start' | 'content_block_delta' | 'content_block_stop' | 'message_delta' | 'message_stop';
  index?: number;
  delta?: {
    type: 'text_delta';
    text: string;
  };
  message?: Partial<CompletionResponse>;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}
