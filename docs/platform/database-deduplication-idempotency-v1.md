# Database Deduplication + Idempotency V1

## Objetivo

Adicionar deduplicacao e idempotencia ao filesystem-db para evitar duplicacao de registros quando mirrors forem executados repetidamente.

## Componentes

Arquivos atualizados:

- `database/adapters/filesystem-db-adapter.js`
- `database/adapters/database-adapter.js`
- `database/repositories/base-repository.js`
- `database/repositories/mirror-service.js`
- `database/demo/database-idempotency-demo.js`

## Estrategia

O adapter agora suporta `upsert`.

Cada registro recebe:

- `idempotencyKey`;
- `dedupeKey`;
- `recordHash`;
- metadata `_db.upserted`.

O `recordHash` usa SHA-256 sobre uma serializacao estavel do registro, ignorando metadata `_db` e campos de origem fisica como `sourcePath` e `fileName`.

## Chaves Logicas

Chaves por colecao:

- `events`: `eventId`;
- `decisions`: `decisionId`, `decisionReportId` ou `reportId`;
- `transitions`: `transitionId`, `transitionReportId` ou `workflow + toState`;
- `runtime_validation`: `validationId` ou `reportId`;
- `api_governance_audit`: `requestId + timestamp`;
- `workflow_state`: `machineId + workflowId + updatedAt/timestamp`;
- `queue`: `simulationId`, `queueReportId` ou `reportId` combinado com workflow/queueItemId quando existir.

Quando nao existe chave logica confiavel, o adapter preserva append-only e marca o registro como nao idempotente.

## Mirror Mode

O mirror usa `repository.upsert()` quando disponivel.

Metricas retornadas:

- `insertedRecords`;
- `updatedRecords`;
- `skippedDuplicates`;
- `appendOnlyRecords`.

A segunda execucao do mesmo mirror deve manter o total de linhas estavel para registros com chave logica.

## Persistencia

Relatorios do demo sao persistidos em:

- `runtime-data/database-idempotency/`;
- `memory/database-idempotency/`.

## Script

```bash
npm run db:idempotency-demo
```

O demo:

1. mede contagem inicial das tabelas;
2. executa mirror;
3. mede contagem apos a primeira execucao;
4. executa mirror novamente;
5. prova que a segunda execucao nao duplica linhas;
6. imprime metricas de idempotencia.

## Fallback Seguro

Garantias:

- JSONs originais nao sao removidos;
- dados existentes nao sao apagados;
- duplicatas historicas permanecem preservadas;
- quando nao ha chave logica confiavel, append-only continua ativo;
- database indisponivel continua retornando fallback seguro;
- API e runtime continuam readonly sobre esta camada.

## Riscos

- filesystem-db ainda nao e transacional.
- updates reescrevem o arquivo JSONL da tabela quando um hash muda.
- duplicatas legadas nao sao compactadas nesta V1.
- chaves logicas dependem da qualidade dos identificadores nos reports antigos.
- concorrencia entre processos ainda nao possui lock transacional.

## Readiness

Readiness: `database-deduplication-idempotency-v1-ready`.

A database layer agora evita duplicacao em mirrors repetidos quando existe chave logica confiavel, preservando fallback append-only para formatos incertos.
