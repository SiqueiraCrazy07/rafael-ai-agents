# PromoClub007

## Objetivo

Mapear o uso do Agent Operating System no PromoClub007, com foco em ofertas, afiliacao, automacao, SEO, UX, QA, analytics e evolucao futura para workflows mais autonomos.

## Agentes que atuam no PromoClub007

- `agents/02-site-vitrine/frontend-agent.md`: frontend, UX, performance mobile e integracao de ofertas.
- `agents/02-site-vitrine/backend-agent.md`: APIs, dados, cache, integracoes e automacoes.
- `agents/02-site-vitrine/ofertas-agent.md`: curadoria, validacao e qualidade de ofertas.
- `agents/02-site-vitrine/seo-cro-agent.md`: SEO, conversao, funis e conteudo.
- `agents/02-site-vitrine/qa-agent.md`: validacao funcional, visual e release.
- `agents/01-pm/pm-estrategico.md`: priorizacao e roadmap.
- `agents/01-pm/metricas-dados.md`: metricas, funis e analise de performance.
- `agents/01-pm/executivo.md`: sintese de status, riscos e decisoes.

## Workflows existentes

### Ingestao de ofertas

```text
Google Sheets
  -> automation/ingest/google-sheets-ingest.js
  -> automation/validators/offer-validator.js
  -> automation/normalizers/offer-normalizer.js
  -> automation/outputs/sample-output.json
```

### Publicacao de cache

```text
automation/outputs/sample-output.json
  -> automation/publish/site-publisher.js
  -> automation/cache/offers-cache.json
```

### Documentacao de frontend

- `docs/frontend-cache-integration.md`
- `docs/current-frontend-analysis.md`
- `docs/current-site-architecture.md`

## Playbooks aplicaveis

- `playbooks/qa-validation.md`
- `playbooks/frontend-change-review.md`
- `playbooks/automation-debugging.md`
- `playbooks/github-actions-debugging.md`
- `playbooks/ux-review.md`
- `playbooks/pm-product-discovery.md`

## Riscos

- frontend real ainda nao esta versionado neste repositorio;
- cache de publicacao precisa ser conectado ao site;
- credenciais locais devem permanecer fora do Git;
- mudancas no schema da planilha podem quebrar ingestao;
- SEO pode ser prejudicado se ofertas forem renderizadas apenas no cliente;
- performance mobile pode cair com muitas ofertas renderizadas de uma vez;
- deploy automatico sem QA pode publicar dados incorretos;
- multiplos marketplaces exigirao adaptadores e regras especificas.

## Proximos agentes recomendados

- Analytics Agent: funis, cliques, conversao e dashboards.
- Scheduler Agent: execucao recorrente, retries e historico.
- Marketplace Connector Agent: adaptadores por marketplace.
- Content SEO Agent: paginas indexaveis, categorias e metadata.
- Release Manager Agent: deploy, rollback e gates de qualidade.

## Proximos passos recomendados

1. Trazer o frontend real do PromoClub007 para o repositorio ou mapear o repositorio correto.
2. Executar o publisher para gerar `automation/cache/offers-cache.json` com dados reais.
3. Criar workflow documentado para ingestao + publish + QA.
4. Conectar frontend ao cache com fallback.
5. Criar validacao automatica do cache antes de deploy.
6. Criar paginas ou secoes por marketplace.
7. Adicionar metricas de cliques e conversao.
8. Evoluir para scheduler proprio e reduzir dependencia do Make.
