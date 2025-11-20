import { Controller, Injectable } from '@prometheus/core';
import { RAGService, TextSplitter } from '@prometheus/rag';

/**
 * Controller para endpoints RAG (Retrieval-Augmented Generation)
 */
@Controller('rag')
@Injectable()
export class RAGController {
  private textSplitter: TextSplitter;

  constructor(private ragService: RAGService) {
    this.textSplitter = new TextSplitter(1000, 200);
  }

  /**
   * Adiciona documentos ao sistema RAG
   * POST /rag/documents
   */
  async addDocuments(req: any, res: any): Promise<void> {
    const { documents } = req.body;

    try {
      // Processa e divide documentos
      const processedDocs = documents.flatMap((doc: any) => {
        const chunks = this.textSplitter.split(doc.content);
        return chunks.map((chunk, i) => ({
          id: `${doc.id}_chunk_${i}`,
          content: chunk,
          metadata: {
            ...doc.metadata,
            originalId: doc.id,
            chunkIndex: i,
          },
        }));
      });

      await this.ragService.addDocuments(processedDocs);

      res.json({
        success: true,
        documentsAdded: processedDocs.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Busca contexto relevante
   * GET /rag/search?query=...
   */
  async search(req: any, res: any): Promise<void> {
    const { query, limit = 3 } = req.query;

    if (!query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    try {
      const context = await this.ragService.retrieveContext(query, parseInt(limit));
      res.json({ context });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Gera resposta usando RAG
   * POST /rag/generate
   */
  async generate(req: any, res: any): Promise<void> {
    const { query, contextLimit = 3, temperature = 0.7 } = req.body;

    if (!query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    try {
      const response = await this.ragService.generate(query, {
        contextLimit,
        temperature,
      });

      res.json({ response });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Gera resposta com streaming
   * GET /rag/stream?query=...
   */
  async generateStream(req: any, res: any): Promise<void> {
    const { query, contextLimit = 3 } = req.query;

    if (!query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    try {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      const stream = this.ragService.generateStream(query, {
        contextLimit: parseInt(contextLimit as string),
      });

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }

      res.end();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
