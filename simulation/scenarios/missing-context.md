# Scenario: Missing Context

## Objetivo

Simular execucao sem contexto minimo.

## Falha simulada

Execucao sem projeto, objetivo, workflow ou arquivos relevantes.

## Resultado esperado

- status `waiting_input` ou `blocked`;
- solicitacao de contexto;
- nenhuma alteracao em arquivos.
