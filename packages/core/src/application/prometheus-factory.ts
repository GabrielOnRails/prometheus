import { Type, DynamicModule } from '@prometheus/common';
import { PrometheusApplication } from './prometheus-application';

/**
 * Factory para criar aplicações Prometheus
 */
export class PrometheusFactory {
  /**
   * Cria uma aplicação Prometheus
   */
  static async create(
    module: Type<any> | DynamicModule,
    options?: PrometheusApplicationOptions
  ): Promise<PrometheusApplication> {
    const app = new PrometheusApplication(module);
    await app.init();
    return app;
  }

  /**
   * Cria uma aplicação de microservice
   */
  static async createMicroservice(
    module: Type<any> | DynamicModule,
    options?: PrometheusTransportOptions
  ): Promise<PrometheusApplication> {
    const app = new PrometheusApplication(module);
    await app.init();

    // TODO: Configurar microservice transport

    return app;
  }
}

export interface PrometheusApplicationOptions {
  logger?: boolean | any;
  cors?: boolean | any;
  bodyParser?: boolean | any;
}

export interface PrometheusTransportOptions {
  transport?: string;
  options?: any;
}
