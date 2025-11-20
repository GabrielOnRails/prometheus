import 'reflect-metadata';

const CONTROLLER_METADATA = Symbol('CONTROLLER_METADATA');

export interface ControllerOptions {
  path?: string;
}

/**
 * Define um controller
 */
export function Controller(pathOrOptions?: string | ControllerOptions): ClassDecorator {
  const options: ControllerOptions =
    typeof pathOrOptions === 'string'
      ? { path: pathOrOptions }
      : pathOrOptions || {};

  return (target: Function) => {
    Reflect.defineMetadata(CONTROLLER_METADATA, options, target);
  };
}

export function getControllerMetadata(target: Function): ControllerOptions {
  return Reflect.getMetadata(CONTROLLER_METADATA, target) || {};
}

export function isController(target: Function): boolean {
  return Reflect.hasMetadata(CONTROLLER_METADATA, target);
}

export { CONTROLLER_METADATA };
