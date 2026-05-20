# Runtime Architecture

## Objetivo

Definir a arquitetura do runtime operacional do rafael-ai-agents.

O runtime e a camada que acompanha execucoes reais ou semi-automatizadas, registrando estado, fila, contexto, checkpoints, historico, outputs, riscos e recuperacao.

## Runtime engine

O runtime engine e o componente conceitual responsavel por:

- criar execucoes;
- receber tarefas da fila;
- associar projeto, workflow e agentes;
- acompanhar estado;
- registrar logs;
- criar checkpoints;
- controlar retries;
- bloquear execucoes criticas;
- acionar recovery ou rollback quando necessario.

Nesta fase, o engine e documentado como arquitetura. Implementacao futura pode ser feita em Node.js, banco e workers.

## Execution flow

Fluxo recomendado:

```text
request
  -> queue
  -> router
  -> execution object
  -> context load
  -> agent/workflow execution
  -> checkpoint
  -> validation
  -> output
  -> history
  -> completed | failed | rollback
```

## Runtime state

Estado representa a situacao atual de uma execucao.

Estados padrao:

- `queued`
- `routed`
- `running`
- `waiting_input`
- `blocked`
- `retrying`
- `validated`
- `completed`
- `failed`
- `rolled_back`

## Checkpoints

Checkpoints registram estado antes ou depois de etapas importantes.

Usar antes de:

- publish;
- deploy;
- alteracao de schema;
- handoff critico;
- execucao com risco high ou critical;
- retry apos falha.

## Recovery

Recovery busca retomar uma execucao sem repetir etapas perigosas.

Regras:

- recuperar contexto do ultimo checkpoint valido;
- nao repetir etapa destrutiva automaticamente;
- registrar tentativa de recovery;
- escalar para validacao humana se high/critical.

## Rollback

Rollback reverte ou neutraliza efeitos de uma execucao.

Obrigatorio quando:

- dados incorretos foram publicados;
- deploy quebrou fluxo critico;
- cache foi corrompido;
- credencial foi exposta;
- workflow causou impacto operacional relevante.

## Persistencia operacional

Persistir:

- execution object;
- logs estruturados;
- checkpoints;
- decisoes;
- riscos;
- outputs;
- status final.

Nao persistir:

- tokens;
- secrets;
- dados sensiveis;
- dumps volumosos;
- contexto temporario irrelevante.
