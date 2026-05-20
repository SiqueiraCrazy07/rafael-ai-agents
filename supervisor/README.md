# Supervisor

## Objetivo

Definir a camada de AI Supervisor do rafael-ai-agents.

O supervisor observa runtime, workflows, agentes, filas, incidentes e sinais de falha para recomendar ou acionar respostas operacionais seguras.

## Estrutura

```text
supervisor/
  runtime/
  recovery/
  rollback/
  incidents/
  health/
  policies/
  analysis/
  decisions/
```

## Principios

- Supervisionar antes de automatizar.
- Bloquear antes de causar dano.
- Recuperar apenas quando o risco for controlado.
- Exigir humano para high/critical.
- Registrar decisoes, incidentes e recovery.
