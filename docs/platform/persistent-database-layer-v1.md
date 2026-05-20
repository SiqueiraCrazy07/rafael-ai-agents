# Persistent Database Layer V1

## Objetivo

Criar uma camada persistente inicial para o Rafael AI Agents sem substituir ainda os arquivos JSON existentes em `memory/` e `runtime-data/`.

A V1 funciona em mirror mode: le os artefatos JSON atuais, normaliza registros e grava uma copia append-only em um adapter filesystem-db.

## Estrutura

Diretorios criados:

- `database/adapters/`
- `database/repositories/`
- `database/migrations/`
- `database/schemas/`
- `database/seed/`
- `database/demo/`

## Adapter

Adapter inicial:

- `database/adapters/filesystem-db-adapter.js`

Caracteristicas:

- grava colecoes em JSONL;
- usa `runtime-data/database/tables/`;
- persiste relatorios em `runtime-data/database/` e `memory/database/`;
- suporta `upsert` por chave logica, `idempotencyKey`, `dedupeKey` e `recordHash`;
- implementa interface desacoplada em `database/adapters/database-adapter.js`;
- preparado para adapters futuros de SQLite e PostgreSQL.

## Repositories

Repositories criados:

- events;
- decisions;
- transitions;
- runtime validation;
- queue;
- api governance audit;
- workflow state.

Cada repository declara:

- collection;
- fontes JSON atuais;
- normalizer;
- operacoes `insert`, `list` e `findById` quando aplicavel.

## Mirror Mode

Mirror mode:

1. le JSONs atuais em `memory/` e `runtime-data/`;
2. registra `readErrors` quando um JSON esta invalido;
3. normaliza records;
4. grava copia em filesystem-db;
5. nao remove nem modifica os JSONs originais.

Fontes espelhadas:

- `memory/events/` e `runtime-data/events/`;
- `memory/decisions/` e `runtime-data/decisions/`;
- `memory/state-transitions/` e `runtime-data/state-transitions/`;
- `memory/runtime-validation/` e `runtime-data/runtime-validation/`;
- `memory/queue/` e `runtime-data/queue/`;
- `memory/api-governance/` e `runtime-data/api-governance/`;
- `memory/state-machine/` e `runtime-data/state-machine/`.

## Query Layer

Query layer implementada em `database/repositories/query-layer.js`.

Consultas:

- listar eventos;
- listar decisoes;
- listar transicoes;
- buscar workflow state;
- buscar audit trail;
- listar runtime validation;
- consultar status estruturado da queue.

O query layer tenta ler do database adapter. Se a colecao nao estiver disponivel, usa fallback para os JSONs atuais.

## Persistencia

A V1 persiste em:

- `runtime-data/database/`;
- `memory/database/`.

As tabelas ficam em:

- `runtime-data/database/tables/*.jsonl`.

## Scripts

```bash
npm run db:demo
npm run db:mirror-demo
npm run db:queue-demo
npm run db:idempotency-demo
```

`db:demo` inicializa o adapter, executa migration e testa o query layer com fallback JSON quando as tabelas ainda nao existem.

`db:mirror-demo` executa mirror mode e consulta as colecoes espelhadas.

`db:queue-demo` executa mirror dedicado de fila e valida `queueItems`, `retryItems`, `protectedQueue`, `metrics`, `throttling` e workers relacionados.

`db:idempotency-demo` executa mirror duas vezes e prova que a segunda execucao nao duplica registros quando ha chave logica confiavel.

## Fallback Seguro

Fallbacks:

- database indisponivel: query layer usa JSON atual;
- colecao inexistente: query layer usa JSON atual;
- JSON invalido: erro registrado em `readErrors`;
- arquivos originais nao sao removidos;
- API atual nao e alterada;
- `memory/` e `runtime-data/` continuam como fonte primaria nesta V1.

## Governanca

A V1 segue os gates enterprise:

- modulo isolado em `database/`;
- interface de adapter desacoplada;
- mirror append-only;
- JSON primario preservado;
- relatorios auditaveis;
- fallback documentado;
- sem alteracao em PromoClub007;
- sem alteracao nas automacoes atuais.

## Riscos

- filesystem-db ainda nao e banco transacional.
- JSONL local nao resolve concorrencia entre processos.
- Mirror mode usa idempotencia para novas execucoes, mas duplicatas legadas nao sao removidas.
- Nao ha migrations reais de schema para SQLite/PostgreSQL ainda.
- Query layer ja e consumido pela API em modo leitura com fallback JSON.
- Filtros ainda sao simples.

## Readiness

Readiness: `database-layer-v1-mirror-ready`.

A database layer esta pronta como espelho persistente inicial. O proximo passo e adicionar deduplicacao, indices, adapter SQLite e integrar a API como consumidora opcional com fallback para JSON.
