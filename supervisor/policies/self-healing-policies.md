# Self-Healing Policies

## Objetivo

Definir politicas para retry, rollback, bloqueio, escalonamento e validacao humana.

## Quando retry e permitido

Permitido quando:

- erro e transitorio;
- criticidade low/medium;
- limite nao foi excedido;
- nao ha efeito colateral destrutivo;
- checkpoint nao e obrigatorio ou ja existe.

## Quando rollback e obrigatorio

Obrigatorio quando:

- dados incorretos foram publicados;
- cache foi corrompido;
- deploy quebrou fluxo critico;
- credencial foi exposta;
- execucao critical falhou apos efeito externo.

## Quando bloquear

Bloquear quando:

- contrato invalido;
- contexto ausente;
- agente incompativel;
- retry maximo excedido;
- QA falhou;
- risco high/critical sem humano;
- checkpoint ausente antes de etapa critica.

## Quando escalar

Escalar para humano quando:

- high ou critical;
- rollback necessario;
- conflito entre agentes;
- risco de producao;
- incidente recorrente;
- falha sem recovery path.

## Quando exigir humano

Obrigatorio para:

- producao;
- secrets;
- banco;
- deploy high/critical;
- bypass de QA;
- rollback;
- mudanca de schema.
