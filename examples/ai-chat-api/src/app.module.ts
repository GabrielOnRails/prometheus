import { Module } from '@prometheus/core';
import { ClaudeModule, ClaudeModel } from '@prometheus/claude';
import { RAGModule } from '@prometheus/rag';
import { CacheModule } from '@prometheus/cache';
import { QueueModule } from '@prometheus/queue';
import { StreamingModule } from '@prometheus/streaming';
import { ChatController } from './controllers/chat.controller';
import { RAGController } from './controllers/rag.controller';
import { ChatService } from './services/chat.service';

/**
 * Módulo principal da aplicação
 */
@Module({
  imports: [
    // Integração com Claude
    ClaudeModule.forRoot({
      apiKey: process.env.ANTHROPIC_API_KEY!,
      model: ClaudeModel.CLAUDE_3_5_SONNET,
      maxTokens: 4096,
      temperature: 0.7,
    }),

    // Sistema RAG
    RAGModule.forRoot({
      embedding: {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY!,
        model: 'text-embedding-3-small',
        dimensions: 1536,
      },
      vectorStore: {
        type: 'memory', // Use 'pinecone' em produção
      },
    }),

    // Cache multi-camadas
    CacheModule.forRoot({
      memoryMaxItems: 500,
      memoryTTL: 300, // 5 minutos
      redis: process.env.REDIS_HOST ? {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
      } : undefined,
    }),

    // Queue para processamento assíncrono
    QueueModule.forRoot({
      redis: process.env.REDIS_HOST ? {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
      } : undefined,
      concurrency: 5,
    }),

    // Streaming em tempo real
    StreamingModule,
  ],
  controllers: [ChatController, RAGController],
  providers: [ChatService],
})
export class AppModule {}
