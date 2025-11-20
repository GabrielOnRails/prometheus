import 'reflect-metadata';

const MESSAGE_PATTERN_METADATA = Symbol('MESSAGE_PATTERN_METADATA');
const EVENT_PATTERN_METADATA = Symbol('EVENT_PATTERN_METADATA');

/**
 * Define um handler para mensagens de microservice
 */
export function MessagePattern(pattern: string | object): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(MESSAGE_PATTERN_METADATA, pattern, descriptor.value);
    return descriptor;
  };
}

/**
 * Define um handler para eventos de microservice
 */
export function EventPattern(pattern: string | object): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(EVENT_PATTERN_METADATA, pattern, descriptor.value);
    return descriptor;
  };
}

export function getMessagePattern(handler: Function): string | object | undefined {
  return Reflect.getMetadata(MESSAGE_PATTERN_METADATA, handler);
}

export function getEventPattern(handler: Function): string | object | undefined {
  return Reflect.getMetadata(EVENT_PATTERN_METADATA, handler);
}

export { MESSAGE_PATTERN_METADATA, EVENT_PATTERN_METADATA };
