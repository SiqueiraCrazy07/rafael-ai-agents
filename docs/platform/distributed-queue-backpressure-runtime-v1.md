# Distributed Queue + Backpressure Runtime V1

## Objetivo

Distributed Queue + Backpressure Runtime V1 cria uma camada readonly-safe para queue distribuida, backpressure, throttling, retry orchestration, saturation protection e rebalanceamento declarativo.

A V1 nao usa broker externo, nao usa Redis/Kafka, nao executa reassignment real e nao altera workflows.

## Arquivos

- `runtime/queue/distributed-queue-runtime.js`
- `runtime/queue/queue-partition-manager.js`
- `runtime/queue/runtime-backpressure-engine.js`
- `runtime/queue/runtime-throttling-engine.js`
- `runtime/queue/distributed-retry-orchestrator.js`
- `runtime/queue/queue-pressure-monitor.js`
- `runtime/queue/queue-saturation-protection.js`
- `runtime/queue/queue-rebalancer.js`
- `runtime/queue/demo/distributed-queue-demo.js`

## Queue Partitions

O Partition Manager cria partitions por runtime node, com:

- `partitionId`;
- `nodeId`;
- ownership declarativo;
- queue items;
- retry items;
- protected queue;
- metadata de node e workers.

## Backpressure

O Backpressure Engine detecta:

- queue overload;
- retry storm;
- execution congestion;
- worker starvation;
- replay pressure.

Cada sinal possui severidade, evidencia, recomendacao e `safetyMode`.

## Throttling

O Throttling Engine gera plano readonly-safe:

- `none`;
- `moderate`;
- `aggressive`.

O plano recomenda reducao de concorrencia, atraso de execucao e preservacao de protected queue. Nenhum throttling real e aplicado nesta V1.

## Retry Orchestration

O Retry Orchestrator classifica retries, calcula delay, dobra delay em retry storm e recomenda human gate quando limite de retry e excedido.

## Saturation Protection

Saturation Protection protege o runtime de collapse risk:

- bloqueia assignment excessivo de forma declarativa;
- preserva protected queue;
- ativa safe mode quando backpressure e execution pressure estao altos.

## Queue Rebalancer

O Rebalancer cria plano declarativo para mover itens nao gated de nodes saturados ou unhealthy para nodes saudaveis.

`executeRebalance=false` em toda a V1.

## Integracoes

- Distributed Runtime: cluster state, node health e falhas.
- Scheduler: execution plan e forecast.
- Workers: retry items e protected queue.
- Replay: replay pressure.
- Self-Healing: queue saturation e recovery signals.
- Event Bus: publica evento observacional.
- Telemetry: `memory/distributed-queue/` fica disponivel para coleta.
- Dashboard: relatorio pronto para exposicao futura.

## Persistencia

Relatorios em:

- `runtime-data/distributed-queue/`;
- `memory/distributed-queue/`.

## Script

```bash
npm run distributed-queue:demo
```

## Fallback Seguro

- Fonte ausente usa fallback JSON ou dados demo conservadores.
- JSON invalido vira `readErrors`.
- Sem nodes disponiveis, usa node fallback readonly.
- Sem target de rebalanceamento, mantem itens na partition atual.
- Protected queue nunca e liberada automaticamente.
- Broker externo e multi-processo real ficam bloqueados nesta V1.

## Riscos

- Partitions sao locais e declarativas.
- Backpressure e heuristico.
- Rebalanceamento ainda nao move mensagens reais.
- Retry orchestration ainda nao agenda execucao real.
- Dashboard/API ainda nao possuem endpoint dedicado para distributed queue.

## Readiness

Readiness: `distributed-queue-backpressure-runtime-v1-ready`.

A plataforma passa a ter fila distribuida declarativa com partitions, backpressure, throttling, retry orchestration, saturation protection, rebalanceamento e recomendacoes de recovery em modo readonly-safe.
