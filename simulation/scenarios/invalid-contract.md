# Scenario: Invalid Contract

## Objetivo

Simular resposta de agente fora do contrato esperado.

## Falha simulada

Output sem `status`, `summary`, `validation` ou `risks`.

## Resultado esperado

- validation_failed;
- handoff bloqueado;
- status `blocked`;
- erro documentado.
