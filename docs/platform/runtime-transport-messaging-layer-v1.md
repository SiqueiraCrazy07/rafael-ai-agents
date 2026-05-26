# Runtime Transport + Messaging Layer V1

## Objetivo

Runtime Transport + Messaging Layer V1 cria uma camada readonly-safe para transporte distribuido simulado entre runtime nodes, com envelopes, delivery tracking, ack/nack, retry metadata e durable transport simulation.

A V1 nao usa broker externo, nao faz comunicacao real de rede e nao envia mensagens destrutivas.

## Arquivos

- `runtime/transport/runtime-message-bus.js`
- `runtime/transport/runtime-envelope-manager.js`
- `runtime/transport/runtime-delivery-tracker.js`
- `runtime/transport/runtime-ack-manager.js`
- `runtime/transport/runtime-retry-transport.js`
- `runtime/transport/runtime-deadletter-queue.js`
- `runtime/transport/runtime-message-router.js`
- `runtime/transport/runtime-transport-audit.js`
- `runtime/transport/demo/runtime-transport-demo.js`

## Runtime Message Bus

O message bus cria mensagens entre nodes como metadata duravel:

- envelopes readonly-safe;
- routing metadata;
- delivery status;
- ack/nack;
- retry plan;
- dead letters.

Nenhuma mensagem e entregue via rede nesta V1.

## Envelopes

Cada envelope contem:

- `transportId`;
- `messageId`;
- `correlationId`;
- `executionId`;
- `workflowId`;
- source/target node;
- routing metadata;
- replay-safe metadata;
- `expiresAt`.

## Delivery Tracking

O tracker registra:

- delivery status;
- ack status;
- nack status;
- attempts;
- expiration;
- stale delivery detection.

## Ack/Nack

Ack e nack sao readonly-safe:

- ack registra aceite simulado;
- nack registra rejeicao, timeout metadata e delivery expiration metadata;
- nenhum ack altera state real de node.

## Retry Transport

Retry Transport gera:

- retry plan;
- retry delay metadata;
- transport recovery recommendation;
- escalation recommendation;
- `executeRetry=false`.

## Dead Letter Queue

DLQ coleta:

- mensagens expiradas;
- failed deliveries;
- transport failure metadata;
- replay recommendation.

## Message Router

O router seleciona node por:

- node health;
- capability;
- capacidade;
- split-brain avoidance;
- stale node avoidance;
- transport balancing.

## Integracoes

- Distributed Runtime: node health e routing.
- Distributed Queue: pressure e partitions.
- Replication: split-brain e stale nodes.
- Replay: envelopes replay-safe.
- Self-Healing: recovery recommendations.
- Event Bus: evento observacional de transporte.
- Scheduler: rotas legiveis.
- Telemetry: `memory/transport/` fica disponivel para coleta.
- Dashboard: relatorio pronto para exposicao futura.

## Persistencia

Relatorios em:

- `runtime-data/transport/`;
- `memory/transport/`.

## Script

```bash
npm run transport:demo
```

## Fallback Seguro

- Sem rota saudavel: delivery bloqueado e retry/deadletter planejado.
- Node stale: evita roteamento.
- Split-brain: evita node com ownership stale.
- Delivery expirado: nack e retry metadata.
- Sem broker externo: somente metadata duravel JSON.

## Riscos

- Transporte e local/declarativo.
- Ordering real entre nodes nao existe.
- Ack/nack nao representam confirmacao de rede real.
- Retry real ainda exige broker, lease transacional e human gate.
- Dashboard/API ainda nao possuem endpoint dedicado para transport.

## Readiness

Readiness: `runtime-transport-messaging-layer-v1-ready`.

A plataforma passa a ter envelopes, delivery tracking, ack/nack, retry transport, dead letter queue, routing e stale delivery detection em modo readonly-safe.
