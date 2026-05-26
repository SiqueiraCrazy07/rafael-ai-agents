# Runtime State Replication + Consensus V1

## Objetivo

Runtime State Replication + Consensus V1 cria uma camada readonly-safe para sincronizacao declarativa, replicacao de snapshots, consensus metadata e state reconciliation entre runtime nodes.

A V1 nao executa consensus real distribuido, nao faz mutacao entre nodes e nao restaura estado real.

## Arquivos

- `runtime/replication/runtime-state-replicator.js`
- `runtime/replication/runtime-snapshot-manager.js`
- `runtime/replication/runtime-consensus-engine.js`
- `runtime/replication/runtime-state-reconciliation.js`
- `runtime/replication/runtime-replication-audit.js`
- `runtime/replication/runtime-node-sync-engine.js`
- `runtime/replication/runtime-state-versioning.js`
- `runtime/replication/demo/runtime-replication-demo.js`

## Runtime State Replication

O replicator consolida:

- cluster state;
- queue metadata;
- lease metadata;
- worker health metadata;
- replay metadata;
- recovery metadata.

O resultado e um estado replicavel readonly-safe, sem envio real entre processos.

## Snapshot Manager

Gera snapshots por node com:

- `snapshotId`;
- `nodeId`;
- payload normalizado;
- versionamento;
- hash de integridade;
- restore metadata readonly-safe.

Restore real fica bloqueado com `executeRestore=false`.

## Consensus Engine

O consensus e declarativo:

- simula maioria do cluster;
- gera election metadata;
- seleciona leader candidate;
- detecta stale nodes;
- detecta risco de split-brain.

Consensus real distribuido nao existe nesta V1.

## State Reconciliation

Detecta:

- lease divergence;
- queue divergence;
- worker metadata mismatch;
- snapshot version divergence;
- split-brain risk.

Cada issue gera recomendacao supervisionada.

## Node Sync Engine

Calcula:

- replication lag;
- stale replication;
- sync status por node;
- sync recommendations.

Sync real fica bloqueado com `executeSync=false`.

## Integracoes

- Distributed Runtime: cluster state, leases, heartbeat e node health.
- Distributed Queue: partitions, pressure e queue metadata.
- Replay: metadata de validacao.
- Self-Healing: recovery metadata.
- Event Bus: evento observacional de replicacao.
- Scheduler: fonte verificada para contexto.
- Telemetry: `memory/replication/` fica disponivel para coleta.
- Dashboard: relatorio pronto para exposicao futura.

## Persistencia

Relatorios em:

- `runtime-data/replication/`;
- `memory/replication/`.

## Script

```bash
npm run replication:demo
```

## Fallback Seguro

- Fonte ausente entra em modo seguro.
- JSON invalido e registrado em `readErrors`.
- Split-brain bloqueia sync real.
- Stale replication gera recomendacao, nao sincronizacao real.
- Restore real e consensus real ficam bloqueados.

## Riscos

- Consensus e simulado e nao protege processo real.
- Snapshots sao locais e derivados de JSON.
- Reconciliation e heuristica.
- Sync real ainda exige lock transacional, transporte e human gate.
- Dashboard/API ainda nao possuem endpoint dedicado para replication.

## Readiness

Readiness: `runtime-state-replication-consensus-v1-ready`.

A plataforma passa a ter snapshots versionados, metadata de consensus, deteccao de split-brain, reconciliation recommendations, replication lag e sync recommendations em modo readonly-safe.
