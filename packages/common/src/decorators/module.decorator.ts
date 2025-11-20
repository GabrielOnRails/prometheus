import 'reflect-metadata';
import { ModuleMetadata } from '../interfaces/module.interface';

const MODULE_METADATA = Symbol('MODULE_METADATA');

/**
 * Decorator para definir um módulo
 */
export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(MODULE_METADATA, metadata, target);
  };
}

export function getModuleMetadata(target: Function): ModuleMetadata {
  return Reflect.getMetadata(MODULE_METADATA, target) || {};
}

export { MODULE_METADATA };
