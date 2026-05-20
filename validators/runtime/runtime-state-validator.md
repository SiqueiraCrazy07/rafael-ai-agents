# Runtime State Validator

## Objetivo

Validar estados e transicoes do runtime.

## Transicoes validas

- `queued -> routed`
- `routed -> running`
- `running -> waiting_input`
- `waiting_input -> running`
- `running -> blocked`
- `running -> failed`
- `running -> validated`
- `validated -> completed`
- `failed -> retrying`
- `retrying -> running`
- `failed -> rolled_back`
- `blocked -> waiting_input`

## Transicoes invalidas

- `queued -> completed`
- `completed -> running`
- `rolled_back -> running`
- `failed -> completed`
- `blocked -> completed`
- `validated -> queued`

## Estados orfaos

Estados orfaos ocorrem quando:

- execucao fica em `queued` sem router;
- execucao fica em `waiting_input` sem owner;
- execucao fica em `blocked` sem motivo;
- execucao fica em `retrying` sem contador.

## Deadlocks

Detectar deadlock quando:

- dois agentes aguardam handoff um do outro;
- execucao espera input sem responsavel;
- workflow exige validacao de agente inexistente;
- bloqueio nao possui condicao de saida.

## Loops

Detectar loop quando:

- `running -> failed -> retrying -> running` excede limite;
- handoff volta repetidamente para o mesmo agente;
- validacao falha sem mudar input.

## Retries invalidos

Retries invalidos:

- retry sem erro anterior;
- retry sem contador;
- retry acima do limite;
- retry critical sem validacao humana;
- retry sem checkpoint em high.
