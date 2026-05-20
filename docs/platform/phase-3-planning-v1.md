# Phase 3 Planning V1

## Objetivo

A FASE 3 deve transformar a plataforma governada da FASE 2 em uma operacao mais persistente, isolada e coordenada, mantendo safety-first e compatibilidade retroativa.

## Objetivos Iniciais

- adicionar adapter transacional SQLite/PostgreSQL;
- criar worker runtime isolado por processo;
- implementar reservas reais de lease para scheduler;
- criar API mutativa declarativa com human gate;
- evoluir dashboard para operacoes autonomas;
- adicionar event broker adapter;
- permitir autonomous patch proposal sem aplicacao automatica destrutiva.

## Arquitetura Inicial

```text
API governed mutations
  -> human gate
  -> scheduler lease reservation
  -> process-isolated workers
  -> event broker
  -> transactional database
  -> dashboard operations
  -> autonomous proposal loop
```

## Requisitos Minimos

- manter JSON fallback durante migracao;
- manter `memory/` e `runtime-data/` como trilha auditavel;
- nenhuma acao externa sem policy explicita;
- workers isolados devem ter timeout, stdout/stderr capture e sandbox policy;
- API mutativa deve exigir auth, scope e safetyMode;
- autonomous proposal deve gerar diff/plan, nao aplicar sem gate.

## Criterios de Governanca

- cada mutacao deve ter `requestId`, `clientId`, `correlationId`, `reason`, `safetyMode` e rollback;
- human gate obrigatorio para risco alto;
- PromoClub007 permanece isolado;
- automacoes atuais nao podem ser alteradas por fluxo autonomo;
- validadores devem cobrir fallback e rollback.

## Estrategia de Rollout Seguro

1. Adapter SQLite em mirror mode.
2. Event broker local adapter.
3. Worker process sandbox em dry-run.
4. Scheduler lease reservation declarativa.
5. API mutation proposal endpoints.
6. Human gate workflow.
7. Dashboard operations view.
8. Autonomous patch proposal mode.

## Readiness de Entrada

Entrada na FASE 3 depende de:

- `fase-2-ready`;
- phase 2 closure documentado;
- phase 2 readiness validator passando;
- riscos aceitos;
- backlog inicial priorizado;
- nenhuma pendencia bloqueante de governanca.
