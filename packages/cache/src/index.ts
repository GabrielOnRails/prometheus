import { Module, DynamicModule } from '@prometheus/common';
import { CacheService, CacheOptions } from './cache.service';

@Module({})
export class CacheModule {
  static forRoot(options: CacheOptions = {}): DynamicModule {
    return {
      module: CacheModule,
      providers: [
        { provide: 'CACHE_OPTIONS', useValue: options },
        CacheService,
      ],
      exports: [CacheService],
      global: true,
    };
  }
}

export * from './cache.service';
