import { Module, DynamicModule } from '@prometheus/common';
import { QueueService, QueueOptions } from './queue.service';

@Module({})
export class QueueModule {
  static forRoot(options: QueueOptions = {}): DynamicModule {
    return {
      module: QueueModule,
      providers: [
        { provide: 'QUEUE_OPTIONS', useValue: options },
        QueueService,
      ],
      exports: [QueueService],
      global: true,
    };
  }
}

export * from './queue.service';
