# Integracao Frontend com Offers Cache

## Objetivo

Definir o plano tecnico para integrar o frontend do Site Vitrine com `automation/cache/offers-cache.json`, mantendo baixo custo, boa escalabilidade, excelente UX mobile, SEO forte, automacao continua e caminho claro para evoluir para API real e SaaS proprio.

O cache deve funcionar como contrato inicial entre a automacao de ofertas e o site. O frontend nao deve consumir Google Sheets diretamente.

---

## 1. Como o frontend deve consumir offers-cache.json

O frontend deve consumir o arquivo:

```text
automation/cache/offers-cache.json
```

Como contrato de dados, o cache contem:

- `summary`: totais, marketplaces e rejeicoes;
- `offersByMarketplace`: indice de ofertas por marketplace;
- `offers`: lista completa de ofertas;
- `apiPayload`: estrutura pronta para futura API/frontend;
- `sync`: base para atualizacao incremental futura.

Recomendacao inicial:

1. O processo de build ou deploy copia `offers-cache.json` para uma area publica ou de dados do frontend.
2. O frontend le o arquivo em build time ou via fetch estatico.
3. Os componentes renderizam ofertas a partir de `apiPayload.offers`.
4. Filtros e agrupamentos usam `marketplaces` e `offersByMarketplace`.

Opcoes de local no frontend:

```text
public/data/offers-cache.json
src/data/offers-cache.json
```

Para SEO, prefira leitura em servidor ou build time. Para atualizacoes frequentes sem rebuild, use fetch estatico com cache controlado.

---

## 2. Estrategia recomendada para React/Next.js

Para Next.js, a estrategia recomendada depende da frequencia de atualizacao:

### Baixa ou media frequencia

Use geracao estatica com revalidacao:

- App Router: `fetch` com `next: { revalidate: 300 }`;
- Pages Router: `getStaticProps` com `revalidate`.

Beneficios:

- baixo custo;
- bom SEO;
- performance forte;
- menor dependencia de runtime.

### Alta frequencia

Use uma rota de API ou endpoint interno que leia o cache:

```text
GET /api/offers
GET /api/offers?marketplace=shopee
GET /api/offers?category=casa
```

Beneficios:

- permite filtros dinamicos;
- facilita cache em CDN;
- prepara migracao para banco/API real.

### Recomendacao inicial

Comecar com `offers-cache.json` estatico e uma camada de acesso no frontend:

```text
src/lib/offers/getOffers.ts
src/lib/offers/filterOffers.ts
src/components/offers/OfferGrid.tsx
```

Essa camada evita que componentes dependam diretamente do formato bruto do arquivo.

---

## 3. Estrategia de atualizacao automatica

Fluxo recomendado:

1. Rodar ingestao do Google Sheets.
2. Gerar `automation/outputs/sample-output.json`.
3. Rodar publish para gerar `automation/cache/offers-cache.json`.
4. Copiar ou disponibilizar o cache para o frontend.
5. Executar QA automatico.
6. Fazer deploy automatico ou revisado conforme risco.

Para Vercel/Next.js:

- se o cache estiver versionado no repositorio, um commit dispara deploy;
- se o cache estiver em storage/CDN, o frontend pode buscar o JSON sem novo deploy;
- se usar ISR, o site revalida paginas periodicamente.

Recomendacao de baixo custo:

- publicar o JSON em arquivo estatico;
- usar ISR para paginas principais;
- usar deploy automatico apenas quando houver mudanca relevante.

---

## 4. Estrategia de cache

A arquitetura deve ter camadas de cache:

- cache de automacao: `automation/cache/offers-cache.json`;
- cache do build: dados usados em geracao estatica;
- cache CDN: entrega rapida do JSON e paginas;
- cache de navegador: controlado por headers;
- cache interno futuro: banco ou Redis quando houver API real.

Politica inicial:

- paginas SEO: revalidacao entre 5 e 30 minutos;
- JSON estatico: cache curto com revalidacao;
- imagens externas: usar componente otimizado quando possivel;
- ofertas criticas: permitir invalidacao manual.

O cache deve manter `generatedAt` e `source.processedAt` visiveis para depuracao operacional.

---

