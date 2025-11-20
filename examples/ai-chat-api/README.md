# Prometheus - AI Chat API Example

Este é um exemplo completo de aplicação construída com Prometheus, demonstrando:

- ✅ Integração com Anthropic Claude
- ✅ Sistema RAG (Retrieval-Augmented Generation)
- ✅ Cache multi-camadas (Memory + Redis)
- ✅ Queue management para processamento assíncrono
- ✅ Streaming em tempo real (WebSocket + SSE)
- ✅ Arquitetura modular e escalável

## Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Editar .env com suas API keys
nano .env
```

## Configuração

Edite o arquivo `.env`:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
```

## Executar

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start
```

## Endpoints

### Chat Simples

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Olá, como você pode me ajudar?"}'
```

### Chat com Histórico

```bash
curl -X POST http://localhost:3000/chat/conversation/session-123 \
  -H "Content-Type: application/json" \
  -d '{"message": "Qual é a capital do Brasil?"}'
```

### Streaming (SSE)

```bash
curl -N http://localhost:3000/chat/stream?message=Conte%20uma%20história
```

### Adicionar Documentos ao RAG

```bash
curl -X POST http://localhost:3000/rag/documents \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "id": "doc1",
        "content": "Prometheus é um framework Node.js progressivo para construir aplicações de IA...",
        "metadata": {"source": "docs", "type": "tutorial"}
      }
    ]
  }'
```

### Buscar Contexto

```bash
curl "http://localhost:3000/rag/search?query=O%20que%20é%20Prometheus&limit=3"
```

### Gerar com RAG

```bash
curl -X POST http://localhost:3000/rag/generate \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Como usar o Prometheus?",
    "contextLimit": 3,
    "temperature": 0.7
  }'
```

### WebSocket

```javascript
const ws = new WebSocket('ws://localhost:8080/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'chat',
    payload: { message: 'Olá via WebSocket!' }
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

## Arquitetura

```
src/
├── app.module.ts          # Módulo principal com configuração
├── main.ts                # Bootstrap da aplicação
├── controllers/           # Controllers HTTP/WebSocket
│   ├── chat.controller.ts
│   └── rag.controller.ts
└── services/              # Lógica de negócio
    └── chat.service.ts
```

## Features Demonstradas

### 1. Dependency Injection

```typescript
@Injectable()
export class ChatService {
  constructor(
    private claudeService: ClaudeService,
    private cacheService: CacheService,
  ) {}
}
```

### 2. Cache Automático

```typescript
return this.cacheService.wrap(
  `chat:${message}`,
  () => this.claudeService.chat(message),
  300 // TTL em segundos
);
```

### 3. Streaming em Tempo Real

```typescript
async *chatStream(message: string) {
  const stream = this.claudeService.stream({ messages: [...] });
  for await (const chunk of stream) {
    yield chunk.delta.text;
  }
}
```

### 4. Queue para Processamento Assíncrono

```typescript
const jobId = await this.queueService.addJob(
  'ai-processing',
  'chat',
  { message }
);
```

### 5. RAG (Retrieval-Augmented Generation)

```typescript
const response = await this.ragService.generate(query, {
  contextLimit: 3,
  temperature: 0.7,
});
```

## Performance

- **Cache L1 (Memory)**: ~1ms de latência
- **Cache L2 (Redis)**: ~5ms de latência
- **Streaming**: Resposta inicial em <100ms
- **Queue**: Processa até 5 jobs concorrentes

## Escalabilidade

Esta aplicação pode escalar horizontalmente:

1. **Stateless**: Todos os estados em Redis/Vector DB
2. **Microservices Ready**: Pode ser dividida em múltiplos serviços
3. **Queue-based**: Processamento distribuído via BullMQ
4. **Cache Distribuído**: Redis compartilhado entre instâncias

## Próximos Passos

- Adicionar autenticação (JWT)
- Implementar rate limiting
- Adicionar monitoramento e métricas
- Deploy em Kubernetes
- Integrar com vector database em produção (Pinecone/Qdrant)

## Licença

MIT
