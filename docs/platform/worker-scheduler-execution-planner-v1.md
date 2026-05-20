# Worker Scheduler + Execution Planner V1

## Objetivo

Worker Scheduler + Execution Planner V1 adiciona uma camada cognitiva inicial de planejamento e agendamento de execucao para o Rafael AI Agents. A camada e readonly-safe, declarativa e compativel com Worker Execution Runtime V1 e Worker Sandbox + Isolation V1.

## Modulos

- `workers/scheduler/worker-scheduler.js`: gera agenda declarativa e persiste relatorio.
- `workers/scheduler/execution-planner.js`: analisa workload, workers, queue, telemetry, sandbox e integracoes.
- `workers/scheduler/execution-priority-engine.js`: calcula prioridade de jobs.
- `workers/scheduler/execution-forecast-engine.js`: estima saturacao, retry storm, unhealthy workers e crescimento de fila.
- `workers/scheduler/execution-window-manager.js`: define janelas imediatas, delayed, retry e protected-release.
- `workers/scheduler/execution-routing-engine.js`: seleciona worker saudavel, readonly, capaz e pouco saturado.
- `workers/demo/worker-scheduler-demo.js`: demo operacional.

## Estrategia de Scheduling

O scheduler nao executa workers. Ele cria planos de execucao seguros:

1. Le fontes readonly em `memory/`.
2. Normaliza jobs da queue, retry items e protected queue.
3. Rankeia jobs por criticidade, retry, protected queue e capability.
4. Calcula forecast operacional.
5. Seleciona rota por worker saudavel e capability.
6. Define execution window.
7. Persiste plano declarativo em `runtime-data/worker-scheduler/` e `memory/worker-scheduler/`.

## Execution Plans

Cada item do plano contem:

- `workflowId`;
- `jobId`;
- `action`: `schedule` ou `protected-queue`;
- prioridade e motivos;
- rota selecionada;
- workers evitados e motivos;
- execution window;
- retry scheduling;
- protected queue release;
- `safetyMode`;
- `reason`.

## Priority Engine

Prioriza:

- workflows criticos;
- retries;
- protected queue;
- prioridade `gated`, `high`, `normal` e `low`;
- jobs com capability explicita.

## Forecast Engine

Detecta:

- risco de saturacao;
- risco de retry storm;
- risco de unhealthy workers;
- risco de queue growth;
- pressao de policy violations da sandbox.

## Execution Windows

Tipos:

- `immediate`: capacidade saudavel disponivel;
- `delayed`: risco de saturacao ou retry storm;
- `retry`: retry com delay;
- `protected-release`: tentativa governada de soltar protected queue.

Cada window inclui `scheduledAt`, `expiresAt`, `reason` e `safetyMode`.

## Routing Engine

Seleciona melhor worker respeitando:

- `readonly-safe mode`;
- `enabled`;
- `healthStatus=healthy`;
- capability exigida;
- `activeExecutions < concurrencyLimit`;
- menor utilizacao.

Workers unhealthy, saturados, sem capability, disabled ou non-readonly sao evitados e registrados no plano.

## Integracoes

- Worker Runtime: consome `memory/workers/`.
- Queue Manager: consome `memory/queue/`.
- Telemetry: consome `memory/telemetry/` e passa a contar scheduler reports.
- Dashboard: recebe os dados pela telemetria e API de dashboard.
- Sandbox: consome `memory/worker-sandbox/` para policy pressure.
- Plugins: registra disponibilidade de `memory/plugins/`.
- Connectors: registra disponibilidade de `memory/connectors/`.
- Database Layer: registra disponibilidade de `memory/database/`.

## Persistencia

Relatorios append-only:

- `runtime-data/worker-scheduler/worker-scheduler-*.json`;
- `memory/worker-scheduler/worker-scheduler-*.json`.

## Fallback Seguro

- Fonte ausente gera fallback conservador.
- Queue ausente usa jobs demo normalizados pelo Worker Runtime.
- Workers ausentes usam pool fallback readonly com um worker saudavel e um unhealthy.
- Sem rota segura, job permanece em `protected-queue`.
- Scheduler nunca executa worker, nunca chama network e nunca altera workflows.

## Validacao

```bash
npm run governance:validate
npm run workers:demo
npm run workers:sandbox-demo
npm run workers:scheduler-demo
npm run telemetry:demo
npm run dashboard:web-demo
npm run validate
npm run normalize
```

## Riscos

- Forecast e heuristico nesta V1.
- Scheduler ainda nao reserva leases reais.
- Protected queue release e declarativo, nao executado.
- Database Layer ainda e fonte observacional, nao fonte unica.

## Readiness

Readiness: `worker-scheduler-execution-planner-v1-ready`.

A plataforma passa a ter planejamento cognitivo inicial para execucao distribuida, com prioridade, forecast, janelas, retry scheduling, protected queue awareness, roteamento seguro e persistencia auditavel.
