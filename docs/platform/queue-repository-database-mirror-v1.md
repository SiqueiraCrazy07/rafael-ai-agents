# Queue Repository + Database Mirror V1

## Objetivo

Adicionar repository dedicado para Queue na Persistent Database Layer e incluir dados de fila no mirror mode de forma estruturada, sem substituir os JSONs atuais.

## Componentes

Arquivos criados ou atualizados:

- `database/schemas/queue-schema.js`
- `database/repositories/queue-repository.js`
- `database/demo/database-queue-demo.js`
- `database/repositories/query-layer.js`
- `api/data/database-runtime-reader.js`
- `api/data/json-runtime-reader.js`

## Schema

O schema `queue` normaliza:

- `queueReportId`;
- `queueItems`;
- `retryItems`;
- `protectedQueue`;
- `metrics`;
- `throttling`;
- `workers`;
- `sourcePath`.

Tambem calcula:

- `totalQueueItems`;
- `totalRetryItems`;
- `protectedQueueCount`.

## Mirror Mode

Fontes espelhadas:

- `memory/queue/`;
- `runtime-data/queue/`.

Dados incluidos:

- itens de fila;
- itens de retry;
- protected queue;
- metricas;
- throttling;
- workers, heartbeats, leases, locks, results e telemetry events quando existirem.

O mirror e append-only e nao remove, reescreve ou substitui os JSONs originais.

Com Database Deduplication + Idempotency V1, novas execucoes do mirror usam `upsert` por chave logica da fila para evitar duplicacao de reports ja espelhados.

## API

Endpoint integrado:

- `GET /api/v1/runtime/queue`.

Ordem de leitura:

1. database layer via `QueueRepository`;
2. JSON atual via `JsonRuntimeReader` como fallback.

A resposta indica:

- `source`: `database` ou `json-fallback`;
- `fallbackUsed`;
- `readErrors`;
- `totalQueueItems`;
- `totalRetryItems`;
- `protectedQueueCount`.

## Persistencia

Relatorios de integracao sao persistidos em:

- `runtime-data/queue-database-integration/`;
- `memory/queue-database-integration/`.

A tabela filesystem-db fica em:

- `runtime-data/database/tables/queue.jsonl`.

## Script

```bash
npm run db:queue-demo
```

O demo executa mirror dedicado da queue, consulta o repository e persiste o relatorio de integracao.

## Fallback Seguro

Garantias:

- API continua readonly;
- runtime e workflows nao sao alterados;
- JSON continua preservado;
- database nao vira fonte primaria unica;
- repository vazio ou indisponivel aciona JSON fallback;
- erros de leitura ficam em `readErrors`.

## Riscos

- filesystem-db ainda nao e transacional.
- duplicatas legadas criadas antes da idempotencia nao sao removidas automaticamente.
- dados historicos de queue podem ter formatos diferentes.
- workers relacionados dependem de existirem no report de origem.

## Readiness

Readiness: `queue-repository-database-mirror-v1-ready`.

A fila agora possui repository dedicado, mirror estruturado e leitura API database-first com fallback seguro para JSON.
