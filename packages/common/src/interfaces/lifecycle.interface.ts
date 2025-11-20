/**
 * Lifecycle hooks para módulos e providers
 */

export interface OnModuleInit {
  onModuleInit(): any | Promise<any>;
}

export interface OnModuleDestroy {
  onModuleDestroy(): any | Promise<any>;
}

export interface OnApplicationBootstrap {
  onApplicationBootstrap(): any | Promise<any>;
}

export interface OnApplicationShutdown {
  onApplicationShutdown(signal?: string): any | Promise<any>;
}
