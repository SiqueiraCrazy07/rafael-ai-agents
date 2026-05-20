# Scenario: Failed Publish

## Objetivo

Simular falha durante publicacao de cache ou payload.

## Setup

- Projeto: `promoclub007`
- Workflow: `offers-publish`
- Agentes: `site-backend-agent`, `site-qa-agent`
- Estado inicial: `running`

## Falha simulada

`site-publisher` nao consegue gerar ou validar `offers-cache.json`.

## Resultado esperado

- status `failed` ou `blocked`;
- checkpoint de falha;
- log `execution_failed`;
- nenhum deploy;
- recovery usando ultimo cache valido.
