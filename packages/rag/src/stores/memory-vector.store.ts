import { VectorStore } from '../interfaces/vector-store.interface';
import { Document, SearchResult } from '../interfaces/embedding.interface';
import { EmbeddingProvider } from '../interfaces/embedding.interface';

/**
 * In-memory vector store (para desenvolvimento/testes)
 */
export class MemoryVectorStore implements VectorStore {
  private documents: Document[] = [];

  constructor(private embeddingProvider: EmbeddingProvider) {}

  async addDocuments(documents: Document[]): Promise<void> {
    // Gera embeddings se não existirem
    for (const doc of documents) {
      if (!doc.embedding) {
        doc.embedding = await this.embeddingProvider.embedText(doc.content);
      }
      this.documents.push(doc);
    }
  }

  async similaritySearch(
    query: string | number[],
    limit = 5,
    filter?: Record<string, any>
  ): Promise<SearchResult[]> {
    // Converte query para embedding se for string
    const queryEmbedding = typeof query === 'string'
      ? await this.embeddingProvider.embedText(query)
      : query;

    // Calcula similaridade cosseno
    const results = this.documents
      .filter(doc => !filter || this.matchesFilter(doc, filter))
      .map(doc => ({
        document: doc,
        score: this.cosineSimilarity(queryEmbedding, doc.embedding!),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  }

  async deleteDocuments(ids: string[]): Promise<void> {
    this.documents = this.documents.filter(doc => !ids.includes(doc.id));
  }

  async clear(): Promise<void> {
    this.documents = [];
  }

  /**
   * Calcula similaridade cosseno entre dois vetores
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Verifica se documento corresponde ao filtro
   */
  private matchesFilter(doc: Document, filter: Record<string, any>): boolean {
    if (!doc.metadata) return false;

    return Object.entries(filter).every(([key, value]) => {
      return doc.metadata![key] === value;
    });
  }
}
