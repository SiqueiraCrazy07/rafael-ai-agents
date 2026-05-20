# Checkpoint Strategy

## Objetivo

Definir estrategia de checkpoints, snapshots, retry, recovery e rollback.

## Snapshots

Snapshots representam captura de estado em um momento.

Podem conter:

- execution object;
- status;
- inputs;
- outputs parciais;
- arquivos gerados;
- hash de artefatos;
- resumo de contexto;
- riscos.

Nao devem conter:

- secrets;
- credenciais;
- dados sensiveis;
- dumps volumosos.

## Quando criar checkpoint

- antes de publish;
- antes de deploy;
- antes de mudanca de schema;
- antes de etapa high/critical;
- depois de validacao importante;
- antes de retry;
- antes de rollback.

## Rollback

Rollback deve usar o ultimo checkpoint seguro.

Tipos:

- rollback de arquivo;
- rollback de cache;
- rollback de deploy;
- rollback logico por bloqueio de publicacao;
- rollback manual documentado.

## Recovery

Recovery deve tentar retomar sem repetir efeitos colaterais.

Regras:

- nao repetir escrita externa sem idempotencia;
- nao publicar novamente sem validar;
- nao ignorar erro anterior;
- registrar tentativa.

## Retry

Retries devem ser limitados.

- low/medium: maximo 3;
- high: maximo 2;
- critical: exige validacao humana.

## Validacao intermediaria

Antes de continuar:

- verificar schema;
- verificar logs;
- verificar saida;
- verificar risco;
- verificar bloqueios de governanca.

## Recuperacao apos falha

1. Marcar execucao como `failed`.
2. Criar checkpoint de falha.
3. Classificar criticidade.
4. Definir retry, blocked ou rollback.
5. Registrar incidente se high/critical.
