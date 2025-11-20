import { Pinecone } from '@pinecone-database/pinecone';
import { VectorStore } from '../interfaces/vector-store.interface';
import { Document, SearchResult } from '../interfaces/embedding.interface';
import { EmbeddingProvider } from '../interfaces/embedding.interface';

/**
 * Pinecone vector store
 */
export class PineconeVectorStore implements VectorStore {
  private client: Pinecone;
  private index: any;

  constructor(
    private embeddingProvider: EmbeddingProvider,
    apiKey: string,
    private indexName: string,
    environment?: string
  ) {
    this.client = new Pinecone({ apiKey });
    this.index = this.client.index(indexName);
  }

  async addDocuments(documents: Document[]): Promise<void> {
    const vectors = [];

    for (const doc of documents) {
      const embedding = doc.embedding || await this.embeddingProvider.embedText(doc.content);

      vectors.push({
        id: doc.id,
        values: embedding,
        metadata: {
          content: doc.content,
          ...doc.metadata,
        },
      });
    }

    await this.index.upsert(vectors);
  }

  async similaritySearch(
    query: string | number[],
    limit = 5,
    filter?: Record<string, any>
  ): Promise<SearchResult[]> {
    const queryEmbedding = typeof query === 'string'
      ? await this.embeddingProvider.embedText(query)
      : query;

    const response = await this.index.query({
      vector: queryEmbedding,
      topK: limit,
      includeMetadata: true,
      filter: filter,
    });

    return response.matches.map((match: any) => ({
      document: {
        id: match.id,
        content: match.metadata.content,
        metadata: match.metadata,
      },
      score: match.score,
    }));
  }

  async deleteDocuments(ids: string[]): Promise<void> {
    await this.index.deleteMany(ids);
  }

  async clear(): Promise<void> {
    await this.index.deleteAll();
  }
}
