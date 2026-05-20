# Runtime

## Objetivo

Definir o runtime operacional do rafael-ai-agents: a camada responsavel por estado vivo, fila, contexto de execucao, checkpoints, historico, snapshots e rastreamento ponta a ponta.

O runtime complementa o `orchestrator/`: o orchestrator decide e coordena; o runtime registra, acompanha e permite recuperar execucoes.

## Estrutura

```text
runtime/
  executions/
  queue/
  state/
  context/
  history/
  checkpoints/
  snapshots/
```

## Principios

- Toda execucao deve ter ID.
- Todo estado deve ser rastreavel.
- Checkpoints devem existir antes de etapas criticas.
- Recovery e rollback devem ser previstos.
- Contexto deve ser isolado por projeto.
