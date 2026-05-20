# Event Bus V1

## Objetivo

Criar uma camada de eventos desacoplada para comunicacao entre Runtime, Queue, Router, Decision Engine, State Machine, Recovery e Supervisor.

A V1 e local, append-only e governada: publica eventos em memoria do processo, persiste cada evento em `runtime-data/events/` e `memory/events/`, permite subscribers e suporta replay a partir do historico persistido.

## Arquivos

- `runtime/event-bus/runtime-event-bus.js`
- `runtime/event-bus/runtime-event-demo.js`

Script:

```bash
npm run runtime:event-demo
```

## Capacidades

- `publish`
- `subscribe`
- `unsubscribe`
- `replay`
- persistence
- event history

## Eventos Obrigatorios

- `workflow-created`
- `workflow-queued`
- `workflow-paused`
- `workflow-rerouted`
- `workflow-throttled`
- `workflow-recovering`
- `workflow-completed`
- `workflow-failed`
- `workflow-quarantined`
- `decision-created`
- `enforcement-applied`
- `recovery-triggered`

## Contrato de Evento

Cada evento contem:

- `eventId`
- `type`
- `source`
- `workflowId`
- `project`
- `timestamp`
- `payload`
- `safetyMode`
- `correlationId`

## Persistencia

Cada publish grava o evento em:

- `runtime-data/events/`
- `memory/events/`

O filename usa timestamp, tipo de evento e `eventId`.

## Integracoes V1

### Runtime Decision Engine

`runtime:decision-demo` publica `decision-created` para cada decisao gerada.

### Workflow State Machine

`runtime:state-demo` publica eventos de lifecycle derivados do historico da state machine:

- criacao;
- queued;
- rerouted;
- recovering;
- completed;
- failed/quarantined quando ocorrerem.

### Transition Coordinator

`runtime:transition-demo` publica eventos derivados das transicoes aplicadas automaticamente:

- `workflow-paused`;
- `workflow-rerouted`;
- `workflow-throttled`;
- `workflow-recovering`;
- `workflow-quarantined`;
- `workflow-completed`;
- `workflow-failed`;
- `enforcement-applied` para protected queue, retry strategy e human gate.

## Replay

`replay` pode filtrar por:

- `eventType`;
- `correlationId`;
- `workflowId`.

Por padrao, o replay le `memory/events/` para incluir eventos persistidos entre execucoes.

## Fallback Seguro

Fallbacks:

- evento sem tipo valido e rejeitado com erro claro;
- subscriber com erro nao interrompe publish;
- erro de subscriber e registrado em `deliveryErrors`;
- sem eventos persistidos, replay retorna historico em memoria;
- Event Bus nao executa efeitos de runtime por conta propria.

## Compatibilidade com Governanca

A V1 segue os gates enterprise:

- modulo isolado em `runtime/event-bus/`;
- persistencia append-only;
- eventos com source, payload, safetyMode e correlationId;
- sem alteracao em projetos;
- sem alteracao nas automacoes atuais;
- sem dependencia circular com Runtime, Queue, Router, Recovery ou Supervisor.

## Riscos

- Event Bus e local ao processo; ainda nao ha broker distribuido.
- Nao ha schema validator dedicado por tipo de evento.
- Nao ha compactacao de historico.
- Replay usa arquivos locais em `memory/events/`.

## Proximos Passos

- Criar validador de schema por evento.
- Fazer Queue, Router e Recovery publicarem eventos diretamente.
- Adicionar snapshots de subscriber delivery.
- Criar projection de timeline por workflow.
- Evoluir para broker distribuido quando houver multiplos processos reais.
