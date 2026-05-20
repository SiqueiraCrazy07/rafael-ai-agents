# Transactional Database Adapter V1

## Objetivo

Transactional Database Adapter V1 adiciona uma camada SQLite transacional ao Rafael AI Agents sem remover ou substituir o `filesystem-db`.

A V1 e additive: filesystem-db continua funcionando, mirror mode permanece obrigatorio e JSON fallback segue preservado.

## Arquivos

- `database/adapters/sqlite-adapter.js`
- `database/adapters/transaction-manager.js`
- `database/adapters/database-migration-manager.js`
- `database/adapters/database-checkpoint-manager.js`
- `database/adapters/database-rollback-manager.js`
- `database/adapters/database-health-monitor.js`
- `database/demo/sqlite-transaction-demo.js`

## Estrategia Transacional

O adapter usa `node:sqlite` quando disponivel no runtime Node local.

Caracteristicas:

- banco local em `runtime-data/database/sqlite/rafael-ai-agents.sqlite`;
- Windows-compatible;
- `readonlySafe=true` por padrao;
- operacoes append/upsert, sem deletes destrutivos;
- prepared statements;
- `BEGIN IMMEDIATE TRANSACTION`;
- `COMMIT`;
- `ROLLBACK`;
- timeout no `TransactionManager`;
- fallback seguro quando SQLite estiver indisponivel.

## Schema Inicial

Tabelas:

- `records`: registros por collection com `dedupe_key`, `record_hash` e payload JSON;
- `schema_migrations`: versoes aplicadas e rollback metadata;
- `transaction_audit`: trilha de transacoes;
- `checkpoints`: snapshots e consistency markers;
- `rollback_audit`: planos e auditorias de rollback;
- `integration_metadata`: metadata de integracao.

## Migration Manager

Controla:

- schema version;
- migration audit;
- rollback metadata;
- migrations idempotentes.

Rollback de schema e declarativo nesta V1 e exige human gate para restauracao real.

## Checkpoint Manager

Cria checkpoint local:

- copia do arquivo SQLite quando disponivel;
- marker de consistencia;
- contagem de registros;
- versao de migration;
- restore metadata.

Restore real nao e executado automaticamente nesta V1.

## Rollback Manager

Cria planos declarativos de rollback com:

- target;
- motivo;
- passos;
- human gate obrigatorio;
- auditoria em `rollback_audit`;
- `destructiveRollback=false`.

## Health Monitor

Executa:

- `PRAGMA integrity_check`;
- `PRAGMA quick_check`;
- lock probe seguro;
- collection counts;
- latency metrics;
- corruption detection;
- locked database detection.

## Compatibilidade Retroativa

Mantido:

- `database/adapters/filesystem-db-adapter.js`;
- `runtime-data/database/tables/*.jsonl`;
- repositories atuais;
- mirror mode;
- JSON fallback;
- API atual sem breaking change.

O SQLite Adapter pode receber os mesmos repositories via `createRepositories(adapter)`.

## Integracoes

- API: segue usando database read opcional e fallback JSON.
- Workers: reports continuam mirror-compatible.
- Scheduler: plans persistidos podem ser espelhados como records.
- Autonomous Orchestrator: audit/progress permanecem append-only e mirror-compatible.
- Dashboard: continua consumindo API/Telemetry.
- Telemetry: le `memory/database/`, onde os demos SQLite persistem relatorios.

## Persistencia

Banco:

- `runtime-data/database/sqlite/rafael-ai-agents.sqlite`

Relatorios:

- `runtime-data/database/sqlite-demo-*.json`
- `memory/database/sqlite-demo-*.json`
- `runtime-data/database/sqlite-transaction-demo-*.json`
- `memory/database/sqlite-transaction-demo-*.json`

Checkpoints:

- `runtime-data/database/checkpoints/*.sqlite`

## Scripts

```bash
npm run db:sqlite-demo
npm run db:transaction-demo
```

## Fallback Seguro

- SQLite indisponivel: reporta fallback e preserva filesystem-db/JSON.
- Transaction error: rollback automatico.
- Transaction timeout: rollback automatico.
- Locked/corrupt DB: health reporta `attention-required`.
- Rollback real: somente plano declarativo com human gate.

## Riscos

- `node:sqlite` ainda pode ser experimental conforme versao do Node.
- O adapter e local e nao resolve multi-process locking distribuido.
- Checkpoint restore real ainda nao e automatico.
- API ainda nao usa SQLite como fonte primaria unica.

## Readiness

Readiness: `transactional-database-adapter-v1-ready`.

A plataforma agora possui uma camada transacional inicial, com SQLite local, migrations, transactions, checkpoints, rollback declarativo, health monitor, mirror compatibility e fallback seguro.
