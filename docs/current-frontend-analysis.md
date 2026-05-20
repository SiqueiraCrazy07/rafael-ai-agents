# Analise Atual do Frontend do Site Vitrine

## Resumo

Este repositorio ainda nao contem a aplicacao frontend do Site Vitrine. A estrutura atual possui documentacao, agentes e a automacao de ofertas em Node.js, mas nao ha diretorios ou arquivos tipicos de React/Next.js como `src/`, `app/`, `pages/`, `components/`, `public/`, `next.config.*` ou `vite.config.*`.

Por isso, nao foi possivel identificar componentes reais com ofertas hardcoded ou mockadas dentro deste repositorio. A analise abaixo registra o estado atual, os riscos e a estrategia recomendada para integrar o frontend quando ele for adicionado ou conectado a este projeto.

---

## 1. Onde as ofertas estao atualmente hardcoded ou mockadas

Nao ha frontend real neste repositorio para inspecionar.

O que existe hoje:

- `automation/outputs/sample-output.json`: saida normalizada gerada pela ingestao do Google Sheets;
- `automation/cache/offers-cache.json`: cache inicial para futura publicacao;
- `automation/publish/site-publisher.js`: publisher criado para transformar a saida normalizada em cache de publicacao;
- documentacao tecnica em `docs/`;
- agentes da frente `02-site-vitrine`.

Conclusao: se houver ofertas hardcoded ou mockadas, elas estao em outro repositorio ou ainda nao foram versionadas aqui.

---

## 2. Como integrar automation/cache/offers-cache.json

A integracao deve tratar `automation/cache/offers-cache.json` como contrato entre a automacao e o frontend.

Fluxo recomendado:

1. Rodar ingestao do Google Sheets.
2. Gerar `automation/outputs/sample-output.json`.
3. Rodar o publisher para gerar `automation/cache/offers-cache.json`.
4. Copiar ou disponibilizar o cache para o frontend.
5. O frontend consome o cache via build time, server-side fetch ou endpoint interno.

Locais recomendados no frontend:

```text
public/data/offers-cache.json
src/data/offers-cache.json
```

Para Next.js, a melhor abordagem inicial e criar uma camada de leitura:

```text
src/lib/offers/getOffers.ts
src/lib/offers/validateOffersCache.ts
src/lib/offers/filterOffers.ts
src/lib/offers/sortOffers.ts
```

Os componentes nao devem importar o JSON diretamente. Eles devem consumir funcoes ou hooks que escondem a origem dos dados.

---

## 3. Quais componentes devem ser adaptados

Como o frontend ainda nao existe neste repositorio, os componentes abaixo sao a estrutura recomendada para adaptacao ou criacao.

Componentes principais:

- `OfferGrid`: lista responsiva de ofertas;
- `OfferCard`: card individual de oferta;
- `OfferPrice`: preco, preco anterior e desconto;
- `OfferImage`: imagem com fallback;
- `OfferFilters`: filtros por marketplace, categoria, status e disponibilidade;
- `MarketplaceTabs`: navegacao por marketplace;
- `OfferEmptyState`: estado vazio;
- `OfferSkeleton`: carregamento;
- `FeaturedOffers`: ofertas prioritarias;
- `OfferSection`: blocos por categoria ou marketplace.

Paginas recomendadas:

```text
/ofertas
/ofertas/[marketplace]
/categorias/[categoria]
```

---

## 4. Como desacoplar os dados atuais

Quando o frontend for integrado, qualquer array local de ofertas deve ser movido para uma camada de dados.

Antes:

```text
components/OfferGrid.tsx importa ou define um array local de ofertas.
```

Depois:

```text
components/OfferGrid.tsx recebe offers por props.
src/lib/offers/getOffers.ts decide se os dados vem de JSON, API ou banco.
```

Padrao recomendado:

- componentes recebem dados prontos por props;
- paginas ou server components chamam `getOffers`;
- filtros ficam em helpers puros;
- validacao do cache acontece antes da renderizacao;
- o formato interno do componente usa um tipo `Offer` estavel.

Esse desacoplamento permite trocar `offers-cache.json` por API real sem reescrever a interface.

---

## 5. Estrategia ideal para React/Next.js

Recomendacao inicial para Next.js:

- usar renderizacao server-side ou build time para paginas indexaveis;
- usar ISR quando as ofertas mudarem com frequencia moderada;
- usar fetch estatico para `offers-cache.json`;
- manter componentes de oferta como server components sempre que possivel;
- usar client components apenas para filtros interativos, ordenacao local e estados dinamicos.

Camada sugerida:

```text
src/lib/offers/
  getOffers.ts
  getMarketplaces.ts
  filterOffers.ts
  sortOffers.ts
  validateOffersCache.ts
  types.ts
```

Contrato recomendado:

```text
getOffers() -> Offer[]
getOffersByMarketplace(marketplace) -> Offer[]
getFeaturedOffers(limit) -> Offer[]
```

---

## 6. Estrategia de atualizacao automatica

Fluxo ideal:

1. Scheduler executa ingestao.
2. Publisher gera `offers-cache.json`.
3. QA valida cache, links, imagens e paginas criticas.
4. Pipeline copia cache para o frontend.
5. Deploy automatico ocorre para mudancas de baixo risco.
6. Revisao manual ocorre para mudancas de alto risco.

