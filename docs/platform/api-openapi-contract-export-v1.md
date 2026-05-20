# API OpenAPI Contract Export V1

## Objetivo

Exportar os contratos readonly da API V1 em especificacao OpenAPI 3.1 para documentacao, SDKs futuros e integracoes enterprise.

## Arquivos

Arquivos criados:

- `api/openapi/openapi-spec-builder.js`
- `api/openapi/openapi-generator.js`

Artefatos gerados:

- `runtime-data/openapi/openapi-v1.json`
- `runtime-data/openapi/openapi-v1.yaml`

Metadata persistida em:

- `memory/openapi/`

## Endpoints Exportados

Endpoints versionados exportados:

- `GET /api/v1/health`
- `GET /api/v1/runtime/status`
- `GET /api/v1/runtime/queue`
- `GET /api/v1/runtime/events`
- `GET /api/v1/runtime/decisions`
- `GET /api/v1/runtime/validation`

Aliases sem prefixo nao sao exportados nesta V1 para manter SDKs futuros focados no contrato versionado.

## Schemas Exportados

Schemas principais:

- `ResponseEnvelope`
- `ErrorEnvelope`
- `RuntimeFlags`
- `ApiMetadata`
- `Fallback`
- `HealthData`
- `RuntimeStatusData`
- `QueueStatusData`
- `EventsData`
- `DecisionsData`
- `ValidationData`
- `EventType`

Os payloads historicos permanecem flexiveis onde necessario, mas o envelope seguro, runtime flags, auth e fallback ficam documentados de forma explicita.

## Autenticacao

Security scheme:

- `ApiKeyAuth`
- header: `x-api-key`
- tipo: `apiKey`

A especificacao documenta que auth e exigida por padrao via `API_REQUIRE_AUTH=true`.

## Readonly

Todas as operacoes exportadas sao `GET`.

Cada operacao inclui extensao:

- `x-runtime-contract.readonly: true`
- `x-runtime-contract.destructiveActions: false`

Nenhuma rota destrutiva e criada ou exportada nesta V1.

## Runtime Flags

O schema `RuntimeFlags` documenta:

- `API_USE_DATABASE_READ`
- `API_ALLOW_JSON_FALLBACK`
- `API_READONLY_MODE`
- `API_REQUIRE_AUTH`
- `API_SAFE_MODE`

As respostas tambem documentam:

- `databaseReadEnabled`
- `jsonFallbackEnabled`
- `safeModeEnabled`

## Fallback

O schema `Fallback` documenta:

- `safeMode`
- `reason`
- `readonlyDeny`
- `runtimeInternalUnaffected`
- `databaseFallback`
- `jsonFallback`

Erros `400`, `401`, `403`, `429` e `500` usam `ErrorEnvelope`.

## Demo

```bash
npm run api:openapi-demo
```

O demo:

1. gera OpenAPI JSON;
2. gera OpenAPI YAML;
3. valida estrutura minima OpenAPI 3.1;
4. valida endpoints obrigatorios;
5. valida security scheme `ApiKeyAuth`;
6. lista endpoints e schemas exportados;
7. persiste metadata em `memory/openapi/`.

## Fallback Seguro

Garantias:

- export e estatico;
- nao sobe servidor;
- nao altera runtime;
- nao altera workflows;
- nao cria rotas;
- nao habilita escrita;
- metadata e append-only.

## Riscos

- A V1 usa builder local e YAML simples sem dependencia externa.
- Schemas de payload profundo ainda sao permissivos para preservar compatibilidade com historicos variaveis.
- Ainda nao ha publicacao automatica em portal de documentacao.
- SDKs futuros ainda precisam de geracao e testes especificos.

## Readiness

Readiness: `api-openapi-contract-export-v1-ready`.

A API V1 agora possui export OpenAPI 3.1 versionado, com auth, envelopes, runtime flags e fallback documentados.
