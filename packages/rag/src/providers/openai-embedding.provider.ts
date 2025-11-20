import OpenAI from 'openai';
import { EmbeddingProvider } from '../interfaces/embedding.interface';

/**
 * OpenAI Embedding Provider
 */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private client: OpenAI;
  private model: string;
  private dimensions: number;

  constructor(apiKey: string, model = 'text-embedding-3-small', dimensions = 1536) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
    this.dimensions = dimensions;
  }

  async embedText(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: text,
      dimensions: this.dimensions,
    });

    return response.data[0].embedding;
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: texts,
      dimensions: this.dimensions,
    });

    return response.data.map(item => item.embedding);
  }

  getDimensions(): number {
    return this.dimensions;
  }
}
