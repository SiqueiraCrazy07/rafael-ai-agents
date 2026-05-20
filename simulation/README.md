# Simulation

## Objetivo

Definir a camada de simulacao operacional do rafael-ai-agents.

Simulation permite testar workflows, estados de runtime, handoffs, retries, rollback, contratos e falhas antes de executar em ambiente real.

## Estrutura

```text
simulation/
  workflows/
  runtime/
  replay/
  contracts/
  scenarios/
  results/
```

## Principios

- Simular antes de automatizar.
- Validar estados antes de executar.
- Injetar falhas de forma controlada.
- Preservar compatibilidade com registry, runtime e orchestrator.
- Nao alterar workflows reais durante simulacao.
