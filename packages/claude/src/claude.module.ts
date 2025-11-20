import { Module, DynamicModule, Provider } from '@prometheus/common';
import { ClaudeService } from './services/claude.service';
import { ClaudeOptions } from './interfaces/claude.interface';

/**
 * Módulo principal do Claude
 */
@Module({
  providers: [ClaudeService],
  exports: [ClaudeService],
})
export class ClaudeModule {
  /**
   * Registra o módulo com opções
   */
  static forRoot(options: ClaudeOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'CLAUDE_OPTIONS',
        useValue: options,
      },
      ClaudeService,
    ];

    return {
      module: ClaudeModule,
      providers,
      exports: [ClaudeService],
      global: options.apiKey ? true : false,
    };
  }

  /**
   * Registra o módulo de forma assíncrona
   */
  static forRootAsync(options: ClaudeAsyncOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'CLAUDE_OPTIONS',
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
      ClaudeService,
    ];

    return {
      module: ClaudeModule,
      imports: options.imports || [],
      providers,
      exports: [ClaudeService],
      global: true,
    };
  }
}

export interface ClaudeAsyncOptions {
  imports?: any[];
  useFactory: (...args: any[]) => ClaudeOptions | Promise<ClaudeOptions>;
  inject?: any[];
}
