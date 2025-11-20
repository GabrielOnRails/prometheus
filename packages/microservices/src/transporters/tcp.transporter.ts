import * as net from 'net';
import { Transporter, TransporterOptions } from '../interfaces/transporter.interface';
import { EventEmitter } from 'events';

/**
 * TCP Transporter para comunicação entre microservices
 */
export class TCPTransporter extends EventEmitter implements Transporter {
  private server?: net.Server;
  private client?: net.Socket;
  private responseCallbacks = new Map<string, (data: any) => void>();
  private messageId = 0;

  constructor(private options: TransporterOptions = {}) {
    super();
    this.options.host = options.host || 'localhost';
    this.options.port = options.port || 3001;
  }

  /**
   * Inicia servidor TCP
   */
  async listen(callback: (data: any) => Promise<any>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = net.createServer((socket) => {
        socket.on('data', async (buffer) => {
          try {
            const message = JSON.parse(buffer.toString());
            const response = await callback(message);

            socket.write(JSON.stringify({
              id: message.id,
              response,
              error: null,
            }));
          } catch (error: any) {
            socket.write(JSON.stringify({
              id: message.id,
              response: null,
              error: error.message,
            }));
          }
        });
      });

      this.server.listen(this.options.port, this.options.host, () => {
        console.log(`TCP Transporter listening on ${this.options.host}:${this.options.port}`);
        resolve();
      });

      this.server.on('error', reject);
    });
  }

  /**
   * Envia mensagem e aguarda resposta (request-response)
   */
  async send(pattern: string | object, data: any): Promise<any> {
    const client = await this.getClient();
    const id = String(++this.messageId);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.responseCallbacks.delete(id);
        reject(new Error('Request timeout'));
      }, 10000);

      this.responseCallbacks.set(id, (responseData: any) => {
        clearTimeout(timeout);
        this.responseCallbacks.delete(id);

        if (responseData.error) {
          reject(new Error(responseData.error));
        } else {
          resolve(responseData.response);
        }
      });

      client.write(JSON.stringify({ id, pattern, data }));
    });
  }

  /**
   * Emite evento (fire-and-forget)
   */
  async emit(pattern: string | object, data: any): Promise<void> {
    const client = await this.getClient();
    const id = String(++this.messageId);
    client.write(JSON.stringify({ id, pattern, data, isEvent: true }));
  }

  /**
   * Obtém ou cria cliente TCP
   */
  private async getClient(): Promise<net.Socket> {
    if (this.client && !this.client.destroyed) {
      return this.client;
    }

    return new Promise((resolve, reject) => {
      this.client = net.createConnection({
        host: this.options.host,
        port: this.options.port,
      });

      this.client.on('connect', () => {
        resolve(this.client!);
      });

      this.client.on('data', (buffer) => {
        try {
          const message = JSON.parse(buffer.toString());
          const callback = this.responseCallbacks.get(message.id);
          if (callback) {
            callback(message);
          }
        } catch (error) {
          console.error('Failed to parse response:', error);
        }
      });

      this.client.on('error', reject);
    });
  }

  /**
   * Fecha conexões
   */
  async close(): Promise<void> {
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => resolve());
      });
    }

    if (this.client && !this.client.destroyed) {
      this.client.destroy();
    }
  }
}
