import { Module, DynamicModule, Provider } from '@prometheus/common';
import { RAGService } from './services/rag.service';
import { EmbeddingProvider, EmbeddingOptions } from './interfaces/embedding.interface';
import { VectorStore, VectorStoreOptions } from './interfaces/vector-store.interface';
import { OpenAIEmbeddingProvider } from './providers/openai-embedding.provider';
import { MemoryVectorStore } from './stores/memory-vector.store';
import { PineconeVectorStore } from './stores/pinecone-vector.store';

/**
 * Módulo RAG
 */
@Module({
  providers: [RAGService],
  exports: [RAGService],
})
export class RAGModule {
  static forRoot(options: RAGModuleOptions): DynamicModule {
    const embeddingProvider = this.createEmbeddingProvider(options.embedding);
    const vectorStore = this.createVectorStore(options.vectorStore, embeddingProvider);

    const providers: Provider[] = [
      {
        provide: 'EMBEDDING_PROVIDER',
        useValue: embeddingProvider,
      },
      {
        provide: 'VECTOR_STORE',
        useValue: vectorStore,
      },
      RAGService,
    ];

    return {
      module: RAGModule,
      providers,
      exports: [RAGService],
      global: true,
    };
  }

  private static createEmbeddingProvider(options: EmbeddingOptions): EmbeddingProvider {
    switch (options.provider) {
      case 'openai':
        return new OpenAIEmbeddingProvider(
          options.apiKey!,
          options.model,
          options.dimensions
        );
      default:
        throw new Error(`Unsupported embedding provider: ${options.provider}`);
    }
  }

  private static createVectorStore(
    options: VectorStoreOptions,
    embeddingProvider: EmbeddingProvider
  ): VectorStore {
    switch (options.type) {
      case 'memory':
        return new MemoryVectorStore(embeddingProvider);
      case 'pinecone':
        return new PineconeVectorStore(
          embeddingProvider,
          options.apiKey!,
          options.indexName!,
          options.environment
        );
      default:
        throw new Error(`Unsupported vector store: ${options.type}`);
    }
  }
}

export interface RAGModuleOptions {
  embedding: EmbeddingOptions;
  vectorStore: VectorStoreOptions;
}
