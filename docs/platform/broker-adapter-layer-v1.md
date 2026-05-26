# Broker Adapter Layer V1

## Objetivo

Broker Adapter Layer V1 cria uma abstracao comum para brokers futuros como Redis Streams, Kafka, NATS e RabbitMQ, mantendo nesta V1 adapters in-memory e file-based readonly-safe.

A V1 nao conecta em brokers externos e nao executa mensagens destrutivas.

## Arquivos

- `runtime/brokers/broker-adapter.js`
- `runtime/brokers/in-memory-broker-adapter.js`
- `runtime/brokers/file-broker-adapter.js`
- `runtime/brokers/broker-message-store.js`
- `runtime/brokers/broker-consumer-registry.js`
- `runtime/brokers/broker-delivery-policy.js`
- `runtime/brokers/broker-health-monitor.js`
- `runtime/brokers/broker-fallback-manager.js`
- `runtime/brokers/demo/broker-adapter-demo.js`

## Interface Comum

Todo adapter deve suportar:

- `publish`;
- `subscribe`;
- `ack`;
- `nack`;
- `health`.

Mensagens incluem metadata de retry, DLQ, correlation, execution e workflow.

## Adapters

`in-memory-broker-adapter` simula publish/subscribe local sem persistencia duravel.

`file-broker-adapter` persiste mensagens em JSON sob:

- `runtime-data/brokers/file-broker/`;
- `memory/brokers/file-broker/`.

## Delivery Policy

A policy gera:

- delivery status;
- retry metadata;
- retry delay;
- DLQ metadata;
- safety mode.

Ack/nack sao readonly-safe e nao confirmam entrega externa real.

## Health

O health monitor verifica adapters locais e reporta readiness para brokers futuros:

- Redis Streams;
- Kafka;
- NATS;
- RabbitMQ.

Todos ficam `interface-ready-not-enabled` nesta V1.

## Fallback

O fallback manager seleciona file broker quando um broker externo preferido nao existe. Se file broker nao existir, usa in-memory. Brokers externos ficam bloqueados nesta V1.

## Integracoes

- Runtime Transport: consome relatorio de envelopes/deliveries.
- Event Bus: contratos sao compativeis com publicacao futura.
- Distributed Queue: usa metadata de backpressure.
- Replication: usa metadata de split-brain.
- Self-Healing: retry e DLQ sao recovery-readable.
- Telemetry: `memory/brokers/` fica disponivel para coleta.
- Dashboard: relatorio pronto para exposicao futura.

## Persistencia

Relatorios em:

- `runtime-data/brokers/`;
- `memory/brokers/`.

## Script

```bash
npm run broker:demo
```

## Fallback Seguro

- Sem Redis/Kafka/NATS/RabbitMQ real.
- JSON fallback obrigatorio.
- Nack gera retry/DLQ metadata, nao redelivery real.
- Mensagens destrutivas nao sao executadas.
- File broker e in-memory broker sao locais e readonly-safe.

## Riscos

- In-memory perde estado ao fim do processo.
- File broker nao substitui broker transacional real.
- Ordering, consumer groups e partitions reais ainda nao existem.
- Ack/nack ainda sao metadata local.

## Readiness

Readiness: `broker-adapter-layer-v1-ready`.

A plataforma passa a ter contrato comum de broker, adapters locais, consumers, ack/nack, retry metadata, DLQ metadata, health check e fallback seguro para evoluir para Redis/Kafka/NATS/RabbitMQ.
