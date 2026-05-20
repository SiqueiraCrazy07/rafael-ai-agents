# Runtime Storage

## Objetivo

Documentar a persistencia local do Runtime Execution Engine V1.

## Persistencia local

A V1 usa arquivos JSON locais em:

```text
runtime-data/
```

Essa escolha reduz complexidade inicial e permite validar o modelo operacional antes de migrar para banco.

## Estrutura

```text
runtime-data/
  executions/
  checkpoints/
  history/
  events/
```

## Executions

Pasta:

```text
runtime-data/executions/
```

Contem um JSON por execution object:

```text
<executionId>.json
```

## Checkpoints

Pasta:

```text
runtime-data/checkpoints/
```

Organizacao:

```text
runtime-data/checkpoints/<executionId>/<checkpointId>.json
```

Cada checkpoint contem snapshot operacional da execucao.

## History

Pasta:

```text
runtime-data/history/
```

Contem timeline operacional consolidada por execucao.

## Events

Pasta:

```text
runtime-data/events/
```

Eventos sao gravados em JSON Lines:

```text
<executionId>.jsonl
```

## Replay futuro

A estrutura atual prepara replay futuro porque preserva:

- execution object;
- logs;
- checkpoints;
- timeline;
- outputs;
- riscos;
- status final.

Replay executavel ainda nao existe na V1.

## Evolucao futura para banco

Proxima evolucao:

- SQLite para runtime local;
- PostgreSQL para multi-projeto;
- tabela de executions;
- tabela de events;
- tabela de checkpoints;
- tabela de histories;
- indices por projeto, workflow, status e data.

## Regras de seguranca

- Nao armazenar secrets.
- Nao armazenar dumps de producao.
- Nao armazenar dados pessoais sem necessidade.
- Nao usar runtime-data como fonte publica.
- Limpar ou arquivar historico antigo quando necessario.
