# Guia de Início Rápido - Prometheus

Este guia vai te ajudar a criar sua primeira aplicação com Prometheus em minutos.

## Pré-requisitos

- Node.js 18 ou superior
- npm ou yarn
- Uma API key da Anthropic (obtenha em https://console.anthropic.com)
- (Opcional) API key da OpenAI para embeddings

## Passo 1: Criar Novo Projeto

```bash
mkdir meu-app-ai
cd meu-app-ai
npm init -y
```

## Passo 2: Instalar Dependências

```bash
npm install @prometheus/core @prometheus/claude reflect-metadata
npm install -D typescript @types/node ts-node
```

## Passo 3: Configurar TypeScript

Crie `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

## Passo 4: Criar Variáveis de Ambiente

Crie `.env`:

```env
ANTHROPIC_API_KEY=sua_api_key_aqui
```

## Passo 5: Criar Módulo Principal

Crie `src/app.module.ts`:

```typescript
import { Module } from '@prometheus/core';
import { ClaudeModule, ClaudeModel } from '@prometheus/claude';
import { ChatService } from './chat.service';

@Module({
  imports: [
    ClaudeModule.forRoot({
      apiKey: process.env.ANTHROPIC_API_KEY!,
      model: ClaudeModel.CLAUDE_3_5_SONNET,
      maxTokens: 4096,
    }),
  ],
  providers: [ChatService],
})
export class AppModule {}
```

## Passo 6: Criar Service

Crie `src/chat.service.ts`:

```typescript
import { Injectable } from '@prometheus/core';
import { ClaudeService } from '@prometheus/claude';

@Injectable()
export class ChatService {
  constructor(private claudeService: ClaudeService) {}

  async chat(message: string): Promise<string> {
    const response = await this.claudeService.complete({
      messages: [{ role: 'user', content: message }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    return textContent?.text || '';
  }

  async *chatStream(message: string): AsyncGenerator<string> {
    const stream = this.claudeService.stream({
      messages: [{ role: 'user', content: message }],
    });

    for await (const chunk of stream) {
      if (chunk.delta?.text) {
        yield chunk.delta.text;
      }
    }
  }
}
```

## Passo 7: Criar Arquivo Principal

Crie `src/main.ts`:

```typescript
import 'reflect-metadata';
import { config } from 'dotenv';
import { PrometheusFactory } from '@prometheus/core';
import { AppModule } from './app.module';
import { ChatService } from './chat.service';

// Carrega variáveis de ambiente
config();

async function bootstrap() {
  // Cria aplicação
  const app = await PrometheusFactory.create(AppModule);

  // Obtém o ChatService
  const chatService = await app.get(ChatService);

  // Teste 1: Chat simples
  console.log('=== Teste 1: Chat Simples ===');
  const response = await chatService.chat('Olá! Quem é você?');
  console.log('Resposta:', response);
  console.log('');

  // Teste 2: Streaming
  console.log('=== Teste 2: Streaming ===');
  process.stdout.write('Resposta: ');
  for await (const chunk of chatService.chatStream('Conte uma piada curta')) {
    process.stdout.write(chunk);
  }
  console.log('\n');

  // Encerra aplicação
  await app.close();
}

bootstrap().catch(console.error);
```

## Passo 8: Adicionar Scripts ao package.json

Edite `package.json`:

```json
{
  "scripts": {
    "dev": "ts-node src/main.ts",
    "build": "tsc",
    "start": "node dist/main.js"
  }
}
```

## Passo 9: Executar

```bash
npm run dev
```

Você deve ver algo como:

```
=== Teste 1: Chat Simples ===
Resposta: Olá! Sou Claude, um assistente de IA criado pela Anthropic...

=== Teste 2: Streaming ===
Resposta: Por que o livro de matemática estava triste? Porque tinha muitos problemas!
```

## Próximos Passos

### Adicionar Cache

```bash
npm install @prometheus/cache ioredis lru-cache
```

```typescript
import { CacheModule } from '@prometheus/cache';

@Module({
  imports: [
    ClaudeModule.forRoot({ ... }),
    CacheModule.forRoot({
      memoryMaxItems: 500,
      memoryTTL: 300,
    }),
  ],
})
export class AppModule {}
```

### Adicionar RAG

```bash
npm install @prometheus/rag openai @pinecone-database/pinecone
```

```typescript
import { RAGModule } from '@prometheus/rag';

@Module({
  imports: [
    ClaudeModule.forRoot({ ... }),
    RAGModule.forRoot({
      embedding: {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY!,
      },
      vectorStore: {
        type: 'memory',
      },
    }),
  ],
})
export class AppModule {}
```

### Adicionar Streaming Real-time

```bash
npm install @prometheus/streaming ws
```

```typescript
import { StreamingModule } from '@prometheus/streaming';

@Module({
  imports: [
    ClaudeModule.forRoot({ ... }),
    StreamingModule,
  ],
})
export class AppModule {}
```

## Estrutura de Projeto Recomendada

```
meu-app-ai/
├── src/
│   ├── modules/          # Módulos da aplicação
│   │   └── chat/
│   │       ├── chat.module.ts
│   │       ├── chat.service.ts
│   │       └── chat.controller.ts
│   ├── common/           # Código compartilhado
│   │   ├── interfaces/
│   │   ├── decorators/
│   │   └── utils/
│   ├── config/           # Configurações
│   │   └── app.config.ts
│   ├── app.module.ts     # Módulo raiz
│   └── main.ts           # Bootstrap
├── .env                  # Variáveis de ambiente
├── tsconfig.json         # Config TypeScript
└── package.json
```

## Dicas

1. **Use Dependency Injection**: Sempre injete dependências via construtor
2. **Separe em Módulos**: Organize código em módulos coesos
3. **Cache Inteligente**: Use cache para reduzir custos de API
4. **Error Handling**: Sempre trate erros adequadamente
5. **Streaming**: Use streaming para respostas mais rápidas
6. **Testes**: Escreva testes para seus services

## Exemplo Completo

Para um exemplo completo e production-ready, veja:

```bash
cd examples/ai-chat-api
npm install
cp .env.example .env
npm run dev
```

## Recursos

- [Documentação Completa](./docs)
- [Exemplos](./examples)
- [API Reference](./docs/api)
- [Guias](./docs/guides)

## Problemas Comuns

### Error: No provider found

Certifique-se de que:
1. O provider está no array `providers` do módulo
2. A classe tem o decorator `@Injectable()`
3. O módulo está importado corretamente

### Error: API key not found

Verifique se:
1. O arquivo `.env` existe
2. A variável está definida corretamente
3. Você está carregando com `dotenv` antes de usar

### TypeScript errors com decorators

Certifique-se de que:
1. `experimentalDecorators: true` está no tsconfig.json
2. `emitDecoratorMetadata: true` está no tsconfig.json
3. `reflect-metadata` está importado no início do main.ts

## Suporte

- GitHub Issues: https://github.com/prometheus/issues
- Discussões: https://github.com/prometheus/discussions
- Exemplos: ./examples

---

Agora você está pronto para construir aplicações incríveis com IA usando Prometheus!
