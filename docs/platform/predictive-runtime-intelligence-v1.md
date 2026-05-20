# Predictive Runtime Intelligence V1

## Objetivo

O Predictive Runtime Intelligence V1 permite antecipar degradacoes e riscos operacionais antes que falhas acontecam.

Ele analisa a memoria operacional em `memory/` e gera forecasts em:

- `runtime-data/predictive/`;
- `memory/predictive/`.

## Componentes

Arquivos principais:

- `predictive/workflows/workflow-failure-predictor.js`
- `predictive/workers/worker-saturation-predictor.js`
- `predictive/incidents/incident-forecast-engine.js`
- `predictive/risk/runtime-risk-predictor.js`
- `predictive/scoring/predictive-health-analyzer.js`
- `predictive/risk/predictive-routing-advisor.js`
- `predictive/risk/predictive-throttling-engine.js`
- `predictive/risk/runtime-forecast-engine.js`
- `predictive/predictive-runtime-demo.js`

Comando:

```bash
npm run predictive:demo
```

## Fluxo

1. Carrega memoria operacional.
2. Analisa incidentes, health reports, queue reports, policies, routing decisions e recoveries.
3. Calcula probabilidade de falha por workflow.
4. Calcula saturacao prevista por worker.
5. Projeta incidentes na proxima janela operacional.
6. Calcula risco operacional agregado.
7. Calcula health preditivo.
8. Recomenda rerouting preventivo.
9. Recomenda throttling preventivo.
10. Gera forecast consolidado.

## Preditores

### Workflow Failure Predictor

Identifica workflows com maior probabilidade de falha usando:

- incidentes por workflow;
- severidade;
- sinais de rollback;
- retries;
- estabilidade historica.

### Worker Saturation Predictor

Identifica workers com risco de saturacao usando:

- execucoes atribuidas;
- capacidade;
- falhas;
- sinais de stale worker vindos de recovery.

### Incident Forecast Engine

Projeta volume de incidentes na proxima janela operacional a partir dos incidentes recentes e dos recoveries.

### Runtime Risk Predictor

Consolida risco operacional usando:

- workflows criticos;
- workers saturados;
- forecast de incidentes;
- throttling ativo;
- pressao de recovery.

### Predictive Health Analyzer

Calcula health score previsto a partir do health atual, risco agregado e tendencia de degradacao.

### Predictive Routing Advisor

Recomenda:

- evitar workers saturados;
- aplicar gates em workflows criticos;
- preferir rotas com workers mais saudaveis.

### Predictive Throttling Engine

Recomenda throttling preventivo antes de falhas concretas.

Modos:

- `normal`;
- `preventive-limited`;
- `preventive-conservative`.

## Persistencia

Cada forecast inclui:

- `forecastId`;
- memoria carregada;
- tendencia de degradacao;
- workflows criticos;
- workers saturados;
- forecast de incidentes;
- risco operacional;
- health preditivo;
- recomendacoes de throttling;
- recomendacoes de rerouting;
- acoes operacionais.

## Limites da V1

- Heuristicas simples, sem modelo estatistico treinado.
- Forecast baseado no historico local disponivel.
- Nao executa throttling real.
- Nao altera policies existentes automaticamente.
- Nao altera PromoClub007 nem automacoes atuais.

## Proximos Passos

- alimentar Runtime Policy Engine com forecasts;
- integrar Predictive Routing Advisor ao Adaptive Router;
- adicionar janelas temporais configuraveis;
- criar scoring com decaimento temporal;
- gerar baseline por projeto;
- criar dashboards de forecast;
- adicionar testes para falsos positivos;
- evoluir para modelos estatisticos ou ML leve quando houver historico suficiente.
