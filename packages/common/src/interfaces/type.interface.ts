/**
 * Representa um tipo construtível
 */
export interface Type<T = any> extends Function {
  new (...args: any[]): T;
}

/**
 * Tipo abstrato que pode ou não ser instanciável
 */
export interface Abstract<T = any> extends Function {
  prototype: T;
}
