import { Type, DynamicModule, ModuleMetadata, getModuleMetadata } from '@prometheus/common';

/**
 * Compila e processa módulos
 */
export class ModuleCompiler {
  /**
   * Compila um módulo estático ou dinâmico
   */
  compile(moduleType: Type<any> | DynamicModule): CompiledModule {
    const isDynamic = this.isDynamicModule(moduleType);

    const module = isDynamic ? moduleType.module : (moduleType as Type<any>);
    const metadata = isDynamic
      ? moduleType
      : getModuleMetadata(module);

    return {
      type: module,
      metadata,
      isDynamic,
      isGlobal: isDynamic ? moduleType.global || false : false,
    };
  }

  /**
   * Verifica se é um módulo dinâmico
   */
  private isDynamicModule(module: any): module is DynamicModule {
    return module && module.module !== undefined;
  }

  /**
   * Extrai todos os módulos importados recursivamente
   */
  async extractImports(
    modules: Array<Type<any> | DynamicModule>,
    visited = new Set<Type<any>>()
  ): Promise<CompiledModule[]> {
    const compiled: CompiledModule[] = [];

    for (const moduleType of modules) {
      const compiledModule = this.compile(moduleType);

      if (visited.has(compiledModule.type)) {
        continue;
      }

      visited.add(compiledModule.type);
      compiled.push(compiledModule);

      if (compiledModule.metadata.imports) {
        const nestedModules = await this.extractImports(
          compiledModule.metadata.imports,
          visited
        );
        compiled.push(...nestedModules);
      }
    }

    return compiled;
  }
}

export interface CompiledModule {
  type: Type<any>;
  metadata: ModuleMetadata;
  isDynamic: boolean;
  isGlobal: boolean;
}
