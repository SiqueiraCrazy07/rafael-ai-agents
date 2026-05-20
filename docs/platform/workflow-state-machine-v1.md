# Workflow State Machine V1

## Objetivo

Criar uma state machine formal para controlar o lifecycle operacional dos workflows no runtime.

A V1 e isolada do runtime funcional atual. Ela valida transicoes, bloqueia transicoes invalidas, registra historico e persiste snapshots em `runtime-data/state-machine/` e `memory/state-machine/`.

## Arquivos

- `runtime/state-machine/workflow-state-machine.js`
- `runtime/state-machine/workflow-state-demo.js`

Script:

```bash
npm run runtime:state-demo
```

## Estados

- `pending`
- `queued`
- `protected`
- `throttled`
- `paused`
- `human-review`
- `rerouted`
- `retrying`
- `recovering`
- `completed`
- `failed`
- `blocked`
- `quarantined`

## Transicoes Validas

Resumo das transicoes:

- `pending` -> `queued`, `blocked`
- `queued` -> `protected`, `throttled`, `paused`, `human-review`, `rerouted`, `retrying`, `recovering`, `completed`, `failed`, `blocked`
- `protected` -> `human-review`, `queued`, `paused`, `rerouted`, `blocked`
- `throttled` -> `queued`, `paused`, `human-review`, `blocked`
- `paused` -> `human-review`, `queued`, `rerouted`, `recovering`, `blocked`, `quarantined`
- `human-review` -> `queued`, `protected`, `rerouted`, `recovering`, `blocked`, `quarantined`
- `rerouted` -> `queued`, `retrying`, `recovering`, `completed`, `failed`, `blocked`
- `retrying` -> `queued`, `rerouted`, `recovering`, `completed`, `failed`
- `recovering` -> `queued`, `rerouted`, `retrying`, `completed`, `failed`, `quarantined`
- `blocked` -> `human-review`, `recovering`, `quarantined`, `failed`
- `quarantined` -> `human-review`, `failed`
- `completed` -> terminal
- `failed` -> `retrying`, `recovering`, `quarantined`

## Transicoes Bloqueadas

A state machine bloqueia:

- estado atual invalido;
- estado alvo invalido;
- transicao que nao esteja na tabela de transicoes validas;
- entrada em estado critico sem `reason`;
- entrada em estado critico sem `safetyMode`;
- entrada em estado temporario sem `expiresAt`.

Transicoes bloqueadas sao registradas em `blockedTransitions` sem alterar o estado atual.

## Estados Criticos

Estados criticos exigem `reason` e `safetyMode`:

- `protected`
- `paused`
- `human-review`
- `recovering`
- `blocked`
- `quarantined`

## Estados Temporarios

Estados temporarios exigem `expiresAt`:

- `protected`
- `throttled`
- `paused`
- `human-review`
- `retrying`
- `recovering`

## Integracao com Decision Engine

O demo le o relatorio mais recente em `memory/decisions/` e mapeia decisoes declarativas para estados:

- `pause-critical-workflow` -> `paused`
- `reroute-agent-worker` -> `rerouted`
- `reduce-concurrency` -> `throttled`
- `apply-throttling` -> `throttled`
- `protected-queue` -> `protected`
- `retry-strategy` -> `retrying`
- `preventive-recovery` -> `recovering`
- `human-gate` -> `human-review`
- `normal-execution` -> `queued`

As decisoes fornecem `reason`, `safetyMode` e `expiresAt` quando o estado exige.

## Persistencia

Snapshots sao gravados em:

- `runtime-data/state-machine/`
- `memory/state-machine/`

Cada snapshot contem:

- `machineId`
- `workflow`
- `project`
- estado atual
- `history`
- `blockedTransitions`

## Fallback Seguro

Fallbacks:

- se `memory/decisions/` nao existir, o demo executa apenas a transicao manual para `queued`;
- se o JSON de decisao estiver invalido, o erro e registrado em `readErrors`;
- transicoes invalidas nao alteram o estado atual;
- a V1 nao altera Router, Queue, Recovery ou runtime funcional atual.

## Compatibilidade com Governanca

A V1 segue os gates enterprise:

- modulo isolado em `runtime/state-machine/`;
- persistencia append-only em `memory/` e `runtime-data/`;
- historico auditavel de transicoes;
- fallback para fonte ausente ou invalida;
- compatibilidade retroativa com runtime existente;
- sem alteracao em projetos ou automacoes atuais.

## Proximos Passos

- Fazer Queue e Router emitirem eventos para a state machine.
- Fazer Decision Engine consumir o estado atual antes de gerar novas decisoes.
- Adicionar expiracao ativa para estados temporarios.
- Criar testes automatizados para cada transicao valida e bloqueada.
- Definir politica de quarentena por projeto e por workflow.
