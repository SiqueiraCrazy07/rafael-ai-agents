# PromoClub007 Agent Flow

## Objetivo

Mapear a ordem operacional dos agentes no PromoClub007, pontos de validacao, gates humanos, pontos criticos e riscos.

## Agentes que atuam

- `pm-estrategico`
- `discovery`
- `prd-backlog`
- `ux-produto`
- `site-frontend-agent`
- `site-backend-agent`
- `site-ofertas-agent`
- `site-seo-cro-agent`
- `site-qa-agent`
- `metricas-dados`
- `executivo`

## Ordem operacional recomendada

### Produto e mudanca frontend

```text
PM Estrategico
  -> UX Produto
  -> Frontend Agent
  -> SEO/CRO Agent
  -> QA Agent
  -> validacao humana quando necessario
```

### Automacao de ofertas

```text
Ofertas Agent
  -> Backend Agent
  -> QA Agent
  -> Publish
  -> validacao humana para high/critical
```

### Discovery ate execucao

```text
Discovery
  -> PM Estrategico
  -> PRD e Backlog
  -> Frontend/Backend/Ofertas
  -> QA
  -> Metricas e Dados
```

## Pontos de validacao

- schema da planilha;
- quantidade de ofertas processadas;
- links e imagens;
- cache de publicacao;
- renderizacao frontend;
- SEO;
- performance mobile;
- deploy.

## Pontos criticos

- credenciais Google;
- Google Sheets API;
- schema real da planilha;
- normalizacao de precos;
- cache `offers-cache.json`;
- integracao frontend futura;
- QA antes de deploy;
- rastreabilidade por linha de origem.

## Gates humanos

Obrigatorios quando:

- mudanca altera schema;
- mudanca altera deploy;
- mudanca altera frontend critico;
- queda anormal no numero de ofertas;
- risco de dados incorretos publicados;
- alteracao envolve credenciais;
- incidente high/critical.

## Riscos

- publicar preco incorreto;
- link de afiliado quebrado;
- imagem indisponivel;
- cache desatualizado;
- SEO prejudicado;
- layout mobile quebrado;
- automacao falhar silenciosamente;
- agente atuar fora de escopo.
