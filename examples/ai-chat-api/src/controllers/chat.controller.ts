import { Controller, Injectable } from '@prometheus/core';
import { ChatService } from '../services/chat.service';
import { WebSocketService, SSEService } from '@prometheus/streaming';

/**
 * Controller para endpoints de chat
 */
@Controller('chat')
@Injectable()
export class ChatController {
  constructor(
    private chatService: ChatService,
    private websocketService: WebSocketService,
    private sseService: SSEService
  ) {
    // Registra handlers WebSocket
    this.setupWebSocket();
  }

  /**
   * Configura WebSocket para streaming de chat
   */
  private setupWebSocket(): void {
    this.websocketService.onMessage('chat', async (data, clientId) => {
      try {
        const stream = this.chatService.chatStream(data.message);
        await this.websocketService.streamToClient(clientId, stream, 'chat_response');
      } catch (error: any) {
        this.websocketService.send(clientId, 'error', { message: error.message });
      }
    });
  }

  /**
   * Endpoint HTTP para chat simples
   * POST /chat
   */
  async chat(req: any, res: any): Promise<void> {
    const { message, useCache = true } = req.body;

    try {
      const response = await this.chatService.chat(message, useCache);
      res.json({ response });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Endpoint para chat com histórico
   * POST /chat/conversation/:id
   */
  async conversation(req: any, res: any): Promise<void> {
    const { id } = req.params;
    const { message } = req.body;

    try {
      const response = await this.chatService.conversation(id, message);
      res.json({ response });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Endpoint para streaming via SSE
   * GET /chat/stream?message=...
   */
  async stream(req: any, res: any): Promise<void> {
    const { message } = req.query;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    try {
      const stream = this.chatService.chatStream(message);
      await this.sseService.streamGenerator(res, stream, 'chat');
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Endpoint para processamento assíncrono
   * POST /chat/async
   */
  async processAsync(req: any, res: any): Promise<void> {
    const { message } = req.body;

    try {
      const jobId = await this.chatService.processAsync(message);
      res.json({ jobId, status: 'processing' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
