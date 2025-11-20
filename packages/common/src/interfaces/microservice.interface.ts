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

export interface MessagePatternData {
  cmd: string;
  data?: any;
}

export interface EventPatternData {
  event: string;
  data?: any;
}

export interface ClientProxy {
  send<TResult = any, TInput = any>(
    pattern: string | MessagePatternData,
    data: TInput,
  ): Promise<TResult>;

  emit<TResult = any, TInput = any>(
    pattern: string | EventPatternData,
    data: TInput,
  ): Promise<TResult>;
}
