# Multi-Process Worker Runtime V1

## Objetivo

Multi-Process Worker Runtime V1 cria uma camada local readonly-safe para executar workers isolados em subprocessos Node.js, com supervisor, heartbeat, lifecycle management e recovery-aware execution.

A V1 nao usa containers reais, nao executa acoes destrutivas e nao cria execucao distribuida multi-host.

## Arquivos

- `workers/multiprocess/multiprocess-worker-runtime.js`
- `workers/multiprocess/worker-process-supervisor.js`
- `workers/multiprocess/worker-process-launcher.js`
- `workers/multiprocess/worker-process-heartbeat.js`
- `workers/multiprocess/worker-process-registry.js`
- `workers/multiprocess/worker-process-isolation.js`
- `workers/multiprocess/worker-process-recovery.js`
- `workers/multiprocess/worker-process-audit.js`
- `workers/multiprocess/demo/multiprocess-worker-demo.js`

## Worker Process Runtime

O runtime registra workers locais com metadata de:

- `workerId`;
- `nodeId`;
- capabilities;
- readonly;
- process ownership;
- execution metadata.

Cada job recebe `executionId`, `correlationId`, `workflowId` e contexto isolado readonly-safe.

## Process Launcher

O launcher usa subprocessos Node.js locais com:

- environment readonly;
- safe mode;
- payload controlado;
- contexto de execucao isolado;
- timeout obrigatorio.

O subprocesso simula processamento de metadata e retorna resultado via IPC. Nenhum handler destrutivo e executado.

## Supervisor

O supervisor detecta:

- worker crash;
- worker freeze;
- stale heartbeat;
- process timeout;
- execution failure.

Cada deteccao gera evidencia e recomendacao de recovery.

## Heartbeat

O heartbeat registra:

- `processId`;
- `workerId`;
- timestamp;
- phase;
- stale detection;
- unhealthy worker metadata.

## Worker Registry

O registry mantem:

- workers ativos;
- workers unhealthy;
- process ownership;
- mapping worker/node/process.

## Isolation

O isolamento bloqueia:

- comandos destrutivos;
- escrita externa;
- network/external calls;
- payload acima do limite;
- jobs ou workers sem readonly.

Jobs bloqueados viram metadata de fallback e nao sao enviados ao subprocesso.

## Recovery

O recovery planner gera:

- restart recommendation;
- reroute recommendation;
- replay recommendation;
- quarantine metadata;
- `executeRecovery=false`.

Quarantine e declarativa nesta V1.

## Integracoes

- Distributed Runtime: le cluster state e node metadata.
- Distributed Queue: le pressure e retry/protected queue.
- Replay: gera recomendacao de replay antes de retry real.
- Self-Healing: consome recovery signals.
- Streaming: `memory/multiprocess-workers/` fica pronto para stream.
- Transport: process lifecycle pode ser envelopeado.
- Telemetry: relatorio e telemetry-readable.
- Dashboard: relatorio e dashboard-readable.
- Scheduler: execution plans podem consumir capabilities dos workers.

## Persistencia

Relatorios em:

- `runtime-data/multiprocess-workers/`;
- `memory/multiprocess-workers/`.

## Script

```bash
npm run multiprocess-workers:demo
```

## Fallback Seguro

- Sem worker capaz: job bloqueado.
- Job destrutivo: isolation bloqueia.
- Crash: recomendacao de restart supervisionado.
- Freeze/stale heartbeat: recomendacao de quarantine e reroute.
- Recovery real bloqueado.
- JSON fallback preservado.

## Riscos

- Subprocessos sao locais e nao representam isolamento de container.
- IPC e heartbeat sao do processo demo, sem daemon continuo.
- Restart e quarantine sao metadata-only.
- Execucao real de workflows ainda exige sandbox/human gate futuro.

## Readiness

Readiness: `multiprocess-worker-runtime-v1-ready`.

A plataforma passa a ter subprocess workers locais readonly-safe, lifecycle supervisionado, heartbeat, stale detection, recovery recommendations, isolation policy e quarantine metadata.
