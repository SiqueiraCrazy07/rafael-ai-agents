# Runtime Supervisor

## Objetivo

Definir como o AI Supervisor monitora o runtime operacional.

## Monitoramento de runtime

O supervisor deve observar:

- execucoes ativas;
- estado atual;
- tempo em cada estado;
- retries;
- checkpoints;
- handoffs;
- logs;
- riscos;
- outputs.

## Analise de estados

Estados monitorados:

- `queued`;
- `routed`;
- `running`;
- `waiting_input`;
- `blocked`;
- `retrying`;
- `validated`;
- `completed`;
- `failed`;
- `rolled_back`.

Sinais de risco:

- execucao presa em `queued`;
- execucao em `retrying` acima do limite;
- `running` sem logs recentes;
- `waiting_input` sem owner;
- `blocked` sem motivo;
- `failed` sem recovery path.

## Deteccao de anomalias

Anomalias:

- tempo de execucao acima do esperado;
- volume anormal de falhas;
- queda brusca de outputs;
- handoff repetido;
- checkpoint ausente antes de etapa critica;
- retry sem mudanca de input;
- fila crescendo sem consumo.

## Supervisao de workflows

O supervisor acompanha:

- workflow esperado;
- agentes participantes;
- gates;
- validacoes;
- status final;
- incidentes;
- rollback.

## Classificacao de risco

- `low`: impacto documental ou sem efeito externo;
- `medium`: impacto operacional limitado;
- `high`: risco para dados, cache, frontend, deploy ou automacao;
- `critical`: risco para producao, credenciais, banco, receita ou seguranca.

High e critical exigem validacao humana antes de recovery destrutivo ou rollback em producao.
