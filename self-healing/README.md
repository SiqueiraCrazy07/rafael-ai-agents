# Self-Healing

## Objetivo

Definir a camada de auto-recuperacao operacional da plataforma.

Self-healing cobre retries, recovery por checkpoints, fallbacks, isolamento de falhas e recuperacao segura.

## Estrutura

```text
self-healing/
  retries/
  recovery/
  checkpoints/
  fallbacks/
```

## Principios

- Nenhum self-healing deve ampliar permissao.
- Nenhum self-healing deve ignorar QA.
- Recovery deve ser idempotente quando possivel.
- Critical exige validacao humana.
