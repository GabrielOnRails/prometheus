import { Type } from '@prometheus/common';
import { getMessagePattern, getEventPattern } from '@prometheus/common';
import { Transporter } from '../interfaces/transporter.interface';

/**
 * Servidor de microservice que processa mensagens
 */
export class MicroserviceServer {
  private handlers = new Map<string, Function>();

  constructor(private transporter: Transporter) {}

  /**
   * Registra handlers de um controller
   */
  registerController(controller: any): void {
    const prototype = Object.getPrototypeOf(controller);
    const methodNames = Object.getOwnPropertyNames(prototype);

    for (const methodName of methodNames) {
      if (methodName === 'constructor') continue;

      const handler = prototype[methodName];

      // Verifica se é um message pattern
      const messagePattern = getMessagePattern(handler);
      if (messagePattern) {
        const key = typeof messagePattern === 'string'
          ? messagePattern
          : JSON.stringify(messagePattern);
        this.handlers.set(key, handler.bind(controller));
      }

      // Verifica se é um event pattern
      const eventPattern = getEventPattern(handler);
      if (eventPattern) {
        const key = typeof eventPattern === 'string'
          ? eventPattern
          : JSON.stringify(eventPattern);
        this.handlers.set(key, handler.bind(controller));
      }
    }
  }

  /**
   * Inicia o servidor
   */
  async listen(): Promise<void> {
    await this.transporter.listen(async (message) => {
      const patternKey = typeof message.pattern === 'string'
        ? message.pattern
        : JSON.stringify(message.pattern);

      const handler = this.handlers.get(patternKey);

      if (!handler) {
        throw new Error(`No handler found for pattern: ${patternKey}`);
      }

      return handler(message.data);
    });
  }

  /**
   * Fecha o servidor
   */
  async close(): Promise<void> {
    await this.transporter.close();
  }
}
