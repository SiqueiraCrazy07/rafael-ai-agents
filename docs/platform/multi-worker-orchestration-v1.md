# Multi-Worker Orchestration V1

## Objetivo

Criar a primeira camada de orquestracao distribuida simulada entre multiplos workers do Rafael AI Agents.

## Arquivos

Arquivos criados:

- `runtime/orchestration/multi-worker-orchestrator.js`
- `runtime/orchestration/worker-lease-manager.js`
- `runtime/orchestration/worker-load-balancer.js`
- `runtime/orchestration/worker-rebalance-engine.js`
- `runtime/orchestration/orchestration-demo.js`
- `runtime/orchestration/rebalance-demo.js`

## Estrategia de Orquestracao

A V1 registra workers readonly, distribui queue items por capacidade e health, cria leases, executa workflows simulados e publica eventos de orquestracao.

Nenhuma acao externa real e executada. Todos os workflows do demo usam `project: platform`.

## Lease Manager

O lease manager suporta:

- worker lease;
- lease expiration;
- worker lock por queue item;
- safe lease renewal;
- orphan execution detection.

Leases ficam em memoria do processo e sao persistidos no report de orquestracao.

## Load Balancer

O load balancer:

- distribui queueItems;
- respeita `concurrencyLimit`;
- respeita `enabled`, `status` e `healthStatus`;
- evita workers unhealthy;
- preserva protected queue sem mover itens gated.

## Rebalance Engine

O rebalance engine:

- detecta workers saturados;
- procura worker alternativo saudavel;
- move workflows quando existe destino seguro;
- publica reroute seguro;
- nao move protected queue.

## Eventos

Eventos publicados:

- `worker-lease-created`;
- `worker-lease-expired`;
- `workflow-rebalanced`;
- `worker-overloaded`;
- `worker-unhealthy`.

Esses eventos foram adicionados ao Event Bus e aos filtros de eventos da API.

## Integracoes

### Worker Runtime

Reusa `WorkerExecutor`, `WorkerRegistry` e `WorkerHealthMonitor`.

### Queue Manager

O demo usa queue items simulados no formato operacional atual.

### State Machine

Cada execucao cria transitions locais:

- `pending -> queued`;
- `queued -> completed`;
- `queued -> failed`.

### Event Bus

Todos os eventos sao persistidos em:

- `runtime-data/events/`;
- `memory/events/`.

### Decision Engine

O orchestrator executa o `RuntimeDecisionEngine` para manter compatibilidade com a camada cognitiva existente.

### Database Layer

Espelha:

- `worker_leases`;
- `worker_executions`;
- `worker_rebalances`.

As chaves logicas sao `leaseId`, `executionId` e `rebalanceId`.

## Persistencia

Relatorios sao persistidos em:

- `runtime-data/orchestration/`;
- `memory/orchestration/`.

## Scripts

```bash
npm run orchestration:demo
npm run orchestration:rebalance-demo
```

`orchestration:demo` valida registro de workers, distribuicao, leases, expiring lease, orphan detection, eventos, execucao simulada e fallback.

`orchestration:rebalance-demo` foca em saturacao, reroute seguro e protected queue awareness.

## Fallback Seguro

Garantias:

- execucao simulada;
- sem efeitos destrutivos;
- sem chamadas externas;
- workers unhealthy sao evitados;
- protected queue nao e movida;
- orphan execution e apenas detectado e reportado;
- reports sao append-only.

## Riscos

- leases ainda sao locais ao processo.
- nao ha lock distribuido real.
- rebalance usa heuristica simples de capacidade.
- database ainda e filesystem-db.
- health historico ainda nao e agregado em janela persistente.

## Readiness

Readiness: `multi-worker-orchestration-v1-ready`.

A plataforma agora possui orquestracao multi-worker simulada, com leases, load balancing, rebalance, eventos e persistencia auditavel.
