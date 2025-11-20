/**
 * Interfaces para embedding providers
 */

export interface EmbeddingProvider {
  embedText(text: string): Promise<number[]>;
  embedTexts(texts: string[]): Promise<number[][]>;
  getDimensions(): number;
}

export interface EmbeddingOptions {
  provider: 'openai' | 'cohere' | 'local';
  apiKey?: string;
  model?: string;
  dimensions?: number;
}

export interface Document {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

export interface SearchResult {
  document: Document;
  score: number;
}
