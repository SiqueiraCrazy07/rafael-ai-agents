# API Contracts + Schema Validation V1

## Objetivo

Formalizar contratos e validacoes da API Foundation V1 com governanca enterprise.

A V1 mantem a API readonly, adiciona contratos versionados, valida query params antes dos controllers e valida o envelope de resposta antes de enviar a resposta.

## Estrutura

Diretorios criados:

- `api/schemas/`
- `api/validators/`

Arquivos principais:

- `api/contracts/runtime-api-contracts.js`
- `api/schemas/runtime-query-schemas.js`
- `api/schemas/runtime-response-schemas.js`
- `api/validators/request-validator.js`
- `api/validators/response-validator.js`
- `api/middleware/schema-validation.js`
- `api/server/api-validation-demo.js`

## Contratos

Contratos versionados em `api/contracts/runtime-api-contracts.js`:

- `health`
- `runtimeStatus`
- `queueStatus`
- `events`
- `decisions`
- `validation`

Cada contrato declara:

- metodo HTTP;
- paths versionados e aliases;
- schema de query;
- schema de resposta;
- filtros permitidos quando aplicavel.

## Schemas de Resposta

Schemas criados para:

- health response;
- runtime status;
- queue status;
- events response;
- decisions response;
- validation response.

Todos validam o envelope seguro:

- `ok`;
- `status`;
- `requestId`;
- `timestamp`;
- `api`;
- `data`;
- `meta`;
- `fallback`.

Tambem validam campos obrigatorios dentro de `data` por endpoint.

## Validacao de Query Params

Validacoes implementadas:

- `limit`: inteiro entre `1` e `100`;
- `offset`: inteiro entre `0` e `10000`;
- `eventType`: deve pertencer aos eventos suportados;
- `workflowId`: string segura com caracteres permitidos;
- `correlationId`: string segura com caracteres permitidos;
- query params desconhecidos sao recusados.

Endpoints sem query usam schema `empty` e rejeitam parametros inesperados.

## Middlewares

### Safe Query Parser

Inicializa query e objeto `validatedQuery` para todos os requests.

### Schema Validation Middleware

Aplica:

- request validation antes do controller;
- response schema esperado em `res.locals.responseSchema`.

### Invalid Payload Fallback

Queries invalidas retornam `400` com envelope seguro:

- `ok: false`;
- `status: error`;
- `fallback.reason: invalid-query-params`;
- sem efeito runtime.

### Response Validation

`res.safe` valida o envelope final antes de enviar.

Se o response contract falhar, a API retorna fallback seguro com `invalid-response-contract`.

## Persistencia

O demo de validacao grava relatorios append-only em:

- `runtime-data/api-validation/`
- `memory/api-validation/`

## Script

```bash
npm run api:validate-demo
```

O demo:

- sobe a API em porta efemera;
- chama endpoints validos;
- valida response schemas;
- chama queries invalidas;
- confirma fallback `400`;
- persiste relatorio em `api-validation`.

## Fallback Seguro

Garantias:

- API permanece readonly;
- somente `GET` e usado nesta V1;
- nenhum workflow e executado ou alterado;
- nenhum runtime funcional e alterado;
- query invalida e bloqueada antes do controller;
- resposta invalida e bloqueada antes do envio normal;
- contratos sao versionados em `v1`;
- falhas sao reportadas sem acao destrutiva.

## Governanca

A implementacao segue os gates enterprise:

- modulo isolado em `api/`;
- contratos explicitos;
- validacao verificavel por script;
- persistencia em `memory/` e `runtime-data/`;
- fallback documentado;
- compatibilidade retroativa com API Foundation V1;
- sem alteracao em PromoClub007;
- sem alteracao nas automacoes atuais.

## Riscos

- Schemas V1 sao validadores estruturais simples, nao JSON Schema completo.
- Nao ha autenticacao/autorizacao.
- Nao ha rate limiting.
- Filtros sobre decisions ainda usam busca textual no report serializado.
- Persistencia ainda depende de arquivos JSON locais.
- Response schemas validam campos obrigatorios, mas ainda nao validam profundamente cada payload historico.

## Readiness

Readiness da API V1: `api-v1-contracts-schema-validation-ready`.

A API V1 esta pronta para evoluir para schema validators mais profundos, OpenAPI/JSON Schema formal e Persistent Database Layer.
