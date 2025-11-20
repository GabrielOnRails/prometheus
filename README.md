# Prometheus

<div align="center">

**Um framework Node.js progressivo para construir aplicações de servidor eficientes, escaláveis e de nível empresarial com foco em IA**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

## Características

- **🤖 IA Nativa**: Integração completa com Anthropic Claude, RAG, orquestração de LLMs
- **⚡ Performance**: Cache multi-camadas, worker threads, clustering, queue management
- **🏗️ Arquitetura Microservices**: Event-driven, message brokers, comunicação distribuída
- **📡 Real-time**: WebSockets e Server-Sent Events para streaming de IA
- **💉 Dependency Injection**: Sistema robusto de DI com decorators
- **🔄 Lifecycle Hooks**: Controle total sobre o ciclo de vida da aplicação
- **🎯 TypeScript First**: Totalmente tipado com decorators e metadata
- **🚀 Enterprise Ready**: Modularidade, testabilidade, escalabilidade

## Arquitetura

```
prometheus/
├── packages/
│   ├── core/           # Núcleo do framework (DI, lifecycle, módulos)
│   ├── common/         # Tipos, interfaces e decorators compartilhados
│   ├── claude/         # Integração com Anthropic Claude
│   ├── rag/            # Sistema RAG (embeddings + vector DB)
│   ├── cache/          # Sistema de cache multi-camadas (Memory + Redis)
│   ├── queue/          # Gerenciamento de filas (BullMQ)
│   ├── streaming/      # WebSocket e SSE para comunicação real-time
│   └── microservices/  # Ferramentas para arquitetura de microservices
├── examples/
│   └── ai-chat-api/    # Exemplo completo de API de chat com IA
└── docs/               # Documentação
```

## Instalação

```bash
npm install @prometheus/core @prometheus/claude
```

## Quick Start

### 1. Criar Módulo Principal

```typescript
import { Module } from '@prometheus/core';
import { ClaudeModule, ClaudeModel } from '@prometheus/claude';

@Module({
  imports: [
    ClaudeModule.forRoot({
      apiKey: process.env.ANTHROPIC_API_KEY!,
      model: ClaudeModel.CLAUDE_3_5_SONNET,
      maxTokens: 4096,
    }),
  ],
})
export class AppModule {}
```

### 2. Criar Service

```typescript
import { Injectable } from '@prometheus/core';
import { ClaudeService } from '@prometheus/claude';

@Injectable()
export class ChatService {
  constructor(private claudeService: ClaudeService) {}

  async chat(message: string): Promise<string> {
    return this.claudeService.chat(message);
  }
}
```

### 3. Bootstrap da Aplicação

```typescript
import { PrometheusFactory } from '@prometheus/core';
import { AppModule } from './app.module';

const app = await PrometheusFactory.create(AppModule);
await app.listen(3000);
```

## Recursos Principais

### 🤖 Integração com Claude

```typescript
import { ClaudeService } from '@prometheus/claude';

// Chat simples
const response = await claudeService.chat('Olá!');

// Streaming
for await (const chunk of claudeService.stream({ messages: [...] })) {
  console.log(chunk.delta.text);
}

// Conversação com histórico
const reply = await claudeService.conversation('session-id', 'Como você está?');
```

### 📚 Sistema RAG

```typescript
import { RAGService } from '@prometheus/rag';

// Adicionar documentos
await ragService.addDocuments([
  { id: 'doc1', content: 'Conteúdo do documento...' }
]);

// Gerar com contexto
const response = await ragService.generate('Sua pergunta aqui', {
  contextLimit: 3,
  temperature: 0.7,
});
```

### 💾 Cache Multi-camadas

```typescript
import { CacheService } from '@prometheus/cache';

// Wrapper automático com cache
const result = await cacheService.wrap(
  'cache-key',
  () => expensiveOperation(),
  300 // TTL em segundos
);
```

### 📬 Queue Management

```typescript
import { QueueService } from '@prometheus/queue';

// Adicionar job
const jobId = await queueService.addJob('ai-processing', 'task', data);

// Processar jobs
queueService.registerProcessor('ai-processing', async (data) => {
  return processData(data);
});
```

### 📡 Streaming Real-time

```typescript
import { WebSocketService } from '@prometheus/streaming';

// WebSocket
websocketService.onMessage('chat', async (data, clientId) => {
  const stream = chatService.stream(data.message);
  await websocketService.streamToClient(clientId, stream);
});

// SSE
await sseService.streamGenerator(res, asyncGenerator, 'event-name');
```

### 🔧 Microservices

```typescript
import { MessagePattern, EventPattern } from '@prometheus/common';

@Controller()
export class UserController {
  @MessagePattern('get_user')
  async getUser(data: { id: string }) {
    return { id: data.id, name: 'John' };
  }

  @EventPattern('user_created')
  async handleUserCreated(data: any) {
    console.log('User created:', data);
  }
}
```

## Exemplo Completo

Veja um exemplo completo de API de chat com IA em [`examples/ai-chat-api`](./examples/ai-chat-api).

O exemplo demonstra:
- ✅ Chat simples com cache
- ✅ Chat com histórico de conversa
- ✅ Streaming via SSE e WebSocket
- ✅ Sistema RAG completo
- ✅ Processamento assíncrono com filas
- ✅ Arquitetura modular e escalável

## Instalação do Exemplo

```bash
cd examples/ai-chat-api
npm install
cp .env.example .env
# Editar .env com suas API keys
npm run dev
```

## Módulos Disponíveis

| Módulo | Descrição | Instalação |
|--------|-----------|------------|
| `@prometheus/core` | Núcleo do framework | `npm i @prometheus/core` |
| `@prometheus/claude` | Integração Anthropic Claude | `npm i @prometheus/claude` |
| `@prometheus/rag` | Sistema RAG | `npm i @prometheus/rag` |
| `@prometheus/cache` | Cache multi-camadas | `npm i @prometheus/cache` |
| `@prometheus/queue` | Gerenciamento de filas | `npm i @prometheus/queue` |
| `@prometheus/streaming` | WebSocket & SSE | `npm i @prometheus/streaming` |
| `@prometheus/microservices` | Ferramentas microservices | `npm i @prometheus/microservices` |

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Build todos os pacotes
npm run build

# Desenvolvimento (watch mode)
npm run dev

# Testes
npm test

# Lint
npm run lint
```

## Roadmap

- [x] Core framework com DI e lifecycle
- [x] Integração com Anthropic Claude
- [x] Sistema RAG (embeddings + vector DB)
- [x] Cache multi-camadas
- [x] Queue management
- [x] Streaming (WebSocket + SSE)
- [x] Microservices support
- [ ] LLM Orchestration (agents, chains, workflows)
- [ ] Prompt Management e versionamento
- [ ] Worker Threads e Clustering
- [ ] Fine-tuning Pipeline
- [ ] CLI para scaffolding
- [ ] Monitoramento e métricas
- [ ] Autenticação e autorização

## Contribuindo

Contribuições são bem-vindas! Por favor, leia nosso guia de contribuição.

## Licença

MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Suporte

- 📚 [Documentação](./docs)
- 💬 [Discussões](https://github.com/prometheus/discussions)
- 🐛 [Issues](https://github.com/prometheus/issues)
- 🌟 [Examples](./examples)

---

<div align="center">
Feito com ❤️ para desenvolvedores que constroem aplicações de IA
</div>
