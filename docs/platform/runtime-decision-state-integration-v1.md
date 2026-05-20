# Runtime Decision -> State Machine Integration V1

## Objetivo

Integrar o Runtime Decision Engine com a Workflow State Machine de forma operacional, governada e auditavel.

A V1 e declarativa: consome decisoes persistidas, aplica apenas transicoes validas em maquinas de estado isoladas e persiste relatorios de coordenacao sem alterar Queue, Router, Recovery ou execucao funcional.

## Arquivos

- `runtime/state-machine/state-transition-coordinator.js`
- `runtime/state-machine/state-transition-demo.js`
- `runtime/state-machine/workflow-state-demo.js`

Script:

```bash
npm run runtime:transition-demo
```

## Fontes Consumidas

O coordinator le o relatorio mais recente em:

- `memory/decisions/`

Se a fonte estiver ausente ou ilegivel, nenhuma transicao e aplicada e o fallback e registrado.

## Regras de Mapeamento

- workflow critico pausado: `pause-critical-workflow` -> `paused`
- throttling: `apply-throttling` e `reduce-concurrency` -> `throttled`
- human gate: `human-gate` -> `human-review`
- reroute: `reroute-agent-worker` -> `rerouted`
- preventive recovery: `preventive-recovery` -> `recovering`
- protected queue: `protected-queue` -> `protected`
- retry strategy: `retry-strategy` -> `retrying`
- normal execution: `normal-execution` -> `queued`

## Aplicacao de Transicoes

Para cada decisao mapeada, o coordinator:

- cria uma `WorkflowStateMachine` isolada;
- move `pending -> queued` como bootstrap;
- aplica a transicao derivada da decisao;
- registra `source`, `evidence`, `reason`, `safetyMode` e `expiresAt`;
- grava a maquina resultante dentro do relatorio de transicoes.

Essa estrategia evita acoplar a V1 ao estado real de Queue ou Router antes de haver um contrato runtime dedicado.

## Bloqueios

Transicoes invalidas sao registradas em `blockedTransitions` quando:

- a decisao nao possui mapeamento;
- a state machine rejeita o caminho;
- o estado critico nao possui `reason` ou `safetyMode`;
- o estado temporario nao possui `expiresAt`.

Na V1, decisoes sem mapeamento ficam em `ignoredDecisions`.

## Persistencia

Relatorios sao gravados em:

- `runtime-data/state-transitions/`
- `memory/state-transitions/`

Cada relatorio contem:

- fonte de decisoes;
- decisoes consumidas;
- transicoes aplicadas;
- transicoes bloqueadas;
- decisoes ignoradas;
- snapshots das maquinas;
- fallback.

## Integracao com Demos

- `runtime:decision-demo`: gera decisoes em `memory/decisions/`.
- `runtime:state-demo`: continua demonstrando lifecycle e tambem executa o coordinator.
- `runtime:transition-demo`: executa apenas a coordenacao Decision -> State.
- `runtime:queue-demo` e `runtime:routing-demo`: continuam funcionais e compativeis; a V1 nao altera seus fluxos.

## Fallback Seguro

Fallbacks:

- sem `memory/decisions/`: nenhuma transicao automatica e aplicada;
- JSON invalido: erro registrado em `readErrors`;
- decisao sem mapeamento: registrada em `ignoredDecisions`;
- transicao invalida: registrada em `blockedTransitions`;
- sem efeitos destrutivos ou alteracao de producao.

## Compatibilidade com Governanca

A V1 segue os gates enterprise:

- modulo isolado;
- persistencia append-only;
- fonte, evidencia, razao e safety mode em relatorios;
- fallback para fonte ausente ou invalida;
- sem alteracao em projetos;
- sem alteracao nas automacoes atuais.

## Riscos

- Cada decisao ainda e aplicada em uma maquina isolada, nao sobre um estado runtime real compartilhado.
- Queue e Router ainda nao emitem eventos diretos para a state machine.
- Nao ha resolucao de conflito entre decisoes concorrentes.
- Expiracao de estados temporarios ainda nao e processada ativamente.

## Proximos Passos

- Criar registry de estado atual por workflow.
- Fazer Queue e Router emitirem eventos para `memory/state-machine/`.
- Fazer o Decision Engine considerar estado atual antes de gerar novas decisoes.
- Adicionar politica de prioridade e conflito entre decisoes.
- Criar testes automatizados para coordinator, fallback e bloqueios.
