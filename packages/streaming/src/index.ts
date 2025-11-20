import { Module } from '@prometheus/common';
import { WebSocketService } from './websocket.service';
import { SSEService } from './sse.service';

@Module({
  providers: [WebSocketService, SSEService],
  exports: [WebSocketService, SSEService],
})
export class StreamingModule {}

export * from './websocket.service';
export * from './sse.service';
