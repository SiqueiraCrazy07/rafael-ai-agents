# Arquitetura Atual do Site Vitrine

## Resumo Executivo

Nao ha `index.html` do Site Vitrine neste repositorio nem em um diretorio local claramente relacionado ao projeto dentro de `C:\Users\rafae`. A busca encontrou apenas arquivos `index.html` de plugins, extensoes e aplicativos locais, sem relacao com o Site Vitrine.

Portanto, nao e possivel analisar diretamente a implementacao atual do site, os dados hardcoded dentro do HTML, os seletores reais, a renderizacao existente ou os handlers de busca e filtro. Este documento registra essa limitacao, mapeia a arquitetura disponivel no repositorio e define a estrategia mais segura para integrar dados dinamicos quando o `index.html` ou o frontend real for adicionado.

Arquitetura disponivel hoje:

- ingestao real via Google Sheets;
- normalizacao de ofertas;
- validacao de dados;
- saida estruturada em `automation/outputs/sample-output.json`;
- publisher preparado em `automation/publish/site-publisher.js`;
- cache de publicacao em `automation/cache/offers-cache.json`;
- documentacao de integracao frontend e publish flow.

---

## Estrutura Atual Encontrada

```text
rafael-ai-agents/
  agents/
    02-site-vitrine/
  automation/
    cache/
      offers-cache.json
    config/
      .env
      example.env
      service-account.json
    ingest/
      google-sheets-ingest.js
    logs/
    normalizers/
      offer-normalizer.js
    outputs/
      sample-output.json
    publish/
      site-publisher.js
    validators/
      offer-validator.js
  docs/
  playbooks/
```

Arquivos nao encontrados:

- `index.html`;
- `src/`;
- `app/`;
- `pages/`;
- `components/`;
- `public/`;
- `next.config.*`;
- `vite.config.*`.

Conclusao: o frontend do Site Vitrine ainda nao esta versionado neste repositorio.

---

## 1. Como as ofertas sao armazenadas atualmente

No repositorio atual, as ofertas estao armazenadas em dois niveis:

### Saida normalizada

```text
automation/outputs/sample-output.json
```

Esse arquivo foi gerado a partir do Google Sheets e contem:

- `metadata`;
- `offers`;
- `rejected`.

Estado observado:

```text
totalRows: 455
acceptedCount: 455
rejectedCount: 0
```

Cada oferta normalizada contem campos como:

- `id`;
- `marketplace`;
- `title`;
- `category`;
- `price`;
- `previousPrice`;
- `currency`;
- `affiliateUrl`;
- `imageUrl`;
- `availability`;
- `priority`;
- `status`;
- `source`;
- `validation`;
- `metadata`;
- `updatedAt`.

### Cache de publicacao

```text
automation/cache/offers-cache.json
```

Esse arquivo existe como contrato de publicacao, mas no momento analisado ainda esta no estado inicial:

```text
totalOffers: 0
marketplaces: []
```

O publisher ja esta preparado para gerar esse cache a partir da saida normalizada, mas a publicacao do cache ainda nao foi executada nesta etapa para respeitar a regra de nao alterar funcionamento ou arquivos existentes.

---

## 2. Onde os dados estao hardcoded

Nao foi possivel identificar dados hardcoded no frontend porque o `index.html` nao esta presente.

No repositorio atual, os dados de exemplo ou estrutura inicial aparecem em:

- `automation/outputs/sample-output.json`: saida real da ingestao;
- `automation/cache/offers-cache.json`: cache inicial vazio;
- exemplos internos em `offer-validator.js` e `offer-normalizer.js`, usados apenas para teste local dos modulos.

Se o `index.html` externo existir, os pontos provaveis de hardcode a investigar sao:

- arrays JavaScript como `const products = [...]`, `const offers = [...]` ou `const mockOffers = [...]`;
- blocos HTML repetidos de cards de produto;
- atributos `src` de imagens escritos diretamente;
- links de afiliado em `href`;
- filtros definidos manualmente em listas ou botoes;
- categorias e marketplaces escritos em HTML ou JS.

---

## 3. Como o sistema de renderizacao funciona

Nao ha sistema de renderizacao do site disponivel para analise direta.

Pela arquitetura desejada, o fluxo de renderizacao futuro deve ser:

