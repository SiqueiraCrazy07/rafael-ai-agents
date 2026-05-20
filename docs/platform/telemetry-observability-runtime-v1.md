# Telemetry + Observability Runtime V1

## Objetivo

Criar uma camada readonly de telemetria e observabilidade enterprise para consolidar sinais operacionais do Runtime, Queue, Router, Decision Engine, State Machine, Event Bus, Worker Runtime, Multi-Worker Orchestrator, Database Layer e API Layer.

## Componentes

- `telemetry/runtime-metrics-collector.js`: coleta métricas agregadas a partir de `memory/` e artefatos recentes.
- `telemetry/runtime-trace-manager.js`: correlaciona workflows por `workflowId`, `correlationId`, eventos, decisões, transições, leases e execuções.
- `telemetry/runtime-timeline-builder.js`: constrói timelines por workflow com estágios operacionais.
- `telemetry/runtime-telemetry-engine.js`: orquestra coleta, trace, timeline, detecção de problemas e persistência.
- `telemetry/runtime-observability-demo.js`: executa os demos `telemetry:demo` e `telemetry:timeline-demo`.

## Métricas Coletadas

- Execuções de workflow.
- Profundidade de fila.
- Itens em retry.
- Ocorrências de throttling.
- Utilização de workers.
- Workers unhealthy.
- Rebalances.
- Expiração de leases.
- Throughput de eventos.
- Throughput de decisões.

## Traces

O Trace Manager consolida por workflow:

- `correlationId`;
- `executionId`;
- atribuição de worker;
- transições de estado;
- decisões relacionadas;
- eventos relacionados;
- rebalances;
- leases.

## Timeline

O Timeline Builder gera uma linha do tempo por workflow com estágios:

- `queued`;
- `assigned`;
- `executing`;
- `throttled`;
- `retrying`;
- `rerouted`;
- `completed`;
- `failed`.

## Integrações

A V1 é observacional e não altera execução. Ela lê artefatos produzidos por:

- Worker Runtime;
- Multi-Worker Orchestrator;
- Event Bus;
- State Machine;
- Decision Engine;
- Database Layer;
- API Layer.

## Persistência

Relatórios completos são gravados em:

- `runtime-data/telemetry/`;
- `memory/telemetry/`.

Um resumo idempotente é espelhado na coleção `runtime_telemetry` do filesystem-db quando a Database Layer está disponível.

## Fallback Seguro

Se uma fonte estiver ausente ou contiver JSON inválido, o relatório continua sendo gerado com:

- `fallback.safeMode=true`;
- lista de `missingSources`;
- lista de `readErrors`;
- comportamento readonly com os dados disponíveis.

Nenhuma ação destrutiva, alteração de workflow ou execução real é disparada pela observabilidade.

## Scripts

- `npm run telemetry:demo`;
- `npm run telemetry:timeline-demo`.

## Riscos

- A precisão depende da qualidade dos relatórios existentes em `memory/`.
- Correlation IDs ausentes reduzem a profundidade da correlação.
- A V1 ainda não expõe endpoint API dedicado para telemetria.

## Readiness

A camada está pronta para operar como observabilidade enterprise inicial, com persistência própria, mirror em database e fallback seguro. Próximos passos naturais são endpoint API readonly, painéis e alertas governados.
