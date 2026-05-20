# Orchestrator

## Objetivo

Definir a camada de orquestracao operacional do Agent Operating System.

O orchestrator descreve como agentes sao selecionados, encadeados, recebem contexto, fazem handoff, registram status e respeitam regras de governanca.

## Estrutura

```text
orchestrator/
  routing/
  workflows/
  context/
  executions/
  contracts/
```

## Principios

- Um agente deve atuar dentro do escopo do registry.
- Workflows multi-agent devem ter gates claros.
- Handoff deve preservar contexto minimo.
- Mudancas criticas exigem validacao humana.
- Execucoes devem ser rastreaveis.
