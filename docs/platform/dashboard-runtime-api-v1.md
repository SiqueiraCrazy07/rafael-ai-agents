# Dashboard Runtime API V1

## Objetivo

Expor métricas, telemetria, timelines, traces, workflows problemáticos e saúde de workers pela API V1 readonly do Rafael AI Agents.

## Endpoints

- `GET /api/v1/dashboard/summary`
- `GET /api/v1/dashboard/metrics`
- `GET /api/v1/dashboard/timelines`
- `GET /api/v1/dashboard/traces`
- `GET /api/v1/dashboard/workflows/problematic`
- `GET /api/v1/dashboard/workers/health`

## Contratos

Arquivos criados:

- `api/controllers/dashboard-controller.js`
- `api/routes/dashboard-routes.js`
- `api/schemas/dashboard-response-schemas.js`
- `api/contracts/dashboard-api-contracts.js`
- `api/data/dashboard-data-source.js`

Cada resposta inclui:

- `source`;
- `fallbackUsed`;
- `readErrors`;
- `runtimeFlags`;
- `generatedAt`;
- `correlationId` quando há filtro por correlação.

## Fontes

O Dashboard Data Source consulta:

- `memory/telemetry/`;
- `runtime-data/telemetry/`;
- `memory/events/` via relatórios correlacionados de telemetry;
- `memory/state-transitions/` via traces;
- `memory/workers/` via métricas de worker;
- `memory/orchestration/` via métricas, leases e rebalances;
- filesystem-db quando a coleção `runtime_telemetry` está disponível.

## Fallback Seguro

A API continua readonly. Se a database não estiver disponível, a resposta usa o relatório JSON mais recente de telemetry. Se `memory/telemetry/` estiver vazio, tenta `runtime-data/telemetry/`. Se ambas as fontes falharem, retorna envelope seguro com `source=unavailable`, `fallbackUsed=true` e `readErrors`.

Nenhum endpoint executa workflow, altera runtime, modifica filas ou dispara automações.

## OpenAPI

O export OpenAPI V1 agora inclui os endpoints dashboard, schemas `Dashboard*Data`, auth `x-api-key`, flags runtime e campos de fallback.

## Persistência

O demo persiste relatório em:

- `runtime-data/dashboard-api/`;
- `memory/dashboard-api/`.

## Validação

Comando principal:

```bash
npm run dashboard:api-demo
```

Validação completa:

```bash
npm run governance:validate
npm run telemetry:demo
npm run telemetry:timeline-demo
npm run api:demo
npm run api:validate-demo
npm run api:openapi-demo
npm run dashboard:api-demo
npm run validate
npm run normalize
```

## Riscos

- A API depende da qualidade dos relatórios de telemetry para timelines e traces ricos.
- Correlation IDs ausentes reduzem filtros por correlação.
- Ainda não há UI; esta V1 entrega apenas a camada API para o futuro Dashboard Web.

## Readiness

Readiness: `dashboard-runtime-api-v1-ready`.

A plataforma está pronta para iniciar Dashboard Web V1 usando endpoints readonly, autenticados, governados e documentados em OpenAPI.
