# Failure Analysis Engine

## Objetivo

Definir como o supervisor classifica e analisa falhas operacionais.

## Falhas recuperaveis

Falhas que podem receber retry ou recovery controlado:

- timeout transitorio;
- API externa temporariamente indisponivel;
- erro de rede;
- arquivo de cache ausente antes de publish;
- validacao falhou por input incompleto corrigivel;
- fila temporariamente congestionada.

## Falhas criticas

Falhas que exigem bloqueio, rollback ou humano:

- credencial exposta;
- dados incorretos publicados;
- cache corrompido;
- deploy com regressao critica;
- schema quebrado;
- perda de rastreabilidade;
- alteracao em producao sem validacao.

## Loops

Detectar quando:

- mesmos agentes fazem handoff repetido;
- retry nao altera input;
- QA devolve para o mesmo agente sem novo contexto;
- workflow retorna ao mesmo estado mais de N vezes.

## Deadlocks

Detectar quando:

- execucao espera input sem owner;
- dois agentes aguardam acao um do outro;
- gate humano e obrigatorio mas nao foi atribuido;
- workflow exige dependencia ausente.

## Retries excessivos

Sinais:

- tentativas acima do limite;
- retry critical sem humano;
- retry sem checkpoint;
- retry em erro nao transitorio.

## Handoffs invalidos

Detectar:

- agente destino fora do registry;
- agente destino incompativel com projeto;
- contexto minimo ausente;
- criticidade sem gate correspondente;
- permissao insuficiente.

## Queue starvation

Detectar:

- tarefas `p2` ou `p3` nunca executadas;
- uma fila de projeto monopoliza workers;
- prioridade nao envelhece;
- tarefas `p1` ficam acima do SLA.