1. O frontend carrega `offers-cache.json`.
2. O cache e validado em uma camada de dados.
3. As ofertas sao filtradas, ordenadas e agrupadas.
4. Componentes renderizam cards, filtros e secoes.
5. O usuario interage com busca, filtros e links de afiliado.

Se o site atual for um `index.html` estatico, o padrao provavel e:

- carregar dados em um array local;
- selecionar um container com `document.querySelector`;
- gerar cards via `innerHTML` ou `createElement`;
- re-renderizar a lista quando filtros ou busca mudam.

Essa hipotese precisa ser confirmada quando o `index.html` real estiver disponivel.

---

## 4. Como filtros e busca funcionam

Nao foi possivel verificar a implementacao real.

Estrategia recomendada para manter compatibilidade com um site estatico:

- manter um array `allOffers` carregado do cache;
- manter um estado simples com `search`, `marketplace`, `category`, `availability` e `sort`;
- aplicar filtros em uma funcao pura;
- renderizar somente o resultado filtrado;
- preservar os nomes e IDs dos elementos existentes sempre que possivel.

Exemplo conceitual:

```text
allOffers -> applySearch -> applyFilters -> applySort -> renderOffers
```

Para evitar quebra, a primeira integracao deve substituir apenas a origem dos dados, mantendo a renderizacao atual.

---

## 5. Como as imagens e links sao montados

Na automacao atual, imagens e links chegam do Google Sheets e sao normalizados como:

- `affiliateUrl`;
- `imageUrl`.

Exemplo real da saida normalizada:

```text
affiliateUrl: https://s.shopee.com.br/3LNHNZd9hU
imageUrl: https://cf.shopee.com.br/file/sg-11134201-7rfh5-m9kr6rsjxmhhc7
```

No frontend, a montagem deve seguir estas regras:

- `href` do botao/card deve usar `affiliateUrl`;
- `src` da imagem deve usar `imageUrl`;
- `alt` deve usar `title`;
- links externos devem usar `target="_blank"` e `rel="noopener noreferrer sponsored"` quando aplicavel;
- imagem com erro deve cair em placeholder;
- oferta sem link valido nao deve ser exibida como clicavel.

---

## 6. Como funciona o carregamento inicial da pagina

Nao ha `index.html` para confirmar.

Para um site estatico, a estrategia segura de carregamento inicial e:

1. Renderizar estrutura base da pagina.
2. Mostrar skeleton ou estado de carregamento.
3. Buscar `offers-cache.json`.
4. Validar o contrato minimo.
5. Renderizar ofertas prioritarias primeiro.
6. Renderizar filtros a partir dos dados disponiveis.
7. Registrar erro e mostrar fallback se o cache falhar.

Para SEO forte, o ideal futuro e migrar paginas principais para renderizacao em build/server, em vez de depender apenas de `fetch` no cliente.

---

## 7. Quais partes devem ser desacopladas primeiro

Quando o `index.html` for disponibilizado, a ordem mais segura e:

1. Extrair o array hardcoded de ofertas para uma constante isolada.
2. Criar uma funcao `getOffers`.
3. Manter a renderizacao existente usando `getOffers`.
4. Trocar `getOffers` para ler `offers-cache.json`.
5. Extrair filtros e busca para funcoes puras.
6. Extrair renderizacao de card para uma funcao unica.
7. Criar validacao e fallback para dados invalidos.
8. Separar configuracoes de marketplace.

Primeiro desacoplamento recomendado:

```text
origem dos dados -> getOffers()
renderizacao -> renderOffers(offers)
filtros -> filterOffers(offers, state)
```

---

## 8. Estrategia mais segura para integrar dados dinamicos

A estrategia mais segura e trocar a origem dos dados antes de alterar layout, busca ou filtros.

Fase 1:

- manter HTML, CSS e renderizacao atuais;
- gerar `offers-cache.json`;
- copiar cache para uma pasta acessivel ao site;
- carregar dados via `fetch`;
- se o fetch falhar, usar array local antigo como fallback temporario.

Fase 2:

- remover o array local hardcoded;
- validar cache antes de renderizar;
- adicionar fallback visual;
- preservar IDs/classes existentes.

Fase 3:

