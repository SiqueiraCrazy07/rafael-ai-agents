# Redis Streams Runtime Integration V1

## Objetivo

Redis Streams Runtime Integration V1 adiciona uma integracao opcional readonly-safe com Redis Streams, preparando o runtime para mensageria e fila distribuida real sem remover brokers locais e sem tornar Redis obrigatorio.

Redis fica atras da feature flag `REDIS_STREAMS_ENABLED`. Por padrao, a V1 usa fallback automatico para broker local.

## Arquivos

- `runtime/redis/redis-streams-adapter.js`
- `runtime/redis/redis-stream-publisher.js`
- `runtime/redis/redis-stream-consumer.js`
- `runtime/redis/redis-stream-group-manager.js`
- `runtime/redis/redis-stream-health.js`
- `runtime/redis/redis-stream-fallback.js`
- `runtime/redis/redis-stream-retry.js`
- `runtime/redis/redis-stream-audit.js`
- `runtime/redis/demo/redis-streams-demo.js`

## Adapter

O adapter implementa contrato compativel com broker:

- `publish`;
- `subscribe`;
- `ack`;
- `nack`;
- `health`.

Quando Redis nao esta habilitado, `publish` preserva a mensagem e encaminha para `file-broker`, mantendo readonly-safe e JSON fallback.

## Streams

Streams usados no demo:

- `runtime.transport.stream`;
- `runtime.queue.stream`;
- `runtime.replay.stream`.

Mensagens carregam `correlationId`, `executionId`, transport metadata e replay-safe metadata.

## Publisher

O publisher transforma envelopes de transport em mensagens Redis Stream-ready:

- `transportId`;
- `messageId`;
- routing metadata;
- replay metadata;
- payload readonly.

## Consumer

O consumer registra consumer groups e cria delivery metadata com:

- delivered;
- stale delivery;
- ack;
- nack;
- attempts.

Ack/nack nao executam mutacao real no Redis nesta V1.

## Group Manager

O group manager registra:

- groups;
- consumers;
- ownership metadata;
- pending metadata.

## Health

Health report inclui:

- Redis connectivity metadata;
- stream lag metadata;
- pending messages;
- unhealthy stream detection;
- fallback readiness.

## Retry

Retry metadata inclui:

- next attempt;
- delayed retry;
- replay recommendation;
- DLQ recommendation;
- `executeRetry=false`.

## Fallback

Se Redis estiver indisponivel ou desabilitado:

- seleciona `file-broker`;
- preserva runtime readonly-safe;
- nao interrompe transport, queue, streaming, workers ou dashboard;
- mantem fallback JSON.

## Integracoes

- Broker Layer: usa contrato comum e fallback local.
- Runtime Transport: publica envelopes.
- Distributed Queue: stream de queue metadata.
- Replay: recomenda replay antes de redelivery.
- Self-Healing: pending/retry alimentam recovery.
- Streaming: relatorio fica stream-readable.
- Telemetry: `memory/redis/` fica telemetry-readable.
- Dashboard: relatorio fica dashboard-readable.
- Multi-process Workers: reporta integration id.

## Persistencia

Relatorios em:

- `runtime-data/redis/`;
- `memory/redis/`.

## Script

```bash
npm run redis:demo
```

## Fallback Seguro

- Redis opcional.
- Fallback local obrigatorio.
- Sem comandos destrutivos.
- Ack/nack sao metadata readonly.
- Retry e DLQ sao metadata.
- Brokers locais continuam funcionando.

## Riscos

- Nenhum comando Redis real e executado por padrao nesta V1.
- Consumer groups e pending sao readiness metadata quando Redis esta desabilitado.
- Stream lag e estimado localmente no fallback.
- Redis real futuro exigira cliente oficial, credenciais governadas, TLS e human gate para rollout.

## Readiness

Readiness: `redis-streams-runtime-integration-v1-ready`.

A plataforma passa a ter contrato Redis Streams opcional, streams, groups, consumers, ack/nack metadata, pending metadata, stream lag, retry metadata e fallback automatico para broker local.
