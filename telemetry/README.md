# Telemetry

## Objetivo

Definir eventos operacionais gerados por agentes, workflows e automacoes.

Telemetry deve responder: o que aconteceu, quando, em qual projeto, por qual agente/workflow e com qual resultado.

## Eventos recomendados

- `workflow_started`
- `workflow_finished`
- `workflow_failed`
- `agent_invoked`
- `validation_failed`
- `deploy_blocked`
- `incident_opened`

## Boas praticas

- Usar JSON estruturado.
- Incluir `project`, `workflow`, `agent`, `timestamp` e `status`.
- Nao registrar segredos.
- Manter compatibilidade com `logs/` e `metrics/`.
