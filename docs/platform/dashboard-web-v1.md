# Dashboard Web V1

## Objetivo

Criar a primeira interface web operacional readonly do Rafael AI Agents consumindo a Dashboard Runtime API V1.

## Arquitetura

O dashboard vive isolado em `dashboard/web/` e nao altera runtime, workflows, filas ou automacoes. A interface e estatica, sem build step e sem dependencias externas.

Camadas:

- `index.html`: estrutura da interface.
- `app.js`: inicializacao, refresh e integracao dos renderizadores.
- `styles.css`: layout operacional responsivo.
- `services/api-client.js`: cliente readonly da Dashboard Runtime API V1.
- `state/store.js`: estado local simples da UI.
- `components/`: renderizadores de summary, workers, timelines, traces e metrics.
- `dashboard-web-demo.js`: demo local que sobe API autenticada e servidor estatico.

## Telas

### Dashboard Summary

Mostra:

- runtime health;
- worker count;
- unhealthy workers;
- queue depth;
- rebalance count;
- throughput;
- workflows problematicos;
- runtime flags.

### Workers View

Mostra:

- worker registry observado por telemetry;
- health;
- utilization;
- unhealthy state;
- throttling como sinal de metricas;
- leases via traces/orchestration.

### Workflow Timelines

Mostra:

- timeline visual por workflow;
- `correlationId`;
- stages;
- transitions, decisions e events quando presentes no relatorio de telemetry.

### Traces View

Mostra:

- execution traces;
- worker assignment;
- reroutes;
- retries;
- throttling;
- counts de decisions, events, leases e rebalances.

### Metrics View

Mostra:

- throughput;
- retry count;
- rebalance count;
- unhealthy workers;
- queue metrics;
- execution metrics.

## Integracao API

A UI consome:

- `GET /api/v1/dashboard/summary`;
- `GET /api/v1/dashboard/metrics`;
- `GET /api/v1/dashboard/timelines`;
- `GET /api/v1/dashboard/traces`;
- `GET /api/v1/dashboard/workflows/problematic`;
- `GET /api/v1/dashboard/workers/health`.

O API base e a chave readonly podem ser passados por query string:

```text
?apiBase=http://127.0.0.1:3077/api/v1&apiKey=...
```

Tambem podem ser configurados pelo formulario da UI. A chave e usada apenas em requests `GET` como header `x-api-key`.

## Fallback Visual

Fallbacks da UI:

- loading banner;
- error banner;
- empty states por view;
- mensagem quando a API retorna fallback;
- nenhum botao destrutivo;
- nenhum request diferente de `GET`;
- nenhum fluxo de execucao real.

## Persistencia

O demo persiste relatorio em:

- `runtime-data/dashboard-web/`;
- `memory/dashboard-web/`.

## Scripts

```bash
npm run dashboard:web-demo
```

O demo sobe API local com chave efemera, sobe o servidor estatico do dashboard, valida assets, consulta endpoints readonly, persiste relatorio e encerra.

Para uso manual do mesmo servidor:

```bash
node dashboard/web/dashboard-web-demo.js --serve
```

## Validacao

Sequencia validada:

```bash
npm run governance:validate
npm run dashboard:api-demo
npm run dashboard:web-demo
npm run api:openapi-demo
npm run validate
npm run normalize
```

## Riscos

- A UI depende da disponibilidade da Dashboard Runtime API V1.
- A qualidade das timelines e traces depende da consistencia de `correlationId` nos produtores.
- A chave readonly em query string e aceitavel para demo local, mas producao deve usar fluxo de configuracao seguro.
- Ainda nao ha streaming ou atualizacao em tempo real.

## Readiness

Readiness: `dashboard-web-v1-ready`.

A plataforma esta pronta para evoluir para Dashboard Web V2 com atualizacao periodica, filtros avancados, pagina dedicada por workflow e auth UI governada.
