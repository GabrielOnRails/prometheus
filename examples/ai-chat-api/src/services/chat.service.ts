import { Injectable } from '@prometheus/core';
import { ClaudeService } from '@prometheus/claude';
import { CacheService } from '@prometheus/cache';
import { QueueService } from '@prometheus/queue';

/**
 * Serviço de chat com IA
 */
@Injectable()
export class ChatService {
  constructor(
    private claudeService: ClaudeService,
    private cacheService: CacheService,
    private queueService: QueueService
  ) {}

  /**
   * Chat simples com cache
   */
  async chat(message: string, useCache = true): Promise<string> {
    if (useCache) {
      return this.cacheService.wrap(
        `chat:${message}`,
        () => this.claudeService.chat(message),
        300 // 5 minutos de cache
      );
    }

    return this.claudeService.chat(message);
  }

  /**
   * Chat com histórico de conversa
   */
  async conversation(conversationId: string, message: string): Promise<string> {
    return this.claudeService.conversation(conversationId, message);
  }

  /**
   * Chat com streaming
   */
  async *chatStream(message: string): AsyncGenerator<string> {
    const stream = this.claudeService.stream({
      messages: [{ role: 'user', content: message }],
    });

    for await (const chunk of stream) {
      if (chunk.delta?.text) {
        yield chunk.delta.text;
      }
    }
  }

  /**
   * Processa mensagem em background (async)
   */
  async processAsync(message: string): Promise<string> {
    // Adiciona job à fila
    const jobId = await this.queueService.addJob(
      'ai-processing',
      'chat',
      { message }
    );

    return jobId;
  }

  /**
   * Limpa histórico de conversa
   */
  clearConversation(conversationId: string): void {
    this.claudeService.clearConversation(conversationId);
  }
}
