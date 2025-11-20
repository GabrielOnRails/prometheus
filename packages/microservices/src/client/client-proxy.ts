import { ClientProxy as IClientProxy } from '@prometheus/common';
import { Transporter } from '../interfaces/transporter.interface';

/**
 * Proxy client para comunicação com microservices
 */
export class ClientProxy implements IClientProxy {
  constructor(private transporter: Transporter) {}

  /**
   * Envia mensagem e aguarda resposta
   */
  async send<TResult = any, TInput = any>(
    pattern: string | object,
    data: TInput
  ): Promise<TResult> {
    return this.transporter.send(pattern, data);
  }

  /**
   * Emite evento sem aguardar resposta
   */
  async emit<TResult = any, TInput = any>(
    pattern: string | object,
    data: TInput
  ): Promise<TResult> {
    await this.transporter.emit(pattern, data);
    return undefined as any;
  }

  /**
   * Fecha conexão
   */
  async close(): Promise<void> {
    await this.transporter.close();
  }
}
