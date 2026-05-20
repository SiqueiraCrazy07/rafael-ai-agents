# Distributed Event Bus + Runtime Event Streaming V1

## Objetivo

Distributed Event Bus + Runtime Event Streaming V1 adiciona uma camada root `event-bus/` para orientar o Rafael AI Agents por eventos persistentes e distribuiveis, sem substituir o event bus legado em `runtime/event-bus/`.

A V1 e additive, readonly-safe e preserva `filesystem-db`, SQLite transacional e fallback JSON.

## Arquitetura

- `event-bus/runtime-event-bus.js`: fachada principal do publish/subscribe distribuivel.
- `event-bus/topic-manager.js`: cria e lista topicos governados.
- `event-bus/event-router.js`: aplica rotas por `event.type`, `topic` e `routingKey`.
- `event-bus/event-publisher.js`: wrapper simples para publicacao.
- `event-bus/event-subscriber.js`: contrato de subscriber readonly.
- `event-bus/event-stream-manager.js`: mantem streams em memoria com ordering metadata.
- `event-bus/event-persistence.js`: persiste eventos em database e JSON fallback.
- `event-bus/event-replay-engine.js`: replay readonly por workflow, correlationId, topico ou janela temporal.
- `event-bus/event-dead-letter-queue.js`: isola eventos invalidos e falhas de entrega.
- `event-bus/event-ack-manager.js`: registra acknowledgements.
- `event-bus/event-correlation-engine.js`: gera correlation, execution e distributed trace ids.
- `event-bus/event-backpressure-manager.js`: aplica throttling e overflow protection.
- `event-bus/event-rate-limiter.js`: limita volume de publicacao por janela.
- `event-bus/demo/event-bus-demo.js`: demo operacional e replay demo.

## Publish/Subscribe Runtime

Cada evento contem:

- `eventId`;
- `type`;
- `topic`;
- `source`;
- `workflowId`;
- `project`;
- `timestamp`;
- `payload`;
- `safetyMode`;
- `correlationId`;
- `executionId`;
- `routingKey`;
- `ordering`;
- `trace.distributedTraceId`.

Topicos padrao:

- `runtime.workflow`;
- `runtime.worker`;
- `runtime.scheduler`;
- `runtime.autonomous`;
- `runtime.database`;
- `runtime.telemetry`;
- `runtime.dashboard`;
- `runtime.plugins`;
- `runtime.connectors`;
- `runtime.dead-letter`.

## Persistent Event Streams

Eventos publicados recebem `ordering.sequence` e `ordering.streamPosition`.

Persistencia:

- database transacional SQLite quando disponivel;
- fallback para `filesystem-db` quando SQLite nao estiver disponivel;
- JSON obrigatorio em `runtime-data/event-bus/events/`;
- JSON obrigatorio em `memory/event-bus/events/`.

O database e additive. O JSON fallback permanece obrigatorio e suficiente para replay.

## Dead Letter Queue

Eventos seguem para DLQ quando ocorre:

- payload invalido;
- `type` ausente;
- falha de roteamento;
- falha de subscriber apos retries;
- rate limit excedido;
- overflow protection.

Itens de DLQ sao readonly-safe e persistidos como relatorios em `runtime-data/event-bus/` e `memory/event-bus/`.

## Event Replay

Replay e sempre readonly-safe e suporta:

- replay por `workflowId`;
- replay por `correlationId`;
- replay por `topic`;
- replay por janela temporal `from`/`to`.

Replay usa os eventos persistidos em JSON para preservar funcionamento mesmo sem database.

## Backpressure

A V1 implementa:

- throttling quando o buffer atinge o limiar configurado;
- saturation protection;
- overflow protection com DLQ;
- rate limiting por janela.

O objetivo e impedir crescimento sem limite e tornar pressao operacional visivel no output.

## Tracing Distribuido

O correlation engine registra:

- `correlationId`;
- `executionId`;
- `distributedTraceId`;
- `workflowChain`;
- indices por workflow, correlation e trace.

Esses campos conectam Workers, Scheduler, Autonomous Runtime, Database, Telemetry, Dashboard, Plugins e Connectors.

## Integracoes

A V1 publica eventos representando integracao com:

- Workers;
- Scheduler;
- Autonomous Runtime;
- Database;
- Telemetry;
- Dashboard;
- Plugins;
- Connectors.

Nenhum desses modulos passa a depender obrigatoriamente do novo bus nesta V1. A integracao e compatibilidade operacional e persistencia observavel.

## Persistencia

Diretorios:

- `runtime-data/event-bus/`;
- `runtime-data/event-bus/events/`;
- `memory/event-bus/`;
- `memory/event-bus/events/`.

Database:

- collection `distributed_events` via SQLite quando disponivel;
- fallback `filesystem-db` quando SQLite nao estiver disponivel.

## Scripts

```bash
npm run eventbus:demo
npm run eventbus:replay-demo
```

## Fallback Seguro

- Database indisponivel: JSON fallback continua.
- Subscriber falha: evento vai para DLQ e runtime continua.
- Evento invalido: DLQ com motivo.
- Rota ausente: DLQ.
- Saturacao: throttling ou overflow protection.
- Replay com diretorio ausente: retorna lista vazia com fallback seguro.

## Riscos

- Distribuicao multi-processo ainda e declarativa/local nesta V1.
- Ordering e garantido dentro do processo do demo, nao entre processos externos.
- SQLite local nao substitui broker distribuido real.
- Subscribers executam in-process e devem continuar readonly-safe.

## Readiness

Readiness: `distributed-event-bus-runtime-v1-ready`.

A plataforma passa a ter event streaming persistente, replay readonly, DLQ, ack, backpressure, rate limiting, topicos e tracing distribuido, preservando compatibilidade retroativa e fallback JSON.
