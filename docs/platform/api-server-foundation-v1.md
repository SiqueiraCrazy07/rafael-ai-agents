# API Server Foundation V1

## Objetivo

Iniciar oficialmente a FASE 2 criando a fundacao readonly do API Server do Rafael AI Agents.

A V1 expoe consultas declarativas sobre artefatos existentes em `memory/` e `runtime-data/`, sem alterar runtime, workflows, projetos ou automacoes atuais.

## Estrutura

Diretorios criados:

- `api/server/`
- `api/routes/`
- `api/controllers/`
- `api/middleware/`
- `api/contracts/`
- `api/responses/`

Arquivos principais:

- `api/server/index.js`
- `api/server/app.js`
- `api/server/api-demo.js`
- `api/server/file-store.js`
- `api/server/express-compat.js`
- `api/routes/runtime-routes.js`
- `api/controllers/runtime-controller.js`
- `api/middleware/request-id.js`
- `api/middleware/safe-response.js`
- `api/middleware/error-handler.js`
- `api/contracts/runtime-contracts.js`
- `api/responses/safe-response.js`

## Scripts

```bash
npm run api:start
npm run api:demo
```

## Endpoints

Endpoints minimos:

- `GET /health`
- `GET /api/v1/health`
- `GET /api/v1/runtime/status`
- `GET /api/v1/runtime/queue`
- `GET /api/v1/runtime/events`
- `GET /api/v1/runtime/decisions`
- `GET /api/v1/runtime/validation`

`/health` existe como alias operacional simples. Os contratos versionados vivem em `/api/v1`.

## Arquitetura

O server e modular:

- `server/` cria e inicia a aplicacao;
- `routes/` declara os endpoints;
- `controllers/` leem memoria e montam respostas;
- `middleware/` aplica requestId, envelope seguro e tratamento de erro;
- `contracts/` documenta o contrato inicial;
- `responses/` padroniza o envelope de resposta.

A V1 tenta carregar `express`. Se o pacote nao estiver instalado no workspace, usa `api/server/express-compat.js`, uma compatibilidade local minima baseada em Node HTTP para manter os demos executaveis sem dependencia de rede.

## Middlewares

### RequestId

Gera ou preserva `x-request-id` e expoe o valor em `req.requestId` e `res.locals.requestId`.

### Safe Response

Padroniza respostas com:

- `ok`;
- `status`;
- `requestId`;
- `timestamp`;
- `api.version`;
- `api.readonly`;
- `api.destructiveActions`;
- `data`;
- `meta`;
- `fallback`.

### Error Handling

Erros retornam envelope seguro e fallback conservador. Rotas inexistentes retornam `404` sem executar qualquer efeito runtime.

## Persistencia

O API Server Foundation V1 cria artefatos append-only em:

- `runtime-data/api/`
- `memory/api/`

O `api:demo` persiste um relatorio com endpoints testados, status, modo do server e fallback.

## Fontes Consultadas

- `memory/queue/`
- `memory/enforcement-integration/`
- `memory/events/`
- `memory/decisions/`
- `memory/runtime-validation/`
- `memory/state-transitions/`

Fontes ausentes ou ilegíveis sao reportadas em `fallback` ou `readErrors`.

## Fallback Seguro

Fallbacks da V1:

- API e readonly;
- apenas metodo `GET` e exposto;
- nenhuma execucao destrutiva;
- nenhum workflow e alterado;
- nenhum runtime funcional e alterado;
- diretorio ausente retorna resposta segura;
- JSON invalido e registrado como erro de leitura;
- ausencia de `express` usa compatibilidade local;
- rotas inexistentes retornam envelope seguro.

## Governanca

A fundacao segue a governanca enterprise:

- modulo isolado em `api/`;
- contratos versionados em `/api/v1`;
- persistencia append-only;
- fallback documentado;
- sem alteracao em PromoClub007;
- sem alteracao nas automacoes atuais;
- sem efeitos externos.

## Riscos

- `express` ainda nao esta instalado como dependencia do workspace.
- A compatibilidade local cobre apenas o necessario para a V1.
- A API ainda le arquivos JSON locais diretamente.
- Nao ha autenticacao ou autorizacao.
- Nao ha paginacao completa, filtros avancados ou schema validation por endpoint.
- Nao ha rate limiting.

## Readiness da FASE 2

Readiness: `phase-2-api-foundation-ready`.

A FASE 2 esta oficialmente iniciada com uma API readonly, governada e validavel. O proximo passo e evoluir para API Server com dependencia formal, contratos de schema e Persistent Database Layer.
