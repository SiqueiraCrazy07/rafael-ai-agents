# PromoClub007 System Map

## Objetivo

Mapear workflows, agentes, integracoes, riscos, dependencias, pontos criticos e roadmap futuro do PromoClub007 dentro do Agent Operating System.

## Workflows

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

### Futuro frontend publish

```text
offers-cache.json
  -> frontend/API
  -> QA
  -> deploy
  -> monitoramento
```

## Agentes

- `site-frontend-agent`: frontend, UX, cache e performance mobile.
- `site-backend-agent`: ingestao, APIs, cache, logs e integracoes.
- `site-ofertas-agent`: qualidade, curadoria e regras de ofertas.
- `site-seo-cro-agent`: SEO, conversao e paginas indexaveis.
- `site-qa-agent`: validacao visual, funcional, dados e release.
- `metricas-dados`: funis, analytics e indicadores.
- `pm-estrategico`: priorizacao e roadmap.
- `executivo`: sintese e decisoes.

## Integracoes

- Google Sheets: fonte atual de ofertas.
- Google Sheets API: leitura automatizada.
- Marketplaces: Shopee e Mercado Livre identificados nas URLs atuais.
- Futuro frontend/API: consumo de `offers-cache.json`.
- Futuro deploy: Vercel ou pipeline equivalente.
- Futuro analytics: cliques, conversao, CTR e receita.

## Riscos

- frontend real ainda nao esta versionado neste repositorio;
- credenciais locais nao podem ser versionadas;
- schema da planilha pode mudar;
- links de afiliado podem expirar;
- imagens externas podem quebrar;
- cache pode ficar desatualizado;
- deploy automatico sem QA pode publicar dados ruins;
- SEO pode ser prejudicado por renderizacao client-side;
- multiplos marketplaces exigem normalizacao especifica.

## Dependencias

- `automation/config/.env`;
- service account do Google;
- permissao da planilha;
- Google Sheets API ativa;
- schema real da planilha;
- scripts de ingestao, validacao, normalizacao e publish;
- futuro frontend para consumo do cache.

## Pontos criticos

- Validacao de preco, link e imagem.
- Normalizacao por marketplace.
- Rastreabilidade entre linha da planilha e oferta publicada.
- Logs de ingestao e publish.
- QA antes de deploy.
- Fallback se cache falhar.
- Protecao de credenciais.

## Roadmap futuro

### Fase 1

- Executar publish real apos ingestao.
- Validar cache gerado.
- Documentar workflow completo.
- Adicionar `.gitignore` para segredos e `node_modules`.

### Fase 2

- Conectar frontend ao cache.
- Criar fallback para cache invalido.
- Adicionar QA automatico de links e imagens.
- Criar paginas por marketplace.

### Fase 3

- Adicionar analytics de cliques e conversao.
- Criar scheduler proprio.
- Adicionar alertas operacionais.
- Criar conectores por marketplace.

### Fase 4

- Migrar para API real.
- Persistir ofertas em banco.
- Adicionar webhooks/realtime.
- Evoluir para multi-marketplace e prediction systems.
