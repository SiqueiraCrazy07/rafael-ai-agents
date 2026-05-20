# Recovery Strategies

## Objetivo

Definir estrategias de recovery supervisionado.

## Retry automatico

Permitido quando:

- falha e transitoria;
- criticidade low/medium;
- limite de retry nao foi excedido;
- nao ha efeito colateral destrutivo;
- existe log suficiente.

## Retry com validacao humana

Obrigatorio quando:

- criticidade high;
- etapa escreve cache, publica ou altera dados;
- falha pode duplicar efeitos;
- contexto esta incompleto.

## Recovery por checkpoint

Usar quando:

- existe checkpoint valido;
- etapa falhou apos checkpoint;
- recovery nao repete acao destrutiva;
- estado pode ser reconstruido.

## Recovery parcial

Recupera apenas etapa afetada.

Exemplos:

- reprocessar uma fonte;
- regenerar cache;
- validar novamente links;
- repetir QA.

## Recovery total

Reexecuta workflow inteiro.

Usar apenas quando:

- workflow e idempotente;
- nao houve publish/deploy;
- entrada ainda e valida;
- risco e controlado.

## Fallback operacional

Fallbacks:

- usar ultimo cache valido;
- bloquear publish;
- manter deploy anterior;
- retornar estado vazio controlado;
- pedir input humano;
- abrir incidente.
