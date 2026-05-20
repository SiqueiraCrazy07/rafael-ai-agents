# Scenario: Retry Exhaustion

## Objetivo

Simular esgotamento de retries.

## Falha simulada

Etapa transitoria falha mais vezes do que o limite permitido.

## Resultado esperado

- status `failed`;
- retries registrados;
- bloqueio de nova tentativa automatica;
- incidente se high/critical.
