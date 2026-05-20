# Checkpoint Recovery

## Objetivo

Definir recovery baseado em checkpoints e snapshots.

## Recovery baseado em snapshots

Usar snapshot para reconstruir:

- estado;
- contexto;
- outputs parciais;
- arquivos gerados;
- riscos;
- ultima etapa valida.

## Restauracao contextual

Restaurar:

- projeto;
- workflow;
- agente atual;
- input;
- logs relevantes;
- checkpoints;
- decisoes.

## Replay parcial

Reexecutar apenas etapas posteriores ao checkpoint.

Permitido quando:

- etapas sao idempotentes;
- nao houve efeito externo destrutivo;
- input permanece valido.

## Retomada segura

Antes de retomar:

- validar checkpoint;
- validar contrato;
- validar criticidade;
- verificar bloqueios;
- exigir humano quando high/critical.
