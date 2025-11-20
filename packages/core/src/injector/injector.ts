import 'reflect-metadata';
import { Type } from '@prometheus/common';
import { Provider, Scope } from '@prometheus/common';
import { getInjectionTokens } from '@prometheus/common';

/**
 * Container de Dependency Injection
 */
export class Injector {
  private instances = new Map<any, any>();
  private providers = new Map<any, Provider>();

  constructor(private parent?: Injector) {}

  /**
   * Registra um provider
   */
  registerProvider(provider: Provider): void {
    if (this.isClassProvider(provider)) {
      this.providers.set(provider.provide, provider);
    } else if (this.isValueProvider(provider)) {
      this.providers.set(provider.provide, provider);
      this.instances.set(provider.provide, provider.useValue);
    } else if (this.isFactoryProvider(provider)) {
      this.providers.set(provider.provide, provider);
    } else if (this.isExistingProvider(provider)) {
      this.providers.set(provider.provide, provider);
    } else if (typeof provider === 'function') {
      this.providers.set(provider, { provide: provider, useClass: provider });
    }
  }

  /**
   * Resolve uma dependência
   */
  async get<T = any>(token: string | symbol | Type<T>, isOptional = false): Promise<T> {
    // Verifica se já existe uma instância
    if (this.instances.has(token)) {
      return this.instances.get(token);
    }

    // Busca o provider
    const provider = this.providers.get(token);

    if (!provider) {
      // Tenta buscar no parent injector
      if (this.parent) {
        return this.parent.get(token, isOptional);
      }

      if (isOptional) {
        return undefined as any;
      }

      throw new Error(`No provider found for ${String(token)}`);
    }

    // Resolve baseado no tipo de provider
    let instance: T;

    if (this.isClassProvider(provider)) {
      instance = await this.createInstance(provider.useClass);

      if (provider.scope !== Scope.TRANSIENT) {
        this.instances.set(token, instance);
      }
    } else if (this.isFactoryProvider(provider)) {
      const dependencies = await this.resolveDependencies(provider.inject || []);
      instance = await provider.useFactory(...dependencies);

      if (provider.scope !== Scope.TRANSIENT) {
        this.instances.set(token, instance);
      }
    } else if (this.isExistingProvider(provider)) {
      instance = await this.get(provider.useExisting);
    } else {
      throw new Error(`Invalid provider for ${String(token)}`);
    }

    return instance!;
  }

  /**
   * Cria uma instância de uma classe resolvendo suas dependências
   */
  private async createInstance<T>(target: Type<T>): Promise<T> {
    const paramTypes = Reflect.getMetadata('design:paramtypes', target) || [];
    const injectionTokens = getInjectionTokens(target);

    const dependencies = await Promise.all(
      paramTypes.map(async (paramType: any, index: number) => {
        const token = injectionTokens.get(index) || paramType;
        return this.get(token);
      })
    );

    return new target(...dependencies);
  }

  /**
   * Resolve um array de dependências
   */
  private async resolveDependencies(tokens: any[]): Promise<any[]> {
    return Promise.all(tokens.map(token => this.get(token)));
  }

  /**
   * Type guards para providers
   */
  private isClassProvider(provider: any): provider is { provide: any; useClass: Type; scope?: Scope } {
    return provider.useClass !== undefined;
  }

  private isValueProvider(provider: any): provider is { provide: any; useValue: any } {
    return provider.useValue !== undefined;
  }

  private isFactoryProvider(provider: any): provider is {
    provide: any;
    useFactory: Function;
    inject?: any[];
    scope?: Scope;
  } {
    return provider.useFactory !== undefined;
  }

  private isExistingProvider(provider: any): provider is { provide: any; useExisting: any } {
    return provider.useExisting !== undefined;
  }

  /**
   * Cria um child injector
   */
  createChild(): Injector {
    return new Injector(this);
  }

  /**
   * Limpa todas as instâncias
   */
  clear(): void {
    this.instances.clear();
  }
}