- adaptar filtros para marketplaces/categorias dinamicos;
- otimizar imagens;
- adicionar logs de erro no cliente;
- preparar deploy automatico.

Regra de seguranca: nao mudar dados, layout e logica de filtro no mesmo passo.

---

## 9. Riscos na arquitetura atual

Riscos confirmados neste repositorio:

- frontend real ausente;
- cache de publicacao ainda vazio;
- credenciais locais existem em `automation/config`, exigindo cuidado para nao versionar segredos;
- automacao e frontend ainda nao estao conectados;
- publish flow ainda nao foi integrado a deploy;
- nao ha testes automatizados para o fluxo completo.

Riscos provaveis se o site atual for um `index.html` com hardcode:

- dados duplicados entre planilha, JSON e HTML;
- alto risco de erro manual em links e imagens;
- filtros acoplados ao formato antigo;
- SEO limitado se ofertas renderizam apenas no cliente;
- performance mobile ruim se renderizar centenas de cards de uma vez;
- ausencia de fallback quando imagem/link falha;
- dificuldade para multiplos marketplaces;
- deploy automatico pode publicar dados ruins sem QA.

---

## 10. Preparacao da arquitetura futura

### Atualizacao automatica

Fluxo recomendado:

```text
Google Sheets
  -> ingest
  -> validate
  -> normalize
  -> publish cache
  -> QA
  -> deploy
```

O site deve consumir somente o cache ou uma API derivada dele, nunca a planilha diretamente.

### Multiplos marketplaces

Preparar:

- `marketplace` como slug normalizado;
- `offersByMarketplace` no cache;
- filtros dinamicos;
- regras por marketplace em adaptadores;
- paginas por marketplace no futuro.

### SEO

Para SEO forte:

- evitar depender apenas de renderizacao client-side;
- criar paginas indexaveis por categoria e marketplace;
- gerar metadata com base nas ofertas;
- usar canonical para filtros;
- criar sitemap futuro;
- evitar indexar paginas vazias.

### Performance mobile

Prioridades:

- carregar somente ofertas iniciais acima da dobra;
- lazy loading de imagens;
- placeholder para imagens;
- cards com dimensoes estaveis;
- filtros compactos;
- paginacao ou "carregar mais";
- evitar re-renderizacao pesada em busca e filtros.

### Escalabilidade futura

Evolucao recomendada:

1. Cache estatico.
2. API interna lendo cache.
3. Banco de dados para ofertas.
4. Scheduler proprio.
5. Webhooks/realtime para mudancas relevantes.
6. Painel operacional.
7. SaaS de automacao com conectores reutilizaveis.

---

## Plano de Integracao Gradual

### Etapa 1 - Disponibilizar o frontend real

Adicionar ao repositorio o `index.html` e assets relacionados, ou informar o caminho/repo correto.

### Etapa 2 - Mapear hardcodes reais

Identificar:

- array de ofertas;
- estrutura de card;
- funcoes de renderizacao;
- filtros;
- busca;
- links;
- imagens;
- categorias;
- marketplaces.

### Etapa 3 - Criar camada de dados

Introduzir:

```text
loadOffers()
validateOffers()
filterOffers()
renderOffers()
```

Sem mudar visual.

### Etapa 4 - Conectar cache

Carregar `offers-cache.json` com fallback para dados antigos.

### Etapa 5 - Remover hardcode

Remover arrays locais apos confirmar que:

- cache carrega;
- filtros funcionam;
- imagens aparecem;
- links abrem;
- mobile continua estavel;
- SEO nao piorou.

### Etapa 6 - Automatizar publicacao

Conectar:

```text
npm run ingest:sheets
node automation/publish/site-publisher.js
deploy
```

Com bloqueios de QA para alto risco.

---

## Recomendacao Final

Antes de alterar funcionamento do site, o proximo passo tecnico e trazer o `index.html` real para este repositorio ou informar o caminho correto do projeto Site Vitrine.

Com o arquivo real disponivel, a primeira mudanca deve ser apenas desacoplar a origem dos dados, mantendo a renderizacao atual. Depois disso, a integracao com `offers-cache.json` pode ser feita com fallback, minimizando risco de quebrar busca, filtros, imagens, links e layout mobile.
