# Site Vitrine Publish Flow

## Objetivo

Definir a etapa de publicacao do Site Vitrine a partir do arquivo normalizado `automation/outputs/sample-output.json`, preparando os dados para consumo futuro por frontend, API, deploy continuo e scheduler proprio.

Esta etapa nao publica diretamente no site ainda. Ela cria um cache estruturado, validado e rastreavel para ser usado como camada intermediaria entre ingestao de ofertas e publicacao.

---

## Fluxo publish

1. Ler `automation/outputs/sample-output.json`.
2. Validar a integridade minima do JSON normalizado.
3. Verificar se `metadata`, `offers` e `rejected` existem.
4. Validar campos obrigatorios de cada oferta.
5. Ler cache anterior quando existir.
6. Gerar resumo incremental com ofertas adicionadas, alteradas e removidas.
7. Agrupar ofertas por marketplace.
8. Ordenar ofertas por prioridade e titulo.
9. Criar payload preparado para API/frontend.
10. Gravar `automation/cache/offers-cache.json`.
11. Registrar logs de inicio, sucesso ou falha.

---

## Cache

O cache fica em:

```text
automation/cache/offers-cache.json
```

Estrutura principal:

- `version`: versao do formato do cache;
- `generatedAt`: data de geracao;
- `source`: origem do arquivo normalizado;
- `summary`: totais, rejeicoes e marketplaces;
- `sync`: informacoes para publicacao incremental futura;
- `offersByMarketplace`: indice de IDs por marketplace;
- `offers`: lista completa de ofertas prontas para publicacao;
- `apiPayload`: payload preparado para futura API ou frontend.

O cache evita que o frontend dependa diretamente do Google Sheets. A planilha continua sendo fonte de entrada, mas o site passa a consumir dados normalizados e validados.

---

## Sincronizacao

A primeira versao trabalha em modo `full`, reprocessando todas as ofertas normalizadas e gerando um cache completo.

Mesmo assim, o payload ja inclui base para sincronizacao incremental:

- `added`: ofertas novas;
- `updated`: ofertas alteradas;
- `removed`: ofertas removidas;
- contadores por tipo de mudanca.

Essa estrutura permite evoluir para publicacao parcial sem trocar o contrato principal do cache.

---

## Deploy futuro

O deploy futuro deve respeitar risco e qualidade.

Mudancas de baixo risco:

- novas ofertas validas;
- atualizacao de preco;
- atualizacao de disponibilidade;
- pequenas correcoes de imagem ou link.

Mudancas que devem exigir revisao:

- alteracao de schema;
- alteracao de layout;
- mudanca em SEO tecnico;
- mudanca de regras de curadoria;
- mudanca de integracao com marketplace;
- grande volume de ofertas removidas ou alteradas.

O fluxo recomendado e:

1. Ingestao do Google Sheets.
2. Validacao e normalizacao.
3. Geracao do cache publish.
4. QA automatico.
5. Publicacao automatica para baixo risco.
6. Revisao manual para medio e alto risco.
7. Deploy via Vercel ou pipeline equivalente.
8. Rollback em caso de falha critica.

---

## Integracao futura com frontend

O frontend deve consumir a camada `apiPayload` ou uma API que leia o cache.

Opcoes de integracao:

- leitura estatica de `offers-cache.json` durante build;
- endpoint backend que retorna ofertas filtradas;
- API com cache e invalidacao controlada;
- persistencia em banco antes da exibicao;
- CDN ou storage publico para entrega rapida do JSON.

Recomendacao inicial:

- usar o cache como contrato de dados;
- manter o frontend desacoplado do Google Sheets;
- filtrar por marketplace, categoria, disponibilidade e prioridade;
- manter fallback para erro de carregamento;
- preservar performance mobile.

---

## Estrategia para substituir Make

O publish flow e uma etapa intermediaria para reduzir dependencia do Make.

Evolucao recomendada:

1. Manter Google Sheets como fonte controlada de ofertas.
2. Substituir cenarios simples do Make por scripts versionados.
3. Centralizar logs em `automation/logs`.
4. Criar cache rastreavel para publicacao.
5. Adicionar QA automatico antes de qualquer deploy.
6. Migrar transformacoes de dados para normalizers versionados.
7. Criar conectores por marketplace.
8. Remover o Make apenas quando houver scheduler, retry, logs e rollback proprios.

O objetivo e migrar com seguranca, mantendo rastreabilidade e estabilidade operacional.

---

## Estrategia futura para scheduler proprio

O scheduler proprio deve executar o fluxo completo em etapas:

1. `ingest`: ler fontes como Google Sheets e marketplaces.
2. `validate`: validar schema, campos e regras de negocio.
3. `normalize`: converter dados para o modelo padrao.
4. `publish`: gerar cache e payload de publicacao.
5. `qa`: validar links, imagens, paginas e performance.
6. `deploy`: publicar automaticamente ou abrir revisao.
7. `monitor`: registrar logs, metricas e alertas.

Requisitos do scheduler:

- execucao recorrente;
- retries com limite;
- historico de execucao;
- status por etapa;
- logs estruturados;
- alertas de falha;
- bloqueio para alto risco;
- suporte a multiplos marketplaces;
- suporte a multiplas planilhas;
- base reutilizavel para o futuro SaaS de Automacao.

---

## Regras de seguranca

- nao expor tokens, credenciais ou dados sensiveis no cache;
- nao publicar dados sem validacao minima;
- manter logs sem segredos;
- exigir revisao para mudancas criticas;
- preservar rollback;
- nao alterar banco de producao diretamente;
- manter compatibilidade com schema padrao;
- documentar mudancas relevantes em integracoes e deploy.
