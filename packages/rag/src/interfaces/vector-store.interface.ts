import { Document, SearchResult } from './embedding.interface';

/**
 * Interface para vector stores
 */
export interface VectorStore {
  /**
   * Adiciona documentos ao vector store
   */
  addDocuments(documents: Document[]): Promise<void>;

  /**
   * Busca documentos similares
   */
  similaritySearch(
    query: string | number[],
    limit?: number,
    filter?: Record<string, any>
  ): Promise<SearchResult[]>;

  /**
   * Deleta documentos
   */
  deleteDocuments(ids: string[]): Promise<void>;

  /**
   * Limpa o vector store
   */
  clear(): Promise<void>;
}

export interface VectorStoreOptions {
  type: 'pinecone' | 'qdrant' | 'memory';
  apiKey?: string;
  environment?: string;
  indexName?: string;
  url?: string;
  collectionName?: string;
}
