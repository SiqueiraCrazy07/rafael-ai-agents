# Worker Sandbox + Isolation V1

## Objetivo

Worker Sandbox + Isolation V1 cria uma camada inicial de isolamento seguro para execucao de workers no Rafael AI Agents. A sandbox preserva `readonly-safe mode`, nao executa efeitos destrutivos reais e permanece compativel com Worker Execution Runtime V1.

## Modulos

- `workers/sandbox/sandbox-policy.js`: policy central de seguranca.
- `workers/sandbox/sandbox-context.js`: contexto readonly isolado.
- `workers/sandbox/sandbox-runner.js`: wrapper de execucao com timeout e captura de erro.
- `workers/sandbox/sandbox-audit.js`: persistencia de auditoria.
- `workers/sandbox/worker-sandbox.js`: fachada operacional para o Worker Runtime.
- `workers/demo/worker-sandbox-demo.js`: demo de politicas, bloqueios e fallback.

## Politicas Criadas

- `readonly` obrigatorio.
- `destructiveActions` bloqueado.
- Escrita de filesystem pelo handler permitida apenas como simulacao em `runtime-data/workers/` e `memory/workers/`.
- Escrita fora desses caminhos e bloqueada.
- Network calls e external calls bloqueadas nesta V1.
- Acesso direto a secrets bloqueado.
- Payload limitado por `maxPayloadBytes`.
- `timeoutMs` obrigatorio e limitado.

## Sandbox Context

Cada execucao recebe contexto clonado e readonly com:

- `executionId`;
- `correlationId`;
- `workerId`;
- `workflowId`;
- `allowedCapabilities`;
- `readonly`;
- `safeMode`;
- `permittedPaths`;
- `deniedActions`;
- `payload`.

## Sandbox Runner

O runner executa handlers dentro de wrapper seguro. Ele:

- valida request antes de executar;
- aplica timeout via `Promise.race`;
- captura excecoes;
- registra acoes permitidas e negadas;
- bloqueia outputs destrutivos;
- retorna resultado seguro sem derrubar o runtime principal.

## Auditoria

Cada execucao gera auditoria em:

- `runtime-data/worker-sandbox/worker-sandbox-*.json`;
- `memory/worker-sandbox/worker-sandbox-*.json`.

O relatorio inclui:

- allowed actions;
- denied actions;
- timeout;
- policy violations;
- execution result;
- fallback;
- persistence paths.

## Integracao com Worker Runtime

`workers/runtime-worker.js` usa `WorkerSandbox` dentro de cada execucao de job. O handler simulado do worker roda via sandbox, e o resultado final do Worker Runtime passa a carregar:

- `sandboxReportId`;
- status da sandbox;
- numero de violacoes;
- flag de timeout.

O Worker Runtime continua readonly-safe, com leases, heartbeat, retries, protected queue, plugins, connectors e eventos preservados.

## Integracao com Plugins e Connectors

Plugins continuam recebendo contexto readonly clonado. A sandbox impede que o handler de worker retorne `destructiveActions=true`; se isso ocorrer, o output e bloqueado.

Connectors continuam governados pelo Connector Manager e nao sao chamados diretamente dentro do handler de worker. Calls externas simuladas dentro da sandbox sao bloqueadas.

## Integracao com Telemetry e Dashboard

`telemetry/runtime-metrics-collector.js` passa a ler `memory/worker-sandbox/` e expor:

- `workerSandboxReports`;
- `workerSandboxPolicyViolations`;
- `workerSandboxTimeouts`.

Dashboard Web consome telemetria atualizada via Dashboard Runtime API sem precisar de acao destrutiva.

## Fallback Seguro

Fallbacks obrigatorios:

- request nao readonly: bloqueia antes do handler;
- `destructiveActions=true`: bloqueia antes do handler;
- payload acima do limite: bloqueia antes do handler;
- timeout: retorna status `timeout`;
- network/external call: registra denied action;
- secret access: registra denied action;
- filesystem write fora dos caminhos permitidos: registra denied action;
- erro no handler: retorna status `failed`.

Nenhum desses casos derruba o Worker Runtime principal.

## Validacao

```bash
npm run governance:validate
npm run workers:demo
npm run workers:sandbox-demo
npm run telemetry:demo
npm run dashboard:web-demo
npm run validate
npm run normalize
```

## Riscos e Limites

- A V1 roda no mesmo processo Node; ainda nao e sandbox de processo separado.
- Escritas permitidas pelo handler sao simuladas em readonly-safe mode.
- Network e secrets sao bloqueados por API governada, nao por isolamento de kernel.
- Timeout nao cancela trabalho CPU-bound ja iniciado; ele apenas retorna fallback seguro ao runtime.

## Readiness

Readiness: `worker-sandbox-isolation-v1-ready`.

A plataforma passa a ter isolamento inicial auditavel para handlers de worker, com policy explicita, auditoria persistida, fallback seguro e integracao com Worker Runtime e Telemetry.
