/**
 * Interfaces para comunicação entre microservices
 */

export interface MicroserviceOptions {
  transport: Transport;
  options?: any;
}

export enum Transport {
  TCP = 'TCP',
  REDIS = 'REDIS',
  NATS = 'NATS',
  MQTT = 'MQTT',
  GRPC = 'GRPC',
  KAFKA = 'KAFKA',
  RMQ = 'RMQ',
}

export interface MessagePattern {
  cmd: string;
  data?: any;
}

export interface EventPattern {
  event: string;
  data?: any;
}

export interface ClientProxy {
  send<TResult = any, TInput = any>(
    pattern: string | MessagePattern,
    data: TInput,
  ): Promise<TResult>;

  emit<TResult = any, TInput = any>(
    pattern: string | EventPattern,
    data: TInput,
  ): Promise<TResult>;
}
