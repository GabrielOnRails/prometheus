import Redis from 'ioredis';
import { Transporter, TransporterOptions } from '../interfaces/transporter.interface';
import { EventEmitter } from 'events';

/**
 * Redis Transporter para comunicação pub/sub entre microservices
 */
export class RedisTransporter extends EventEmitter implements Transporter {
  private pub?: Redis;
  private sub?: Redis;
  private responseCallbacks = new Map<string, (data: any) => void>();
  private messageId = 0;

  constructor(private options: TransporterOptions = {}) {
    super();
    this.options.host = options.host || 'localhost';
    this.options.port = options.port || 6379;
  }

  /**
   * Inicia listener Redis
   */
  async listen(callback: (data: any) => Promise<any>): Promise<void> {
    this.pub = new Redis(this.options);
    this.sub = new Redis(this.options);

    const channel = this.options.channel || 'frameai:messages';

    await this.sub.subscribe(channel);

    this.sub.on('message', async (ch, message) => {
      if (ch !== channel) return;

      try {
        const data = JSON.parse(message);
        const response = await callback(data);

        // Envia resposta se não for evento
        if (!data.isEvent && data.replyTo) {
          await this.pub!.publish(data.replyTo, JSON.stringify({
            id: data.id,
            response,
            error: null,
          }));
        }
      } catch (error: any) {
        if (data.replyTo) {
          await this.pub!.publish(data.replyTo, JSON.stringify({
            id: data.id,
            response: null,
            error: error.message,
          }));
        }
      }
    });
  }

  /**
   * Envia mensagem e aguarda resposta (request-response)
   */
  async send(pattern: string | object, data: any): Promise<any> {
    if (!this.pub) {
      this.pub = new Redis(this.options);
      this.sub = new Redis(this.options);
    }

    const id = String(++this.messageId);
    const replyTo = `frameai:reply:${id}`;
    const channel = this.options.channel || 'frameai:messages';

    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        this.responseCallbacks.delete(id);
        this.sub!.unsubscribe(replyTo);
        reject(new Error('Request timeout'));
      }, 10000);

      await this.sub!.subscribe(replyTo);

      const messageHandler = (ch: string, message: string) => {
        if (ch !== replyTo) return;

        const responseData = JSON.parse(message);
        clearTimeout(timeout);
        this.responseCallbacks.delete(id);
        this.sub!.unsubscribe(replyTo);
        this.sub!.off('message', messageHandler);

        if (responseData.error) {
          reject(new Error(responseData.error));
        } else {
          resolve(responseData.response);
        }
      };

      this.sub!.on('message', messageHandler);

      await this.pub!.publish(channel, JSON.stringify({
        id,
        pattern,
        data,
        replyTo,
      }));
    });
  }

  /**
   * Emite evento (fire-and-forget)
   */
  async emit(pattern: string | object, data: any): Promise<void> {
    if (!this.pub) {
      this.pub = new Redis(this.options);
    }

    const id = String(++this.messageId);
    const channel = this.options.channel || 'frameai:messages';

    await this.pub.publish(channel, JSON.stringify({
      id,
      pattern,
      data,
      isEvent: true,
    }));
  }

  /**
   * Fecha conexões
   */
  async close(): Promise<void> {
    if (this.pub) {
      await this.pub.quit();
    }

    if (this.sub) {
      await this.sub.quit();
    }
  }
}
