import { Injectable } from '@prometheus/common';
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';

/**
 * Serviço WebSocket para streaming em tempo real
 */
@Injectable()
export class WebSocketService {
  private wss?: WebSocketServer;
  private clients = new Map<string, WebSocket>();
  private messageHandlers = new Map<string, (data: any, clientId: string) => void>();

  /**
   * Inicializa servidor WebSocket
   */
  init(options: WebSocketOptions): void {
    this.wss = new WebSocketServer({
      port: options.port || 8080,
      path: options.path || '/ws',
    });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, ws);

      ws.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          const handler = this.messageHandlers.get(data.type);
          if (handler) {
            handler(data.payload, clientId);
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
      });

      // Envia mensagem de boas-vindas
      this.send(clientId, 'connected', { clientId });
    });
  }

  /**
   * Envia mensagem para um cliente específico
   */
  send(clientId: string, type: string, payload: any): void {
    const client = this.clients.get(clientId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type, payload }));
    }
  }

  /**
   * Faz broadcast para todos os clientes
   */
  broadcast(type: string, payload: any): void {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type, payload }));
      }
    });
  }

  /**
   * Registra handler para tipo de mensagem
   */
  onMessage(type: string, handler: (data: any, clientId: string) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Envia stream de dados
   */
  async streamToClient(
    clientId: string,
    stream: AsyncIterable<any>,
    type = 'stream'
  ): Promise<void> {
    for await (const chunk of stream) {
      this.send(clientId, type, chunk);
    }
    this.send(clientId, `${type}_end`, {});
  }

  /**
   * Fecha conexão com cliente
   */
  closeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.close();
      this.clients.delete(clientId);
    }
  }

  /**
   * Fecha servidor
   */
  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.wss?.close(() => resolve());
    });
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export interface WebSocketOptions {
  port?: number;
  path?: string;
}
