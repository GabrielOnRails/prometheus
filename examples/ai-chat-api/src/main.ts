import 'reflect-metadata';
import { config } from 'dotenv';
import express from 'express';
import { PrometheusFactory } from '@prometheus/core';
import { AppModule } from './app.module';
import { WebSocketService } from '@prometheus/streaming';
import { QueueService } from '@prometheus/queue';

// Carrega variáveis de ambiente
config();

async function bootstrap() {
  // Cria aplicação Prometheus
  const app = await PrometheusFactory.create(AppModule);

  // Cria servidor Express
  const server = express();
  server.use(express.json());

  // Obtém serviços
  const websocketService = await app.get(WebSocketService);
  const queueService = await app.get(QueueService);

  // Inicializa WebSocket
  websocketService.init({ port: 8080, path: '/ws' });
  console.log('WebSocket server listening on ws://localhost:8080/ws');

  // Registra processor de queue
  queueService.registerProcessor('ai-processing', async (data: any) => {
    const { ClaudeService } = await import('@prometheus/claude');
    const claudeService = await app.get(ClaudeService);
    return claudeService.chat(data.message);
  });

  // Define rotas
  const chatController = await app.get('ChatController' as any);
  const ragController = await app.get('RAGController' as any);

  // Chat routes
  server.post('/chat', (req, res) => chatController.chat(req, res));
  server.post('/chat/conversation/:id', (req, res) => chatController.conversation(req, res));
  server.get('/chat/stream', (req, res) => chatController.stream(req, res));
  server.post('/chat/async', (req, res) => chatController.processAsync(req, res));

  // RAG routes
  server.post('/rag/documents', (req, res) => ragController.addDocuments(req, res));
  server.get('/rag/search', (req, res) => ragController.search(req, res));
  server.post('/rag/generate', (req, res) => ragController.generate(req, res));
  server.get('/rag/stream', (req, res) => ragController.generateStream(req, res));

  // Health check
  server.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Inicia servidor HTTP
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`
╔═══════════════════════════════════════════╗
║                                           ║
║  Prometheus - AI-Powered Enterprise API  ║
║                                           ║
╚═══════════════════════════════════════════╝

🚀 Server running on http://localhost:${port}
🔌 WebSocket on ws://localhost:8080/ws

Endpoints:
  POST   /chat                    - Simple chat
  POST   /chat/conversation/:id   - Chat with history
  GET    /chat/stream             - SSE streaming chat
  POST   /chat/async              - Async processing

  POST   /rag/documents           - Add documents
  GET    /rag/search              - Search context
  POST   /rag/generate            - RAG generation
  GET    /rag/stream              - RAG streaming

  GET    /health                  - Health check
    `);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
