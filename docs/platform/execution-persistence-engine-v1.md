# Execution Persistence Engine V1

## Objetivo

Execution Persistence Engine V1 cria uma camada persistente, auditavel e readonly-safe para registrar execucoes de workflows, workers, retries, failures, checkpoints e replay metadata.

A camada e additive, nao remove o `filesystem-db`, nao substitui JSON fallback e nao altera APIs existentes.

## Arquivos

- `runtime/execution-persistence/execution-persistence-engine.js`
- `runtime/execution-persistence/execution-journal.js`
- `runtime/execution-persistence/execution-checkpoint-store.js`
- `runtime/execution-persistence/execution-replay-metadata.js`
- `runtime/execution-persistence/execution-failure-store.js`
- `runtime/execution-persistence/execution-state-reader.js`
- `runtime/execution-persistence/demo/execution-persistence-demo.js`

## Execution Journal

O journal registra:

- execucao iniciada;
- execucao concluida;
- execucao com falha;
- retry agendado;
- `workerId`;
- `workflowId`;
- `executionId`;
- `correlationId`;
- timestamps;
- transicoes de status.

Cada entrada e persistida em JSON e, quando disponivel, em database.

## Checkpoint Store

Checkpoints sao readonly-safe e contem:

- estado parcial;
- consistency marker;
- workflow/execution/correlation;
- motivo;
- safety mode.

O store recupera o ultimo checkpoint por `workflowId`, `executionId` ou `correlationId`.

## Failure Store

Failures registram:

- mensagem de erro;
- tipo classificado;
- elegibilidade de retry;
- recomendacao de recovery;
- worker e workflow envolvidos.

Tipos iniciais incluem `timeout`, `worker-failure`, `event-subscriber-failure`, `validation-failure` e `runtime-failure`.

## Replay Metadata

Replay metadata prepara replay readonly por:

- `workflowId`;
- `executionId`;
- `correlationId`.

O replay nesta V1 e metadata-only: ele monta filtros e passos de leitura sem reexecutar workflow.

## State Reader

O reader consolida:

- estado atual;
- historico de journal;
- falhas;
- checkpoints;
- replay metadata;
- fallback seguro.

Diretorios ausentes ou JSON invalido nao quebram a leitura; o retorno inclui `readErrors`, `missingSources` e `fallback`.

## Integracoes

- Event Bus: o demo publica eventos `worker.execution.started` e `worker.execution.completed`.
- Worker Runtime: campos do journal alinham com `workerId`, `workflowId`, `executionId` e `correlationId`.
- Scheduler: failures trazem retry eligibility e recovery recommendation.
- Autonomous Orchestrator: state reader expõe estado atual e historico seguro.
- Telemetry: relatorios ficam em `memory/execution-persistence/`.
- Dashboard: estado, falhas e checkpoints ficam prontos para leitura readonly.
- Database Layer: usa SQLite quando disponivel, `filesystem-db` como fallback e JSON sempre.

## Persistencia

Diretorios:

- `runtime-data/execution-persistence/`
- `runtime-data/execution-persistence/journal/`
- `runtime-data/execution-persistence/checkpoints/`
- `runtime-data/execution-persistence/failures/`
- `runtime-data/execution-persistence/replay-metadata/`
- `memory/execution-persistence/`
- `memory/execution-persistence/journal/`
- `memory/execution-persistence/checkpoints/`
- `memory/execution-persistence/failures/`
- `memory/execution-persistence/replay-metadata/`

Collections de database:

- `execution_journal`
- `execution_checkpoints`
- `execution_failures`
- `execution_replay_metadata`

## Script

```bash
npm run execution:persistence-demo
```

## Fallback Seguro

- SQLite indisponivel: tenta `filesystem-db`.
- Database indisponivel: JSON fallback.
- Diretorios ausentes: retorno seguro com lista vazia.
- JSON invalido: erro registrado em `readErrors`.
- Replay: metadata readonly, sem reexecutar workflow.

## Riscos

- Replay real ainda nao reexecuta workflows.
- Ordering entre processos externos ainda depende do Event Bus distribuido futuro.
- Database transacional ainda e local.
- Dashboard/API ainda precisam endpoint dedicado para expor esta camada.

## Readiness

Readiness: `execution-persistence-engine-v1-ready`.

A plataforma passa a ter persistencia auditavel de execucao, checkpoints, failures, retry metadata, state reader e replay metadata, preservando fallback JSON e compatibilidade retroativa.
