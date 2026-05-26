# Distributed Runtime Coordinator V1

## Objetivo

Distributed Runtime Coordinator V1 cria uma camada readonly-safe para coordenar runtime nodes, workers, leases, heartbeats, cluster state e roteamento distribuido supervisionado.

A V1 nao executa multi-processo real, nao muta workflows e nao executa acoes destrutivas.

## Arquivos

- `runtime/distributed/distributed-runtime-coordinator.js`
- `runtime/distributed/runtime-node-registry.js`
- `runtime/distributed/distributed-lease-manager.js`
- `runtime/distributed/runtime-heartbeat-coordinator.js`
- `runtime/distributed/runtime-node-health-engine.js`
- `runtime/distributed/runtime-cluster-state.js`
- `runtime/distributed/runtime-node-failure-detector.js`
- `runtime/distributed/runtime-node-router.js`
- `runtime/distributed/demo/distributed-runtime-demo.js`

## Runtime Node Registry

Registra:

- runtime nodes;
- workers por node;
- capabilities;
- status;
- modo readonly-safe.

## Distributed Lease Manager

Gerencia leases declarativos:

- ownership;
- expiration;
- stale lease detection;
- recovery recommendation;
- sem lock real multi-processo nesta V1.

## Heartbeat Coordinator

Registra e avalia:

- heartbeat por node;
- stale node;
- unhealthy node;
- metrics operacionais do node.

## Runtime Cluster State

Consolida:

- nodes totais, saudaveis e unhealthy;
- workers ativos e unhealthy;
- leases ativos e expirados;
- queue pressure;
- execution pressure;
- replay pressure.

## Failure Detector

Detecta:

- node offline;
- stale heartbeat;
- lease inconsistency;
- worker isolation;
- queue imbalance.

Cada falha inclui recommendation readonly-safe.

## Runtime Router

Seleciona node saudavel por:

- capability;
- status do heartbeat;
- workers saudaveis;
- capacidade disponivel;
- saturation protection;
- lista de nodes a evitar.

## Integracoes

- Workers: workers registrados por node.
- Scheduler: rota e balance plan sao legiveis pelo scheduler.
- Event Bus: publica evento observacional `scheduler.plan.created`.
- Self-Healing: usa recomendacoes e sinais de recovery.
- Replay: usa contexto de workflow/execution/correlation.
- Persistence: relatorio em JSON.
- Telemetry: `memory/distributed-runtime/` fica disponivel para coleta.
- Dashboard: cluster state pronto para exposicao futura.

## Persistencia

Relatorios em:

- `runtime-data/distributed-runtime/`;
- `memory/distributed-runtime/`.

## Script

```bash
npm run distributed:demo
```

## Fallback Seguro

- Sem node saudavel: router retorna fallback.
- Lease stale: gera recomendacao, nao reassignment real.
- Node stale/unhealthy: evita roteamento.
- Multi-processo real bloqueado nesta V1.
- JSON fallback obrigatorio.

## Riscos

- Coordenação distribuida ainda e simulada/local.
- Leases nao sao locks reais entre processos.
- Heartbeat e avaliado no escopo do demo.
- Dashboard/API ainda nao possuem endpoint dedicado para cluster state.

## Readiness

Readiness: `distributed-runtime-coordinator-v1-ready`.

A plataforma agora possui coordenacao distribuida declarativa com nodes, workers, leases, heartbeat, cluster state, failure detection, routing e balancing readonly-safe.
