# Workflow Simulation Engine

## Objetivo

Definir o motor conceitual de simulacao de workflows.

## Workflow replay

Replay simula uma execucao passada ou planejada com os mesmos inputs, contexto e agentes.

Requisitos:

- execution object;
- workflow;
- versao dos agentes;
- contexto;
- checkpoints;
- logs.

## Workflow tracing

Tracing deve ligar:

```text
workflow -> agentes -> estados -> checkpoints -> outputs -> riscos
```

## State transitions

Cada workflow deve declarar transicoes esperadas.

Exemplo:

```text
queued -> routed -> running -> validated -> completed
```

Falhas devem declarar caminhos alternativos:

```text
running -> failed -> retrying -> running
running -> failed -> rolled_back
```

## Checkpoint simulation

Simular checkpoints antes de:

- publish;
- deploy;
- retry;
- rollback;
- handoff high/critical.

## Multi-agent simulation

Cadeias simulaveis:

- PM -> UX -> Frontend -> QA;
- Backend -> QA -> Deploy;
- Ofertas -> Curadoria -> Publish;
- Discovery -> PRD -> Execucao.

Cada agente deve receber input e devolver output compativel com `orchestrator/contracts/agent-contracts.md`.