## 5. Estrategia de performance mobile

Prioridades:

- renderizar rapido a primeira lista de ofertas;
- evitar JavaScript desnecessario;
- carregar imagens com lazy loading;
- usar tamanhos responsivos de imagem;
- limitar quantidade inicial de cards;
- usar paginacao, "carregar mais" ou virtualizacao quando houver muitas ofertas;
- manter filtros simples e rapidos;
- evitar layout shift em cards.

Recomendacoes de UI:

- cards compactos;
- preco e desconto visiveis sem toque adicional;
- botao de oferta claro;
- filtros acessiveis em mobile;
- skeleton discreto durante carregamento;
- estados vazios claros;
- fallback de imagem para erro.

Para Next.js:

- usar `next/image` quando imagens forem permitidas pelo dominio;
- configurar dominios de marketplaces;
- definir largura/altura ou aspect ratio;
- evitar renderizar centenas de imagens acima da dobra.

---

## 6. Estrategia de fallback em erro

O frontend deve lidar com falhas sem quebrar a experiencia.

Falhas previstas:

- cache indisponivel;
- JSON invalido;
- lista vazia;
- imagem quebrada;
- link de afiliado invalido;
- marketplace sem ofertas;
- timeout na API futura.

Fallbacks recomendados:

- exibir ultima versao valida do cache quando disponivel;
- esconder ofertas com campos criticos ausentes;
- mostrar estado vazio por filtro;
- usar imagem placeholder quando imagem falhar;
- registrar erro em monitoramento;
- manter paginas principais renderizaveis mesmo sem ofertas;
- bloquear deploy quando cache estiver invalido.

Regra central: erro de uma oferta nao deve derrubar a pagina inteira.

---

## 7. Estrategia de SEO

SEO deve ser tratado como parte do contrato de publicacao.

Recomendacoes:

- renderizar paginas principais no servidor ou em build time;
- criar paginas indexaveis por categoria e marketplace;
- evitar depender apenas de client-side rendering;
- gerar titulo, descricao e headings com base em categorias/ofertas;
- usar URLs estaveis;
- adicionar dados estruturados quando aplicavel;
- manter imagens com `alt` descritivo;
- evitar paginas com listas vazias indexadas;
- controlar canonical e noindex para filtros fracos;
- medir impacto de alteracoes em trafego e conversao.

Estrutura futura:

```text
/ofertas
/ofertas/shopee
/ofertas/mercado-livre
/categorias/casa
/categorias/eletronicos
```

Cada pagina deve ser util para usuario e buscador, nao apenas uma listagem gerada automaticamente.

---

## 8. Estrategia de deploy continuo

Deploy deve seguir risco:

- baixo risco: atualizacao de cache com ofertas validas;
- medio risco: mudanca de filtros, categorias ou regras de exibicao;
- alto risco: schema, integracao, SEO tecnico, layout ou API.

Fluxo recomendado:

1. Gerar cache.
2. Validar schema do cache.
3. Rodar QA automatico.
4. Verificar resumo incremental.
5. Se baixo risco, publicar automaticamente.
6. Se medio ou alto risco, abrir revisao.
7. Fazer deploy via Vercel.
8. Monitorar erros, performance e conversao.

O deploy deve falhar se:

- cache estiver invalido;
- nao houver ofertas quando deveria haver;
- imagens ou links criticos falharem em massa;
- paginas principais quebrarem;
- houver risco de exposicao de segredos.

---

## 9. Estrategia futura para API real

Quando o volume ou a frequencia crescer, o cache pode evoluir para API.

Etapas:

1. Criar endpoint que retorna o mesmo contrato do `apiPayload`.
2. Manter compatibilidade com `offers-cache.json`.
3. Persistir ofertas em banco.
4. Adicionar filtros server-side.
5. Adicionar paginacao.
6. Adicionar cache em CDN.
7. Criar endpoints por marketplace e categoria.
8. Adicionar autenticacao para operacoes administrativas.
9. Manter endpoint publico somente para dados que podem ser exibidos no site.

Contrato inicial:

```text
GET /api/offers
GET /api/offers/:id
GET /api/marketplaces
GET /api/categories
```

