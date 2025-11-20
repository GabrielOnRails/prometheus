import 'reflect-metadata';
import { ClaudeModel } from '../interfaces/claude.interface';

const USE_CLAUDE_METADATA = Symbol('USE_CLAUDE_METADATA');

export interface UseClaudeOptions {
  model?: ClaudeModel;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

/**
 * Decorator para marcar métodos que usam Claude
 */
export function UseClaude(options?: UseClaudeOptions): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(USE_CLAUDE_METADATA, options || {}, descriptor.value);
    return descriptor;
  };
}

export function getClaudeMetadata(handler: Function): UseClaudeOptions | undefined {
  return Reflect.getMetadata(USE_CLAUDE_METADATA, handler);
}

export { USE_CLAUDE_METADATA };
