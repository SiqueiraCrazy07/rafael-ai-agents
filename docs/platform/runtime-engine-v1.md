# Runtime Engine V1

## Objetivo

Implementar um runtime funcional minimo para agentes e workflows operacionais.

A V1 transforma a arquitetura documental em execucao local rastreavel, com execution objects reais, state machine, event bus, checkpoints, historico e telemetry.

## Arquitetura

```text
engine/
  runtime/
  state/
  events/
  checkpoints/
  executions/
  history/
  storage/
  telemetry/

runtime-data/
  executions/
  checkpoints/
  history/
  events/
```

## Componentes

### RuntimeEngine

Arquivo:

```text
engine/runtime/runtime-engine.js
```

Responsavel por:

- iniciar execucoes;
- aplicar transicoes;
- criar checkpoints;
- iniciar retries;
- executar rollback;
- completar ou falhar execucoes;
- gerar historico;
- gerar telemetry.

### ExecutionManager

Arquivo:

```text
engine/executions/execution-manager.js
```

Responsavel por:

- criar execution objects;
- gerar `executionId`;
- registrar metadata;
- adicionar logs;
- persistir execucoes.

### StateMachine

Arquivo:

```text
engine/state/state-machine.js
```

Responsavel por:

- listar estados validos;
- declarar transicoes permitidas;
- bloquear transicoes invalidas.

### EventBus

Arquivo:

```text
engine/events/event-bus.js
```

Eventos suportados:

- `execution_started`;
- `execution_completed`;
- `execution_failed`;
- `state_transition`;
- `checkpoint_created`;
- `retry_started`;
- `rollback_triggered`.

### CheckpointManager

Arquivo:

```text
engine/checkpoints/checkpoint-manager.js
```

Responsavel por:

- criar checkpoints;
- salvar snapshots;
- recuperar checkpoints;
- listar checkpoints;
- validar integridade minima.

### FileRuntimeStorage

Arquivo:

```text
engine/storage/file-runtime-storage.js
```

Persistencia local em JSON.

### RuntimeTelemetry

Arquivo:

```text
engine/telemetry/runtime-telemetry.js
```

Gera resumo operacional:

- duracao;
- falhas;
- retries;
- checkpoints;
- outputs;
- status final.

## Execution lifecycle

Fluxo feliz:

```text
queued -> routed -> running -> validated -> completed
```

Fluxo com retry:

```text
running -> failed -> retrying -> running
```

Fluxo com rollback:

```text
running -> failed -> rolled_back
```

## Demo

Comando:

```bash
npm run runtime:demo
```

O demo cria:

- uma execucao concluida com retry;
- uma execucao com rollback;
- execution objects em `runtime-data/executions`;
- checkpoints em `runtime-data/checkpoints`;
- historico em `runtime-data/history`;
- eventos em `runtime-data/events`.

## Limitacoes da V1

- Nao executa workflows reais automaticamente.
- Nao integra ainda com o router.
- Nao valida JSON Schema com biblioteca externa.
- Nao possui fila real.
- Nao possui workers distribuidos.
- Nao possui lock de concorrencia.
- Nao possui replay executavel.
- Nao aciona AI Supervisor automaticamente.

## Compatibilidade

A V1 e compativel com:

- `registry/`;
- `runtime/`;
- `orchestrator/`;
- `simulation/`;
- `validators/`;
- `supervisor/`;
- `self-healing/`.

Ela nao altera automacoes atuais nem workflows existentes.
