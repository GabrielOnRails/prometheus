import { Injector } from '../injector/injector';
import { LifecycleManager } from '../lifecycle/lifecycle-manager';
import { ModuleCompiler, CompiledModule } from '../module/module-compiler';
import { Type, DynamicModule, Provider } from '@prometheus/common';

/**
 * Aplicação Prometheus
 */
export class PrometheusApplication {
  private injector: Injector;
  private lifecycleManager: LifecycleManager;
  private moduleCompiler: ModuleCompiler;
  private isInitialized = false;
  private shutdownListeners: Array<() => Promise<void>> = [];

  constructor(private readonly rootModule: Type<any> | DynamicModule) {
    this.injector = new Injector();
    this.lifecycleManager = new LifecycleManager();
    this.moduleCompiler = new ModuleCompiler();
  }

  /**
   * Inicializa a aplicação
   */
  async init(): Promise<this> {
    if (this.isInitialized) {
      return this;
    }

    // Compila módulos
    const modules = await this.moduleCompiler.extractImports([this.rootModule]);

    // Registra providers
    await this.registerModules(modules);

    // Chama lifecycle hooks
    await this.lifecycleManager.callModuleInitHooks();
    await this.lifecycleManager.callBootstrapHooks();

    this.isInitialized = true;

    // Registra handlers de shutdown
    this.registerShutdownHooks();

    return this;
  }

  /**
   * Registra módulos e seus providers
   */
  private async registerModules(modules: CompiledModule[]): Promise<void> {
    for (const module of modules) {
      // Registra o próprio módulo
      const moduleInstance = await this.injector.get(module.type);
      this.lifecycleManager.register(moduleInstance);

      // Registra providers
      if (module.metadata.providers) {
        for (const provider of module.metadata.providers) {
          this.injector.registerProvider(provider);

          // Se for uma classe, cria instância e registra no lifecycle
          if (typeof provider === 'function') {
            const instance = await this.injector.get(provider);
            this.lifecycleManager.register(instance);
          } else if ('useClass' in provider && provider.useClass) {
            const instance = await this.injector.get(provider.provide);
            this.lifecycleManager.register(instance);
          }
        }
      }

      // Registra controllers
      if (module.metadata.controllers) {
        for (const controller of module.metadata.controllers) {
          const instance = await this.injector.get(controller);
          this.lifecycleManager.register(instance);
        }
      }
    }
  }

  /**
   * Obtém uma instância do container
   */
  async get<T = any>(token: string | symbol | Type<T>): Promise<T> {
    return this.injector.get(token);
  }

  /**
   * Inicia servidor (placeholder, será implementado pelos adapters)
   */
  async listen(port: number, callback?: () => void): Promise<void> {
    console.log(`Prometheus application is listening on port ${port}`);
    if (callback) {
      callback();
    }
  }

  /**
   * Encerra a aplicação
   */
  async close(signal?: string): Promise<void> {
    await this.lifecycleManager.callModuleDestroyHooks();
    await this.lifecycleManager.callShutdownHooks(signal);

    // Chama shutdown listeners personalizados
    await Promise.all(this.shutdownListeners.map(listener => listener()));

    this.injector.clear();
    this.lifecycleManager.clear();
  }

  /**
   * Adiciona listener de shutdown
   */
  onShutdown(listener: () => Promise<void>): void {
    this.shutdownListeners.push(listener);
  }

  /**
   * Registra handlers de shutdown do sistema
   */
  private registerShutdownHooks(): void {
    const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];

    signals.forEach(signal => {
      process.on(signal, async () => {
        console.log(`Received ${signal}, closing application...`);
        await this.close(signal);
        process.exit(0);
      });
    });

    process.on('uncaughtException', async (error) => {
      console.error('Uncaught Exception:', error);
      await this.close('UNCAUGHT_EXCEPTION');
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      await this.close('UNHANDLED_REJECTION');
      process.exit(1);
    });
  }
}
