import { Injectable } from '@prometheus/common';

/**
 * Serviço SSE (Server-Sent Events)
 */
@Injectable()
export class SSEService {
  /**
   * Cria stream SSE response
   */
  createStream(res: any): SSEStream {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    return new SSEStream(res);
  }

  /**
   * Stream de generator async para SSE
   */
  async streamGenerator(
    res: any,
    generator: AsyncIterable<any>,
    eventName = 'message'
  ): Promise<void> {
    const stream = this.createStream(res);

    try {
      for await (const data of generator) {
        stream.send(data, eventName);
      }
      stream.end();
    } catch (error) {
      stream.sendError(error);
      stream.end();
    }
  }
}

/**
 * Helper class para SSE Stream
 */
export class SSEStream {
  constructor(private res: any) {}

  send(data: any, event = 'message'): void {
    this.res.write(`event: ${event}\n`);
    this.res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  sendError(error: any): void {
    this.send({ error: error.message }, 'error');
  }

  end(): void {
    this.res.end();
  }
}
