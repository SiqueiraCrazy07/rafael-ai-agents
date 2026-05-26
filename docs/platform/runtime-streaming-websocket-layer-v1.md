# Real-Time Runtime Streaming + WebSocket Layer V1

## Objetivo

Real-Time Runtime Streaming + WebSocket Layer V1 cria uma camada local readonly-safe para transmitir metadata operacional em tempo real do runtime distribuido.

A V1 usa WebSocket local, nao expoe rede externa, nao executa comandos destrutivos e preserva fallback JSON/snapshot.

## Arquivos

- `runtime/streaming/runtime-websocket-server.js`
- `runtime/streaming/runtime-stream-registry.js`
- `runtime/streaming/runtime-event-streamer.js`
- `runtime/streaming/runtime-live-telemetry-stream.js`
- `runtime/streaming/runtime-stream-backpressure.js`
- `runtime/streaming/runtime-stream-auth.js`
- `runtime/streaming/runtime-stream-audit.js`
- `runtime/streaming/runtime-dashboard-stream-adapter.js`
- `runtime/streaming/demo/runtime-streaming-demo.js`
- `dashboard/realtime/runtime-live-dashboard-demo.html`

## WebSocket Local

O servidor WebSocket roda apenas em `127.0.0.1` e publica eventos readonly-safe. Nesta V1 ele nao usa broker externo, nao aceita comandos de mutacao e nao abre exposicao externa.

Se o WebSocket nao estiver disponivel ou houver backpressure, o runtime retorna snapshot fallback.

## Streams e Channels

Channels registrados:

- `runtime.events`
- `runtime.telemetry`
- `runtime.replay`
- `runtime.recovery`
- `runtime.dashboard`
- `runtime.brokers`
- `runtime.transport`
- `runtime.replication`
- `runtime.queue`

Subscribers registram permissoes readonly e canais autorizados.

## Event Streaming

O streamer emite snapshots observacionais de:

- workers;
- queue;
- distributed queue;
- brokers;
- transport;
- replication;
- replay;
- recovery/self-healing;
- telemetry;
- dashboard;
- event bus.

## Live Telemetry

A telemetria live inclui:

- throughput;
- queue pressure;
- worker health;
- unhealthy nodes;
- replay pressure;
- replication lag;
- transport delivery status;
- broker health;
- saturation.

## Backpressure

O backpressure detecta excesso de eventos por subscriber e payload grande. Quando ocorre overload, a camada muda para `snapshot-fallback` e reduz eventos live.

## Auth

Auth e local e simulada:

- token local readonly;
- permissoes de leitura;
- comandos destrutivos negados;
- sem provedor externo real nesta V1.

## Dashboard Realtime

O dashboard adapter gera:

- live runtime updates;
- topology updates;
- timeline metadata;
- stream health cards.

O arquivo `dashboard/realtime/runtime-live-dashboard-demo.html` consome o snapshot gerado pelo demo.

## Integracoes

- Broker Adapter Layer: health e metadata de brokers.
- Runtime Transport: envelopes e delivery status.
- Distributed Runtime: cluster/node metadata.
- Distributed Queue: pressure, throttling e saturation.
- Replication: lag e split-brain metadata.
- Replay: replay-safe metadata.
- Self-Healing: recovery signals.
- Telemetry: metricas live.
- Dashboard: adapter realtime.
- Event Bus: eventos stream sao compativeis com contratos de evento.

## Persistencia

Relatorios em:

- `runtime-data/streaming/`;
- `memory/streaming/`.

## Script

```bash
npm run streaming:demo
```

## Fallback Seguro

- WebSocket indisponivel: snapshot fallback.
- Subscriber overload: stream throttling e snapshot mode.
- Token invalido: acesso negado.
- Comando destrutivo: negado.
- Sem broker externo: usa metadata local e JSON fallback.

## Riscos

- WebSocket e minimo/local e ainda nao possui fanout distribuido real.
- Auth e simulada.
- Stream throttling e metadata-only.
- Ordering global e garantia de entrega exigem broker real em fase futura.

## Readiness

Readiness: `runtime-streaming-websocket-layer-v1-ready`.

A plataforma passa a ter streaming realtime local readonly-safe com channels, subscribers, eventos runtime, live telemetry, backpressure, dashboard adapter e fallback snapshot.
