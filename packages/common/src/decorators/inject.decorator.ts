import 'reflect-metadata';
import { Type } from '../interfaces/type.interface';

const INJECT_METADATA = Symbol('INJECT_METADATA');

/**
 * Injeta uma dependência específica
 */
export function Inject(token: string | symbol | Type<any>): ParameterDecorator {
  return (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    const existingInjections = Reflect.getMetadata(INJECT_METADATA, target) || {};
    existingInjections[parameterIndex] = token;
    Reflect.defineMetadata(INJECT_METADATA, existingInjections, target);
  };
}

export function getInjectionTokens(target: Function): Map<number, any> {
  const tokens = Reflect.getMetadata(INJECT_METADATA, target) || {};
  return new Map(Object.entries(tokens).map(([key, value]) => [parseInt(key), value]));
}

export { INJECT_METADATA };