Baixo risco:

- novas ofertas validas;
- alteracao de preco;
- alteracao de disponibilidade;
- ajustes simples de imagem ou link.

Alto risco:

- mudanca de schema;
- queda brusca no numero de ofertas;
- troca de marketplace;
- mudanca de layout;
- alteracao de SEO tecnico;
- falha em links ou imagens em massa.

---

## 7. Estrategia de performance

Prioridades para mobile:

- renderizar o conteudo inicial no servidor;
- limitar quantidade inicial de cards;
- usar lazy loading para imagens;
- definir `width`, `height` ou `aspect-ratio` nos cards;
- evitar layout shift;
- paginar ou usar botao "carregar mais";
- evitar filtros pesados no cliente;
- compactar o JSON quando servido publicamente;
- usar CDN para o cache e imagens quando possivel.

Para listas grandes, o frontend deve carregar primeiro as ofertas prioritarias e depois complementar por categoria ou marketplace.

---

## 8. Estrategia de SEO

SEO deve ser resolvido no servidor ou no build, nao apenas no cliente.

Recomendacoes:

- paginas `/ofertas`, `/ofertas/[marketplace]` e `/categorias/[categoria]` devem ser indexaveis;
- gerar metadata por pagina;
- criar headings claros;
- usar texto descritivo nas ofertas e imagens;
- evitar indexar filtros vazios ou combinacoes fracas;
- usar canonical quando houver filtros;
- gerar sitemap dinamico no futuro;
- nao depender exclusivamente de client-side rendering para conteudo de ofertas.

O cache deve fornecer dados suficientes para montar paginas indexaveis sem consultar Google Sheets em tempo real.

---

## 9. Estrategia de fallback

Fallbacks essenciais:

- se o cache estiver indisponivel, exibir ultima versao valida;
- se uma oferta estiver invalida, remover apenas aquela oferta da renderizacao;
- se imagem falhar, usar placeholder;
- se marketplace estiver vazio, exibir estado vazio;
- se o cache estiver totalmente invalido, bloquear deploy;
- se a API futura falhar, voltar para cache estatico.

Regra: uma oferta quebrada nao deve derrubar a pagina inteira.

---

## 10. Estrategia de deploy

Deploy recomendado:

1. Validar ingestao.
2. Gerar cache.
3. Validar schema do cache.
4. Executar QA automatico.
5. Copiar cache para frontend ou publicar em storage/CDN.
6. Rodar build do frontend.
7. Publicar via Vercel ou pipeline equivalente.
8. Monitorar logs, erros e performance.

O deploy deve falhar quando:

- cache nao existir;
- JSON estiver invalido;
- `offers` nao for array;
- numero de ofertas cair de forma anormal;
- links ou imagens criticas falharem;
- paginas principais nao renderizarem.

---

## Riscos identificados

- O frontend real nao esta neste repositorio, entao nao ha como garantir o ponto exato de integracao.
- Pode haver schema diferente no frontend existente em outro repositorio.
- O cache inicial pode crescer e impactar bundle se for importado diretamente em client components.
- Imagens externas de marketplaces podem exigir configuracao especifica no Next.js.
- SEO pode ser prejudicado se as ofertas forem renderizadas apenas no cliente.
- Deploy automatico sem QA pode publicar dados ruins em massa.
- Mudancas no formato da planilha podem quebrar ingestao se nao houver validacao de schema.

---

## Integracao gradual recomendada

### Fase 1 - Contrato estatico

- Gerar `offers-cache.json`;
- validar estrutura;
- copiar para `public/data/offers-cache.json`;
- criar `getOffers`;
- renderizar lista simples de ofertas.

### Fase 2 - Componentizacao

- criar `OfferCard`, `OfferGrid`, `OfferFilters` e `OfferImage`;
- remover mocks e arrays locais;
- adicionar fallback visual;
- medir performance mobile.

### Fase 3 - SEO e paginas dedicadas

- criar paginas por marketplace;
- criar paginas por categoria;
- adicionar metadata;
- preparar sitemap;
- usar ISR.

### Fase 4 - Automacao de deploy

- rodar ingestao e publish em pipeline;
- validar cache antes do build;
- bloquear deploy em falhas criticas;
- publicar automaticamente apenas baixo risco.

### Fase 5 - API e SaaS

- trocar leitura estatica por API mantendo o mesmo contrato;
- persistir ofertas em banco;
- adicionar scheduler proprio;
- adicionar webhooks e sincronizacao incremental;
- reutilizar conectores no SaaS de Automacao.

---

## Conclusao

No estado atual, o frontend do Site Vitrine ainda nao esta presente neste repositorio. A integracao deve ser preparada por contrato, usando `automation/cache/offers-cache.json` como camada intermediaria e evitando que componentes dependam diretamente de Google Sheets, mocks ou estruturas temporarias.

Quando o frontend for adicionado, o primeiro passo tecnico deve ser criar uma camada `src/lib/offers` para ler e validar o cache, depois adaptar os componentes de listagem, card, filtros e paginas indexaveis de forma incremental.
