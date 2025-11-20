import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Inject } from '@prometheus/common';
import {
  ClaudeOptions,
  ClaudeModel,
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
  Message,
} from '../interfaces/claude.interface';

/**
 * Serviço principal para integração com Claude
 */
@Injectable()
export class ClaudeService {
  private client: Anthropic;
  private defaultModel: ClaudeModel;
  private defaultMaxTokens: number;
  private conversationHistory = new Map<string, Message[]>();

  constructor(@Inject('CLAUDE_OPTIONS') private options: ClaudeOptions) {
    this.client = new Anthropic({
      apiKey: options.apiKey,
      maxRetries: options.maxRetries || 3,
      timeout: options.timeout || 60000,
    });

    this.defaultModel = options.model || ClaudeModel.CLAUDE_3_5_SONNET;
    this.defaultMaxTokens = options.maxTokens || 4096;
  }

  /**
   * Completa uma conversa com Claude
   */
  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const response = await this.client.messages.create({
      model: request.model || this.defaultModel,
      max_tokens: request.maxTokens || this.defaultMaxTokens,
      messages: request.messages as any,
      temperature: request.temperature ?? this.options.temperature,
      top_p: request.topP ?? this.options.topP,
      top_k: request.topK ?? this.options.topK,
      system: request.system,
      stop_sequences: request.stopSequences,
      metadata: request.metadata as any,
    });

    return {
      id: response.id,
      type: 'message',
      role: 'assistant',
      content: response.content as any,
      model: response.model,
      stopReason: response.stop_reason as any,
      stopSequence: response.stop_sequence || undefined,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  /**
   * Completa com streaming
   */
  async *stream(request: CompletionRequest): AsyncGenerator<StreamChunk> {
    const stream = await this.client.messages.create({
      model: request.model || this.defaultModel,
      max_tokens: request.maxTokens || this.defaultMaxTokens,
      messages: request.messages as any,
      temperature: request.temperature ?? this.options.temperature,
      top_p: request.topP ?? this.options.topP,
      top_k: request.topK ?? this.options.topK,
      system: request.system,
      stop_sequences: request.stopSequences,
      stream: true,
    });

    for await (const chunk of stream) {
      yield {
        type: chunk.type as any,
        index: (chunk as any).index,
        delta: (chunk as any).delta,
        message: (chunk as any).message,
        usage: (chunk as any).usage,
      };
    }
  }

  /**
   * Envia uma mensagem simples
   */
  async chat(
    message: string,
    options?: Partial<CompletionRequest>
  ): Promise<string> {
    const response = await this.complete({
      messages: [{ role: 'user', content: message }],
      ...options,
    });

    const textContent = response.content.find(c => c.type === 'text');
    return textContent?.text || '';
  }

  /**
   * Mantém conversa com histórico
   */
  async conversation(
    conversationId: string,
    message: string,
    options?: Partial<CompletionRequest>
  ): Promise<string> {
    // Obtém ou cria histórico
    let history = this.conversationHistory.get(conversationId) || [];

    // Adiciona mensagem do usuário
    history.push({ role: 'user', content: message });

    // Completa
    const response = await this.complete({
      messages: history,
      ...options,
    });

    // Adiciona resposta ao histórico
    const textContent = response.content.find(c => c.type === 'text');
    const assistantMessage = textContent?.text || '';

    history.push({ role: 'assistant', content: assistantMessage });

    // Atualiza histórico (limita tamanho)
    if (history.length > 50) {
      history = history.slice(-50);
    }

    this.conversationHistory.set(conversationId, history);

    return assistantMessage;
  }

  /**
   * Limpa histórico de conversa
   */
  clearConversation(conversationId: string): void {
    this.conversationHistory.delete(conversationId);
  }

  /**
   * Obtém histórico de conversa
   */
  getConversationHistory(conversationId: string): Message[] {
    return this.conversationHistory.get(conversationId) || [];
  }

  /**
   * Conta tokens de uma mensagem (aproximado)
   */
  estimateTokens(text: string): number {
    // Estimativa simples: ~4 caracteres por token
    return Math.ceil(text.length / 4);
  }

  /**
   * Cria uma embedding (nota: Claude não tem API de embeddings nativa)
   * Esta é uma implementação placeholder
   */
  async createEmbedding(text: string): Promise<number[]> {
    throw new Error(
      'Claude does not provide embeddings API. Use @frameai/rag with alternative providers.'
    );
  }
}
