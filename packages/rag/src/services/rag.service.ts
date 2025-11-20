import { Injectable, Inject } from '@prometheus/common';
import { ClaudeService } from '@prometheus/claude';
import { VectorStore } from '../interfaces/vector-store.interface';
import { Document } from '../interfaces/embedding.interface';

/**
 * Serviço RAG (Retrieval-Augmented Generation)
 */
@Injectable()
export class RAGService {
  constructor(
    @Inject('VECTOR_STORE') private vectorStore: VectorStore,
    private claudeService: ClaudeService
  ) {}

  /**
   * Adiciona documentos ao sistema RAG
   */
  async addDocuments(documents: Document[]): Promise<void> {
    await this.vectorStore.addDocuments(documents);
  }

  /**
   * Busca contexto relevante
   */
  async retrieveContext(
    query: string,
    limit = 3,
    filter?: Record<string, any>
  ): Promise<Document[]> {
    const results = await this.vectorStore.similaritySearch(query, limit, filter);
    return results.map(r => r.document);
  }

  /**
   * Gera resposta usando RAG
   */
  async generate(
    query: string,
    options?: {
      contextLimit?: number;
      filter?: Record<string, any>;
      systemPrompt?: string;
      temperature?: number;
    }
  ): Promise<string> {
    // Busca contexto relevante
    const context = await this.retrieveContext(
      query,
      options?.contextLimit || 3,
      options?.filter
    );

    // Constrói prompt com contexto
    const contextText = context
      .map((doc, i) => `[${i + 1}] ${doc.content}`)
      .join('\n\n');

    const systemPrompt = options?.systemPrompt || `You are a helpful assistant. Use the following context to answer questions accurately. If the context doesn't contain relevant information, say so.

Context:
${contextText}`;

    // Gera resposta com Claude
    const response = await this.claudeService.complete({
      messages: [{ role: 'user', content: query }],
      system: systemPrompt,
      temperature: options?.temperature,
    });

    const textContent = response.content.find(c => c.type === 'text');
    return textContent?.text || '';
  }

  /**
   * Gera resposta com streaming
   */
  async *generateStream(
    query: string,
    options?: {
      contextLimit?: number;
      filter?: Record<string, any>;
      systemPrompt?: string;
      temperature?: number;
    }
  ): AsyncGenerator<string> {
    // Busca contexto relevante
    const context = await this.retrieveContext(
      query,
      options?.contextLimit || 3,
      options?.filter
    );

    // Constrói prompt com contexto
    const contextText = context
      .map((doc, i) => `[${i + 1}] ${doc.content}`)
      .join('\n\n');

    const systemPrompt = options?.systemPrompt || `You are a helpful assistant. Use the following context to answer questions accurately.

Context:
${contextText}`;

    // Gera resposta com streaming
    const stream = this.claudeService.stream({
      messages: [{ role: 'user', content: query }],
      system: systemPrompt,
      temperature: options?.temperature,
    });

    for await (const chunk of stream) {
      if (chunk.delta?.text) {
        yield chunk.delta.text;
      }
    }
  }

  /**
   * Deleta documentos
   */
  async deleteDocuments(ids: string[]): Promise<void> {
    await this.vectorStore.deleteDocuments(ids);
  }

  /**
   * Limpa todos os documentos
   */
  async clear(): Promise<void> {
    await this.vectorStore.clear();
  }
}
