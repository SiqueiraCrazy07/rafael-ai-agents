# Scenario: Rollback Required

## Objetivo

Simular falha que exige rollback.

## Falha simulada

Cache invalido publicado ou deploy com regressao critica.

## Resultado esperado

- evento `rollback_triggered`;
- checkpoint anterior usado;
- status `rolled_back`;
- incidente registrado se high/critical.
