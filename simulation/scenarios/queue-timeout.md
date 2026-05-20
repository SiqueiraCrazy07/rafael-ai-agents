# Scenario: Queue Timeout

## Objetivo

Simular execucao presa na fila alem do limite.

## Falha simulada

Tarefa `p1` nao sai de `queued` dentro do SLA operacional.

## Resultado esperado

- evento `queue_timeout`;
- prioridade revisada;
- alerta operacional;
- possivel reroute.
