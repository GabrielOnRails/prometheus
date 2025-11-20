import { Injectable, Inject } from '@prometheus/common';
import { LRUCache } from 'lru-cache';
import Redis from 'ioredis';

/**
 * Serviço de cache multi-camadas
 */
@Injectable()
export class CacheService {
  private memoryCache: LRUCache<string, any>;
  private redisCache?: Redis;

  constructor(@Inject('CACHE_OPTIONS') private options: CacheOptions) {
    // Cache em memória (L1)
    this.memoryCache = new LRUCache({
      max: options.memoryMaxItems || 500,
      ttl: (options.memoryTTL || 60) * 1000,
    });

    // Cache Redis (L2)
    if (options.redis) {
      this.redisCache = new Redis(options.redis);
    }
  }

  /**
   * Obtém valor do cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    // L1: Memory cache
    const memoryValue = this.memoryCache.get(key);
    if (memoryValue !== undefined) {
      return memoryValue;
    }

    // L2: Redis cache
    if (this.redisCache) {
      const redisValue = await this.redisCache.get(key);
      if (redisValue) {
        const parsed = JSON.parse(redisValue);
        this.memoryCache.set(key, parsed);
        return parsed;
      }
    }

    return null;
  }

  /**
   * Define valor no cache
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    // L1: Memory cache
    this.memoryCache.set(key, value);

    // L2: Redis cache
    if (this.redisCache) {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.redisCache.setex(key, ttl, serialized);
      } else {
        await this.redisCache.set(key, serialized);
      }
    }
  }

  /**
   * Deleta do cache
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    if (this.redisCache) {
      await this.redisCache.del(key);
    }
  }

  /**
   * Limpa todo o cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    if (this.redisCache) {
      await this.redisCache.flushdb();
    }
  }

  /**
   * Wrapper para cachear resultado de função
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }
}

export interface CacheOptions {
  memoryMaxItems?: number;
  memoryTTL?: number;
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
}
