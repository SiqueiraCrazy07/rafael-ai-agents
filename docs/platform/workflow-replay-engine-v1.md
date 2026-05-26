# Workflow Replay Engine V1

## Objetivo

Workflow Replay Engine V1 cria uma camada segura de replay readonly-safe para reconstruir execucoes a partir do Execution Persistence Engine, Event Bus e checkpoints.

A V1 nao reexecuta workflows. Ela reconstrói timeline e evidencia operacional a partir de artefatos persistidos.

## Arquivos

- `runtime/replay/workflow-replay-engine.js`
- `runtime/replay/replay-plan-builder.js`
- `runtime/replay/replay-event-loader.js`
- `runtime/replay/replay-checkpoint-loader.js`
- `runtime/replay/replay-validator.js`
- `runtime/replay/replay-audit.js`
- `runtime/replay/demo/workflow-replay-demo.js`

## Plano de Replay

O `ReplayPlanBuilder` cria planos com:

- `workflowId`;
- `executionId`;
- `correlationId`;
- `readonly=true`;
- `destructiveActions=false`;
- `reexecuteWorkflow=false`;
- etapas de leitura e validacao.

Quando nenhum filtro e informado, o engine usa a ultima execucao disponivel no journal.

## Timeline Reconstruida

A timeline combina:

- entradas do execution journal;
- checkpoints;
- eventos persistidos do Event Bus.

Os itens sao ordenados por timestamp e carregam `kind`, `label`, `evidenceId`, `workflowId`, `executionId` e `correlationId`.

## Eventos

O `ReplayEventLoader` le:

- `memory/event-bus/events/`;
- `runtime-data/event-bus/events/`.

Eventos sao filtrados por workflow, execution ou correlation e mantem ordering metadata quando disponivel.

## Checkpoints

O `ReplayCheckpointLoader` le:

- `memory/execution-persistence/checkpoints/`;
- `runtime-data/execution-persistence/checkpoints/`.

O replay reporta todos os checkpoints carregados e o ultimo checkpoint aplicavel.

## Validacao Readonly-Safe

O `ReplayValidator` bloqueia:

- qualquer plano sem `readonly`;
- qualquer tentativa de `reexecuteWorkflow`;
- qualquer `destructiveActions=true`.

Warnings sao gerados para replay sem journal, sem checkpoints ou sem eventos.

## Audit Trail

Cada replay grava auditoria em:

- `runtime-data/replay/`;
- `memory/replay/`.

A auditoria inclui plano, validacao, timeline reconstruida, eventos carregados, checkpoints e fallback.

## Integracoes

- Execution Persistence: journal e checkpoints.
- Event Bus: eventos persistidos.
- Telemetry: auditorias em `memory/replay/`.
- Dashboard: timeline readonly pronta para exposicao futura.
- Autonomous Orchestrator: evidencia para human gate sem reexecucao.
- Database Layer: permanece additive; JSON fallback e obrigatorio.

## Script

```bash
npm run replay:demo
```

## Fallback Seguro

- Diretorios ausentes retornam lista vazia com fallback.
- JSON invalido e registrado em `readErrors`.
- Database nao e obrigatorio para replay.
- Replay nunca executa handler de workflow.

## Riscos

- Replay real de side effects nao existe nesta V1.
- Qualidade da timeline depende de timestamps e correlation ids persistidos.
- Ordering distribuido entre processos ainda depende do Event Bus futuro.
- API/Dashboard ainda nao possuem endpoint dedicado para replay.

## Readiness

Readiness: `workflow-replay-engine-v1-ready`.

A plataforma agora consegue reconstruir execucoes de forma readonly-safe usando journal, checkpoints e eventos persistidos, com auditoria e fallback JSON obrigatorio.
