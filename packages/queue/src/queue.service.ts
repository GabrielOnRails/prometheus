import { Injectable, Inject } from '@prometheus/common';
import { Queue, Worker, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';

/**
 * Serviço de gerenciamento de filas
 */
@Injectable()
export class QueueService {
  private queues = new Map<string, Queue>();
  private workers = new Map<string, Worker>();
  private connection: Redis;

  constructor(@Inject('QUEUE_OPTIONS') private options: QueueOptions) {
    this.connection = new Redis({
      host: options.redis?.host || 'localhost',
      port: options.redis?.port || 6379,
      maxRetriesPerRequest: null,
    });
  }

  /**
   * Obtém ou cria uma fila
   */
  getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, { connection: this.connection });
      this.queues.set(name, queue);
    }
    return this.queues.get(name)!;
  }

  /**
   * Adiciona job à fila
   */
  async addJob<T = any>(
    queueName: string,
    jobName: string,
    data: T,
    options?: JobOptions
  ): Promise<string> {
    const queue = this.getQueue(queueName);
    const job = await queue.add(jobName, data, {
      delay: options?.delay,
      priority: options?.priority,
      attempts: options?.attempts || 3,
      backoff: options?.backoff || { type: 'exponential', delay: 1000 },
    });
    return job.id!;
  }

  /**
   * Registra processor para uma fila
   */
  registerProcessor<T = any>(
    queueName: string,
    processor: (data: T) => Promise<any>
  ): void {
    if (this.workers.has(queueName)) {
      return;
    }

    const worker = new Worker(
      queueName,
      async (job) => {
        return processor(job.data);
      },
      {
        connection: this.connection,
        concurrency: this.options.concurrency || 5,
      }
    );

    worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed:`, err);
    });

    this.workers.set(queueName, worker);
  }

  /**
   * Para todos os workers
   */
  async close(): Promise<void> {
    await Promise.all([
      ...Array.from(this.workers.values()).map(w => w.close()),
      ...Array.from(this.queues.values()).map(q => q.close()),
    ]);
    await this.connection.quit();
  }
}

export interface QueueOptions {
  redis?: {
    host: string;
    port: number;
    password?: string;
  };
  concurrency?: number;
}

export interface JobOptions {
  delay?: number;
  priority?: number;
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
}
