import 'reflect-metadata';
import { Scope } from '../interfaces/module.interface';

const INJECTABLE_METADATA = Symbol('INJECTABLE_METADATA');

export interface InjectableOptions {
  scope?: Scope;
}

/**
 * Marca uma classe como injetável (provider)
 */
export function Injectable(options?: InjectableOptions): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(INJECTABLE_METADATA, options || {}, target);
  };
}

export function isInjectable(target: Function): boolean {
  return Reflect.hasMetadata(INJECTABLE_METADATA, target);
}

export function getInjectableMetadata(target: Function): InjectableOptions {
  return Reflect.getMetadata(INJECTABLE_METADATA, target) || {};
}

export { INJECTABLE_METADATA };
