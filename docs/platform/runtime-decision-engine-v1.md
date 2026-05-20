# Runtime Decision Engine V1

## Objetivo

Criar um cerebro central de decisao operacional para coordenar sinais de Router, Queue, Optimization Enforcement, Supervisor, Learning, Predictive e Recovery.

A V1 e declarativa: ela le memoria operacional, gera decisoes com evidencias e persiste o plano. Ela nao altera producao nem executa acoes destrutivas.

## Arquivos

- `runtime/decision-engine/runtime-decision-engine.js`
- `runtime/decision-engine/runtime-decision-demo.js`

Script:

```bash
npm run runtime:decision-demo
```

## Fontes Lidas

O engine le os arquivos JSON mais recentes em:

- `memory/optimization-enforcement/`
- `memory/enforcement-integration/`
- `memory/predictive/`
- `memory/proactive/`
- `memory/recovery/`
- `memory/health/`
- `memory/queue/`
- `memory/learning/`

Fontes ausentes sao tratadas como fallback seguro e aparecem em `fallback.missingSources`.

## Decisoes Geradas

Cada decisao contem:

- `decisionId`
- `type`
- `severity`
- `source`
- `evidence`
- `action`
- `reason`
- `safetyMode`
- `expiresAt`

Tipos implementados:

- `pause-critical-workflow`
- `reroute-agent-worker`
- `reduce-concurrency`
- `apply-throttling`
- `protected-queue`
- `retry-strategy`
- `preventive-recovery`
- `human-gate`
- `normal-execution`

## Coordenacao

O relatorio inclui uma secao `coordination`:

- `router`: decisoes de reroute para agentes/workers;
- `queue`: concorrencia, throttling, protected queue e retry strategy;
- `recovery`: recovery preventivo;
- `supervisor`: pausa de workflow critico e human gate.

## Persistencia

Relatorios sao gravados em:

- `runtime-data/decisions/`
- `memory/decisions/`

## Fallback Seguro

Fallbacks da V1:

- se uma fonte nao existir, ela e marcada como ausente e as outras fontes continuam sendo avaliadas;
- se um arquivo JSON estiver invalido, ele e ignorado e aparece em `readErrors`;
- se nenhum risco alto for encontrado, o engine gera `normal-execution`;
- todas as decisoes sao declarativas e expiram via `expiresAt`;
- a execucao real continua dependendo de integracao explicita em Router, Queue, Recovery ou Supervisor.

## Compatibilidade com Governanca

O engine segue a governanca enterprise:

- nao altera runtime funcional atual;
- nao altera projetos;
- persiste relatorios append-only em `memory/decisions/` e `runtime-data/decisions/`;
- separa plano declarativo de execucao real;
- registra fontes, evidencias, razoes, safety mode e expiracao;
- preserva fallback para fonte ausente ou arquivo invalido.

## Riscos

- Regras ainda sao heuristicas e baseadas nos formatos atuais de memoria.
- `memory/learning/` pode nao existir porque o demo de learning atual imprime no console e nao persiste snapshot proprio.
- O engine nao faz deduplicacao historica entre relatorios antigos e novos.
- As decisoes ainda nao sao consumidas automaticamente pelos componentes runtime.

## Proximos Passos

- Persistir snapshots formais do Learning Engine em `memory/learning/`.
- Fazer Router, Queue e Recovery consumirem `memory/decisions/`.
- Adicionar TTL/cooldown por tipo de decisao.
- Criar testes automatizados para cada regra de decisao.
- Adicionar prioridade e conflito entre decisoes concorrentes.
