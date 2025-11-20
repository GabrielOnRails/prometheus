import {
  OnModuleInit,
  OnModuleDestroy,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@prometheus/common';

/**
 * Gerencia o ciclo de vida de módulos e providers
 */
export class LifecycleManager {
  private instances: any[] = [];

  /**
   * Registra uma instância para lifecycle management
   */
  register(instance: any): void {
    if (!this.instances.includes(instance)) {
      this.instances.push(instance);
    }
  }

  /**
   * Chama hooks OnModuleInit em todas as instâncias
   */
  async callModuleInitHooks(): Promise<void> {
    for (const instance of this.instances) {
      if (this.hasHook(instance, 'onModuleInit')) {
        await instance.onModuleInit();
      }
    }
  }

  /**
   * Chama hooks OnApplicationBootstrap em todas as instâncias
   */
  async callBootstrapHooks(): Promise<void> {
    for (const instance of this.instances) {
      if (this.hasHook(instance, 'onApplicationBootstrap')) {
        await instance.onApplicationBootstrap();
      }
    }
  }

  /**
   * Chama hooks OnModuleDestroy em todas as instâncias
   */
  async callModuleDestroyHooks(): Promise<void> {
    for (const instance of this.instances.reverse()) {
      if (this.hasHook(instance, 'onModuleDestroy')) {
        await instance.onModuleDestroy();
      }
    }
  }

  /**
   * Chama hooks OnApplicationShutdown em todas as instâncias
   */
  async callShutdownHooks(signal?: string): Promise<void> {
    for (const instance of this.instances.reverse()) {
      if (this.hasHook(instance, 'onApplicationShutdown')) {
        await instance.onApplicationShutdown(signal);
      }
    }
  }

  /**
   * Verifica se a instância possui um hook específico
   */
  private hasHook(instance: any, hookName: string): boolean {
    return typeof instance[hookName] === 'function';
  }

  /**
   * Limpa todas as instâncias registradas
   */
  clear(): void {
    this.instances = [];
  }
}
