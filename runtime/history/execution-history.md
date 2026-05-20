# Execution History

## Objetivo

Definir como registrar historico de execucoes, logs estruturados, trilha operacional, rastreabilidade e replay futuro.

## Logs estruturados

Formato recomendado:

```json
{
  "timestamp": "2026-05-11T00:00:00.000Z",
  "executionId": "exec_001",
  "project": "promoclub007",
  "workflow": "offers-publish",
  "agent": "site-backend-agent",
  "event": "checkpoint_created",
  "status": "running",
  "message": "Cache validated before publish"
}
```

## Historico de execucao

Cada execucao deve registrar:

- inicio;
- fim;
- agentes;
- workflow;
- status;
- logs;
- checkpoints;
- decisoes;
- outputs;
- riscos;
- validacoes.

## Trilha operacional

Trilha minima:

```text
queue -> routing -> running -> checkpoint -> validation -> output -> completed
```

Ou em falha:

```text
queue -> routing -> running -> failed -> retrying|blocked|rolled_back
```

## Rastreabilidade

Cada output deve ser rastreavel ate:

- entrada;
- agente;
- workflow;
- projeto;
- checkpoint;
- decisao;
- log.

## Replay futuro

Replay deve permitir simular ou reexecutar uma execucao com os mesmos inputs.

Pre-condicoes:

- inputs persistidos;
- versao de workflow conhecida;
- versao de agente conhecida;
- contexto relevante preservado;
- efeitos colaterais isolados.

Replay de producao deve exigir validacao humana.
