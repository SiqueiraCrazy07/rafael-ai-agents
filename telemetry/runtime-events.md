# Runtime Events

## Objetivo

Definir eventos padronizados emitidos pelo runtime operacional.

## Eventos

### execution_started

Emitido quando uma execucao comeca.

Campos recomendados:

- `executionId`;
- `project`;
- `workflow`;
- `agents`;
- `timestamp`.

### execution_failed

Emitido quando uma execucao falha.

Campos:

- `executionId`;
- `project`;
- `workflow`;
- `error`;
- `failedStep`;
- `riskLevel`.

### execution_completed

Emitido quando uma execucao termina com sucesso.

Campos:

- `executionId`;
- `project`;
- `workflow`;
- `durationMs`;
- `outputs`.

### checkpoint_created

Emitido quando um checkpoint e criado.

Campos:

- `executionId`;
- `checkpointId`;
- `status`;
- `artifacts`.

### rollback_triggered

Emitido quando rollback e iniciado.

Campos:

- `executionId`;
- `reason`;
- `riskLevel`;
- `checkpointId`.

### retry_started

Emitido quando retry comeca.

Campos:

- `executionId`;
- `attempt`;
- `maxAttempts`;
- `failedStep`.

### validation_failed

Emitido quando uma validacao falha.

Campos:

- `executionId`;
- `validator`;
- `errors`;
- `blocked`.

### agent_handoff

Emitido quando uma execucao passa de um agente para outro.

Campos:

- `executionId`;
- `fromAgent`;
- `toAgent`;
- `handoffSummary`;
- `status`.

### queue_timeout

Emitido quando uma execucao fica tempo demais na fila.

Campos:

- `executionId`;
- `project`;
- `priority`;
- `queuedAt`;
- `timeoutAt`.
