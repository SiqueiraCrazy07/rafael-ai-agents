# API Environment Controls V1

## Objetivo

Adicionar controles por ambiente para habilitar ou desabilitar database read, fallback JSON e modos seguros da API.

## Arquivos

Arquivos criados:

- `api/config/api-environment-config.js`
- `api/config/api-runtime-flags.js`
- `api/config/api-environment-demo.js`

Arquivos integrados:

- `api/server/app.js`
- `api/server/index.js`
- `api/data/runtime-data-source.js`
- `api/auth/api-key-auth.js`
- `api/policies/api-governance-policies.js`
- `api/responses/safe-response.js`
- `api/controllers/runtime-controller.js`

## Flags

Flags suportadas:

- `API_USE_DATABASE_READ=true|false`
- `API_ALLOW_JSON_FALLBACK=true|false`
- `API_READONLY_MODE=true|false`
- `API_REQUIRE_AUTH=true|false`
- `API_SAFE_MODE=true|false`

## Defaults Seguros

Defaults:

- `API_USE_DATABASE_READ=true`
- `API_ALLOW_JSON_FALLBACK=true`
- `API_READONLY_MODE=true`
- `API_REQUIRE_AUTH=true`
- `API_SAFE_MODE=true`

Esses defaults preservam a API readonly, exigem autenticacao em `api:start`, mantem fallback JSON permitido e nao tornam database uma dependencia obrigatoria.

## Comportamento

Database read:

- quando ligado, a API consulta filesystem-db primeiro;
- quando desligado, a API usa JSON fallback se permitido.

JSON fallback:

- quando ligado, cobre database indisponivel ou database read desligado;
- quando desligado junto com database read desligado, a API retorna `source: unavailable` com fallback seguro.

Readonly e safe mode:

- readonly true por padrao;
- auth required true por padrao;
- safe mode bloqueia metodos nao-readonly, incluindo rotas futuras que tentem aceitar escrita sem governanca explicita.

## Campos de Resposta

Respostas passam a incluir:

- `runtimeFlags`;
- `databaseReadEnabled`;
- `jsonFallbackEnabled`;
- `safeModeEnabled`.

Esses campos tambem aparecem no envelope `api` quando o payload os disponibiliza.

## Persistencia

Relatorios do demo sao persistidos em:

- `runtime-data/api-environment/`;
- `memory/api-environment/`.

## Script

```bash
npm run api:env-demo
```

O demo valida:

- database read enabled;
- database read disabled;
- JSON fallback enabled;
- JSON fallback disabled;
- safe mode enabled;
- auth required mode.

## Fallback Seguro

Garantias:

- database nao e obrigatorio;
- JSON fallback pode ser desligado explicitamente;
- quando ambas as fontes estao desligadas/indisponiveis, a API retorna indisponibilidade segura;
- runtime e workflows nao sao alterados;
- nenhuma rota destrutiva e habilitada por esta V1.

## Riscos

- Flags ainda sao resolvidas em runtime local, sem perfis versionados por ambiente.
- `API_READONLY_MODE=false` nao cria rotas de escrita, apenas relaxa uma policy se safe mode tambem estiver desligado.
- Respostas indisponiveis preservam contrato basico, mas nao substituem observabilidade de incidentes.
- Configuracoes inconsistentes podem reduzir visibilidade se database e JSON fallback forem desligados juntos.

## Readiness

Readiness: `api-environment-controls-v1-ready`.

A API agora possui controles declarativos por ambiente para database read, fallback JSON, readonly, auth e safe mode.
