# Runtime State Model

## Objetivo

Definir os estados operacionais de uma execucao no runtime.

## queued

A execucao entrou na fila, mas ainda nao foi roteada.

## routed

A execucao foi associada a projeto, workflow, agente primario e criticidade.

## running

A execucao esta em andamento.

## waiting_input

A execucao depende de entrada humana, contexto adicional, credencial, arquivo ou decisao.

## blocked

A execucao foi bloqueada por regra de governanca, risco, falha de validacao ou dependencia externa.

## retrying

A execucao esta tentando novamente uma etapa falha dentro do limite permitido.

## validated

A execucao ou etapa passou por validacao obrigatoria.

## completed

A execucao terminou com sucesso e outputs registrados.

## failed

A execucao falhou e nao foi recuperada automaticamente.

## rolled_back

A execucao teve rollback concluido ou registrado como acao de contencao.

## Transicoes recomendadas

```text
queued -> routed -> running -> validated -> completed
queued -> routed -> running -> waiting_input -> running
running -> blocked
running -> failed
failed -> retrying -> running
failed -> rolled_back
blocked -> waiting_input -> running
```

Transicoes high/critical devem registrar decisao ou incidente quando houver impacto.
