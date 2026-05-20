# Runtime Validation

## Objetivo

Definir validacao operacional do runtime, contratos, estados, replay e tracing.

## Validacao operacional

Validar se uma execucao possui:

- executionId;
- projeto;
- workflow;
- agentes;
- status;
- logs;
- checkpoints;
- outputs;
- riscos.

## Runtime integrity

Validar:

- schema do execution object;
- status valido;
- retries dentro do limite;
- checkpoints coerentes;
- logs estruturados.

## State integrity

Validar:

- transicoes permitidas;
- estados sem owner;
- deadlocks;
- loops;
- estados finais corretos.

## Contract integrity

Validar:

- inputs obrigatorios;
- outputs obrigatorios;
- compatibilidade com agente;
- compatibilidade com workflow;
- status operacional.

## Replay validation

Replay deve confirmar:

- mesma entrada gera mesmo caminho esperado;
- falhas sao reproduziveis;
- checkpoints recuperam estado;
- rollback usa checkpoint correto.

## Tracing

Trace minimo:

```text
executionId -> project -> workflow -> agents -> states -> checkpoints -> outputs -> result
```

Tracing deve permitir depurar falha sem reler todo o repositorio.