O frontend deve usar uma camada `offersRepository` para trocar arquivo por API sem refatorar componentes.

---

## 10. Estrategia para multiplos marketplaces

O cache ja inclui `marketplace` e `offersByMarketplace`.

Estrategia:

- manter slug normalizado por marketplace;
- criar filtros por marketplace;
- permitir paginas dedicadas por marketplace;
- separar regras de imagem, afiliacao e disponibilidade por origem;
- medir performance e conversao por marketplace;
- suportar marketplaces mistos no mesmo cache;
- evitar acoplar componentes a um marketplace especifico.

Componentes devem receber dados normalizados:

```text
marketplace
title
price
previousPrice
affiliateUrl
imageUrl
availability
priority
status
```

Regras especificas devem ficar em helpers ou adaptadores, nao espalhadas pela interface.

---

## 11. Estrutura recomendada de componentes frontend

Estrutura sugerida:

```text
src/
  app/
    ofertas/
      page.tsx
    ofertas/[marketplace]/
      page.tsx
  components/
    offers/
      OfferCard.tsx
      OfferGrid.tsx
      OfferFilters.tsx
      OfferPrice.tsx
      OfferImage.tsx
      OfferEmptyState.tsx
      OfferSkeleton.tsx
  lib/
    offers/
      getOffers.ts
      filterOffers.ts
      sortOffers.ts
      offerTypes.ts
      validateOffersCache.ts
```

Responsabilidades:

- `getOffers`: buscar dados do cache ou API;
- `validateOffersCache`: validar contrato antes de renderizar;
- `filterOffers`: aplicar filtros;
- `sortOffers`: ordenar por prioridade, preco ou relevancia;
- `OfferGrid`: renderizar lista responsiva;
- `OfferCard`: exibir oferta individual;
- `OfferPrice`: tratar preco, preco anterior e desconto;
- `OfferImage`: fallback e otimizacao visual.

---

## 12. Estrategia de sincronizacao incremental

O cache ja inclui:

```text
sync.changes.added
sync.changes.updated
sync.changes.removed
```

Uso inicial:

- monitorar volume de mudancas;
- bloquear deploy quando remocoes forem anormais;
- destacar mudancas em logs;
- permitir QA focado nas ofertas alteradas.

Uso futuro:

- atualizar somente paginas afetadas;
- invalidar cache por marketplace;
- revalidar rotas especificas;
- publicar deltas em API;
- enviar eventos para scheduler ou fila.

Para Next.js, a sincronizacao incremental pode acionar revalidacao por rota:

```text
/ofertas
/ofertas/shopee
/categorias/casa
```

O objetivo e evitar rebuild completo quando apenas um subconjunto de ofertas muda.

---

## 13. Estrategia futura para realtime/webhooks

Realtime nao deve ser a primeira etapa. A prioridade inicial deve ser cache estavel, QA e deploy previsivel.

Evolucao recomendada:

1. Scheduler roda ingestao em intervalos definidos.
2. Publish gera cache e resumo incremental.
3. Webhook interno dispara revalidacao ou deploy.
4. API recebe deltas quando houver mudanca.
5. Frontend usa revalidacao seletiva.
6. Painel administrativo mostra status em tempo quase real.

Possiveis gatilhos futuros:

- edicao no Google Sheets;
- nova oferta de marketplace;
- alerta de link quebrado;
- mudanca de preco;
- aprovacao manual de curadoria;
- conclusao de QA.

Tecnologias possiveis:

- webhooks internos;
- filas;
- cron jobs;
- Vercel deploy hooks;
- Supabase realtime;
- storage events;
- scheduler proprio do SaaS de Automacao.

Realtime deve ser usado apenas quando reduzir latencia operacional sem comprometer estabilidade, custo e qualidade.

---

## Recomendacao final

Comecar com uma arquitetura simples:

1. `offers-cache.json` como contrato.
2. Next.js com renderizacao server/build time.
3. ISR ou fetch estatico com cache controlado.
4. Componentes desacoplados do formato bruto.
5. QA automatico antes de deploy.
6. Evolucao gradual para API, scheduler e webhooks.

Esse caminho preserva baixo custo, SEO forte, performance mobile e prepara a base para automacao continua e SaaS proprio.
