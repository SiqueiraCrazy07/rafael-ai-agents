# Retry Strategy

## Objetivo

Definir estrategia segura de retries.

## Exponential backoff

Usar atrasos crescentes:

```text
1 tentativa: 30s
2 tentativa: 2min
3 tentativa: 5min
```

Valores reais devem ser definidos conforme workflow.

## Retry limits

- low: ate 3;
- medium: ate 3;
- high: ate 2 com checkpoint;
- critical: sem retry automatico.

## Retry isolation

Cada retry deve isolar:

- input;
- logs;
- tentativa;
- erro anterior;
- checkpoint;
- output.

## Retry safety

Nao fazer retry automatico quando:

- acao nao e idempotente;
- efeito externo ja ocorreu;
- credencial falhou por permissao;
- schema esta invalido;
- falha e critical.

## Retry validation

Apos retry:

- validar saida;
- comparar com erro anterior;
- registrar resultado;
- bloquear se erro persistir.
