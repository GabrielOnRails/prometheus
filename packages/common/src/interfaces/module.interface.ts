import { Type } from './type.interface';

/**
 * Interface para definição de módulos no FrameAI
 */
export interface ModuleMetadata {
  /**
   * Provedores que serão instanciados pelo injector
   */
  providers?: Provider[];

  /**
   * Controllers que serão registrados no módulo
   */
  controllers?: Type<any>[];

  /**
   * Módulos importados
   */
  imports?: Array<Type<any> | DynamicModule>;

  /**
   * Provedores exportados para outros módulos
   */
  exports?: Array<Type<any> | string>;
}

/**
 * Módulo dinâmico com configuração em runtime
 */
export interface DynamicModule extends ModuleMetadata {
  module: Type<any>;
  global?: boolean;
}

/**
 * Provider pode ser uma classe ou um objeto de configuração
 */
export type Provider<T = any> =
  | Type<T>
  | ClassProvider<T>
  | ValueProvider<T>
  | FactoryProvider<T>
  | ExistingProvider<T>;

export interface ClassProvider<T = any> {
  provide: string | symbol | Type<any>;
  useClass: Type<T>;
  scope?: Scope;
}

export interface ValueProvider<T = any> {
  provide: string | symbol | Type<any>;
  useValue: T;
}

export interface FactoryProvider<T = any> {
  provide: string | symbol | Type<any>;
  useFactory: (...args: any[]) => T | Promise<T>;
  inject?: Array<string | symbol | Type<any>>;
  scope?: Scope;
}

export interface ExistingProvider {
  provide: string | symbol | Type<any>;
  useExisting: string | symbol | Type<any>;
}

export enum Scope {
  DEFAULT = 'DEFAULT',
  TRANSIENT = 'TRANSIENT',
  REQUEST = 'REQUEST',
}
