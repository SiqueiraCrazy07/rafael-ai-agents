# Phase 2 Planning V1

## Objetivo

A FASE 2 inicia a transformacao da base declarativa da FASE 1 em uma plataforma operacional executavel, observavel e extensivel.

O foco deixa de ser apenas validar integracao runtime e passa a criar superficies formais para API, persistencia, workers reais, dashboard e plugins.

## Objetivos da FASE 2

Objetivos principais:

- criar API Server V1 para expor contratos runtime;
- substituir dependencia exclusiva de JSON local por Persistent Database Layer;
- criar Worker Runtime para execucao real controlada;
- criar Dashboard operacional para visibilidade;
- criar Plugin System para extensibilidade governada;
- manter fallback seguro para todos os fluxos;
- preservar compatibilidade com relatorios da FASE 1;
- manter PromoClub007 isolado.

## Arquitetura Inicial do API Server

O API Server V1 deve ser um modulo de plataforma, nao um projeto especifico.

Local sugerido:

```text
runtime/api-server/
```

Responsabilidades iniciais:

- expor health da plataforma;
- listar workflows, decisoes, eventos e estados;
- criar workflow execution requests;
- consultar queue state;
- consultar decision reports;
- consultar state machine snapshots;
- consultar event replay por `workflowId` ou `correlationId`;
- acionar comandos declarativos com safety mode;
- expor readiness da FASE 1 e FASE 2.

Contratos iniciais sugeridos:

```text
GET  /health
GET  /readiness
GET  /events
GET  /events/replay
GET  /decisions
GET  /workflows/:workflowId/state
GET  /queue
POST /workflows
POST /runtime/decision-demo
POST /runtime/transition-demo
```

Na V1, endpoints de mutacao devem ser declarativos ou protegidos por gate.

## Persistent Database Layer

A camada de banco deve preservar a separacao semantica da FASE 1:

- `memory/` continua representando historico e aprendizado;
- `runtime-data/` continua representando execucao e saidas;
- o banco passa a oferecer indices, consulta, consistencia e projections.

Entidades minimas:

- events;
- decisions;
- workflow_states;
- state_transitions;
- queue_items;
- workers;
- recovery_actions;
- enforcement_plans;
- validation_reports;
- projects.

Requisitos minimos:

- migrations versionadas;
- IDs estaveis;
- timestamps consistentes;
- append-only para eventos e decisoes;
- soft delete quando exclusao for inevitavel;
- export ou mirror para JSON durante a transicao;
- fallback para leitura de arquivos quando banco estiver indisponivel.

## Worker Runtime

Worker Runtime deve transformar workers simulados em runners governados.

Responsabilidades:

- registro de worker;
- heartbeat real;
- lease e lock persistentes;
- execucao de workflow por capacidade declarada;
- reporte de sucesso, falha, retry e recovery;
- publicacao de eventos;
- respeitar throttling, protected queue e human gate;
- isolamento por projeto.

Requisitos minimos:

- nenhum worker executa tarefa sem lease valido;
- nenhuma tarefa critica executa sem safety mode adequado;
- duplicidade deve ser bloqueada;
- falha deve alimentar recovery e event bus;
- workers devem poder ser desabilitados por enforcement.

## Dashboard

Dashboard deve apresentar a operacao sem misturar dados de projeto e plataforma.

Visoes iniciais:

- readiness;
- event timeline;
- decisions;
- workflow state;
- queue;
- workers;
- recovery;
- predictive risk;
- validation reports;
- governance status.

O dashboard deve consumir API Server, nao ler arquivos diretamente quando a API existir.

## Plugin System

Plugin System deve permitir extensoes sem alterar o core runtime.

Escopos iniciais:

- readers;
- validators;
- workflow adapters;
- notification adapters;
- dashboard panels;
- routing policies;
- recovery policies.

Regras:

- plugin deve declarar manifest;
- plugin deve declarar permissoes;
- plugin deve ter fallback;
- plugin nao pode alterar projeto sem escopo;
- plugin nao pode sobrescrever memoria historica;
- plugin deve ser desativavel.

## Requisitos Minimos da FASE 2

Antes de considerar a FASE 2 pronta:

- API Server documentado e validado;
- banco persistente com migrations;
- Worker Runtime com heartbeat, lease, lock e eventos;
- Dashboard consumindo API;
- Plugin System com manifest e validator;
- schema validators para eventos e decisoes;
- registry unico de estado atual por workflow;
- Queue, Router e Recovery publicando eventos diretamente;
- Learning persistindo snapshots formais;
- validation layer atualizada para cobrir os novos modulos.

## Criterios de Governanca

Toda feature da FASE 2 deve passar por:

- `governance/enterprise-review-checklist.md`;
- `governance/runtime-quality-gates.md`;
- `governance/change-approval-policy.md`;
- documentacao em `docs/platform/`;
- demo ou validator;
- persistencia append-only quando houver historico;
- fallback documentado;
- plano de rollback.

Mudancas que criem efeito real externo exigem gate humano ou explicitacao de safety mode.

## Estrategia de Rollout Seguro

Rollout recomendado:

1. API Server somente leitura.
2. API Server com mutacoes declarativas.
3. Database mirror dos arquivos existentes.
4. Database como fonte primaria com fallback para JSON.
5. Worker Runtime em modo dry-run.
6. Worker Runtime executando workflows nao criticos.
7. Dashboard usando API readonly.
8. Plugin System com plugins desabilitados por padrao.
9. Ativacao gradual por projeto.

Cada etapa deve gerar relatorio em `memory/` e `runtime-data/`.

## Compatibilidade com FASE 1

A FASE 2 deve manter:

- leitura dos relatorios JSON existentes;
- scripts de demo atuais;
- `runtime:validate-integration`;
- contratos de evento;
- contratos de decisao;
- state machine e transition coordinator;
- governance validator;
- fallback para memoria ausente ou invalida.

## Riscos da FASE 2

- Introducao de API pode criar acoplamento se contratos nao forem versionados.
- Banco persistente pode divergir de arquivos locais durante migracao.
- Worker Runtime real aumenta risco de duplicidade e efeito externo.
- Dashboard pode induzir decisao errada se misturar dados stale e atuais.
- Plugin System pode quebrar isolamento se permissoes forem fracas.

## Readiness de Entrada

Entrada oficial na FASE 2 depende de:

- FASE 1 marcada como `fase-1-ready`;
- documentos de closure e planejamento criados;
- validacoes basicas passando;
- riscos aceitos e documentados;
- primeiro backlog da FASE 2 priorizado por governanca.

## Marco Inicial

O inicio oficial da FASE 2 e o API Server V1.

Ele deve nascer como camada de consulta e controle declarativo, mantendo a plataforma segura enquanto os demais blocos passam de arquivos locais e demos para runtime persistente e operacional.
