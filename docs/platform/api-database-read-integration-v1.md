# API Database Read Integration V1

## Objetivo

Fazer a API Server V1 consumir a Persistent Database Layer V1 em modo leitura, sem substituir os arquivos JSON como fallback.

A integracao e readonly: nao altera runtime, workflows, automacoes ou os arquivos JSON existentes.

## Estrutura

Arquivos criados:

- `api/data/runtime-data-source.js`
- `api/data/database-runtime-reader.js`
- `api/data/json-runtime-reader.js`
- `api/data/api-database-read-demo.js`

## Endpoints Integrados

Endpoints impactados:

- `GET /api/v1/runtime/status`
- `GET /api/v1/runtime/queue`
- `GET /api/v1/runtime/events`
- `GET /api/v1/runtime/decisions`
- `GET /api/v1/runtime/validation`

Aliases sem prefixo continuam funcionando porque compartilham os mesmos controllers.

## Fonte de Dados

A API consulta:

1. database layer via filesystem-db;
2. JSON atual em `memory/` como fallback.

Cada resposta passa a expor:

- `source`: `database` ou `json-fallback`;
- `fallbackUsed`: `true` ou `false`;
- `readErrors`: lista de erros de leitura quando houver.

## Database Reader

`database-runtime-reader.js` usa:

- `database/seed/seed-filesystem-db.js`;
- `database/repositories/query-layer.js`;
- repositories de events, decisions, runtime validation, transitions e queue.

Para Queue, o reader consulta `database/repositories/queue-repository.js` primeiro. Se o repository estiver vazio ou indisponivel, o data source usa JSON fallback obrigatorio.

## JSON Reader

`json-runtime-reader.js` preserva a leitura anterior da API:

- `memory/events/`;
- `memory/decisions/`;
- `memory/runtime-validation/`;
- `memory/queue/`;
- `memory/enforcement-integration/`;
- `memory/state-transitions/`.

## Runtime Data Source

`runtime-data-source.js` combina os readers.

Regras:

- se database retorna dados disponiveis, a resposta usa `source: database`;
- se database nao tem colecao, registro ou adapter disponivel, usa JSON;
- se `API_USE_DATABASE_READ=false`, a API usa JSON fallback quando permitido;
- se `API_ALLOW_JSON_FALLBACK=false`, a API retorna indisponibilidade segura quando database tambem estiver desligado ou indisponivel;
- fallback sempre preserva `readErrors`;
- JSON continua como fonte primaria historica e fallback operacional.

## Persistencia

O demo persiste relatorio em:

- `runtime-data/api-database-integration/`;
- `memory/api-database-integration/`.

## Script

```bash
npm run api:db-read-demo
```

O demo valida:

- status via database;
- events via database;
- decisions via database;
- validation via database;
- queue via database quando espelhada;
- queue via JSON fallback quando o repository estiver vazio/indisponivel;
- API readonly;
- JSONs preservados.

## Fallback Seguro

Garantias:

- API continua readonly;
- runtime nao e alterado;
- workflows nao sao alterados;
- JSONs nao sao apagados;
- database nao vira fonte primaria unica;
- Queue usa database primeiro e JSON fallback obrigatorio;
- erro ou ausencia de database nao quebra a API.

## Compatibilidade

A integracao preserva:

- contratos `/api/v1`;
- schema validation;
- API key governance;
- rate limiting;
- audit trail;
- scripts existentes.

## Riscos

- filesystem-db ainda nao e transacional.
- Mirror mode pode duplicar registros.
- Runtime status pode misturar fontes quando Queue cai para JSON.
- API possui flags de ambiente para database read e fallback JSON, mas ainda nao possui perfis formais por deploy.
- Response schemas ainda validam estrutura basica, nao payload profundo.

## Readiness

Readiness: `api-v1-database-read-ready`.

A API agora consegue ler da database layer em modo opcional, preservando JSON fallback obrigatorio e sem substituir as fontes existentes.
