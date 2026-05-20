# Worker Execution Runtime V1

## Objetivo

Worker Execution Runtime V1 cria a primeira camada operacional root `workers/` para executar jobs de forma distribuída, governada e readonly-safe no Rafael AI Agents. A camada não substitui o runtime legado em `runtime/workers/`; ela adiciona um runtime modular com heartbeat, lease-lock, balanceamento, retry, proteção contra saturação, observabilidade e fallback seguro.

## Arquitetura Modular

- `workers/runtime-worker.js`: orquestrador central do runtime de execução.
- `workers/worker-pool.js`: registro, capacidade, saúde e saturação dos workers.
- `workers/worker-heartbeat.js`: heartbeat e detecção de workers stale.
- `workers/worker-lease-manager.js`: lease-lock, expiração e liberação segura.
- `workers/worker-supervisor.js`: inspeção de heartbeat, saturação e leases expirados.
- `workers/worker-load-balancer.js`: seleção de worker saudável, habilitado e capaz.
- `workers/worker-failure-recovery.js`: retry orchestration e protected queue fallback.
- `workers/worker-execution-context.js`: contexto readonly isolado com `executionId` e `correlationId`.
- `workers/demo/worker-runtime-demo.js`: demo operacional e relatório resumido.

## Regras de Governança

- Runtime opera em `readonly-safe-worker-runtime`.
- Nenhum worker executa ação destrutiva real.
- Workers sem `readonly: true` são rejeitados no registro.
- Plugins inválidos são bloqueados e não derrubam execução.
- Connectors unhealthy são pulados em safe fallback.
- Jobs sem worker saudável/capaz entram em protected queue.
- JSON em `memory/` e `runtime-data/` continua como persistência compatível.

## Lifecycle de Execução

1. Registra workers governados no pool.
2. Lê `memory/queue/` quando disponível.
3. Usa fallback declarativo quando a fila não existe ou não possui itens legíveis.
4. Publica eventos `workflow-created` e `workflow-queued`.
5. Escolhe worker por capacidade, saúde e menor utilização.
6. Cria lease-lock antes da execução.
7. Cria contexto isolado readonly com `executionId` e `correlationId`.
8. Executa workflow simulado sem side effects destrutivos.
9. Atualiza State Machine para `completed`, `retrying` ou `protected`.
10. Publica eventos de conclusão, falha, lease, unhealthy e rebalance.
11. Aplica retry quando há orçamento disponível.
12. Persiste relatório completo.

## Heartbeat, Lease e Saturação

O supervisor avalia workers antes e depois da execução. Workers com heartbeat ausente ou stale são marcados como unhealthy e excluídos de novas atribuições. Leases ativos possuem `expiresAt`; leases expirados são registrados sem interromper o runtime. A proteção de saturação impede atribuição quando `activeExecutions >= concurrencyLimit`.

## Balanceamento e Rebalance

O load balancer prioriza workers:

- habilitados;
- readonly;
- saudáveis;
- com capability exigida;
- abaixo do limite de concorrência;
- com menor utilização.

Quando um job fica sem worker capaz, ele é enviado para protected queue. O runtime gera plano de rebalance quando existe destino saudável; caso contrário, preserva o fallback protegido.

## Retry e Recovery

Falhas simuladas são avaliadas por `worker-failure-recovery.js`. Se `attempt <= maxRetries`, o job entra em retry orchestration com `retryDelayMs`. Sem orçamento de retry, a falha é mantida como estado final seguro.

## Observabilidade

Cada execução gera:

- `executionId`;
- `correlationId`;
- worker atribuído;
- tentativa;
- status;
- transições de state machine;
- eventos publicados;
- decisões de recovery;
- hooks de plugins;
- execuções de connectors.

O relatório é compatível com `telemetry/runtime-metrics-collector.js`, que consome `memory/workers/`.

## Integrações

- Queue: lê `memory/queue/` e usa fallback seguro.
- State Machine: registra transições para `queued`, `completed`, `retrying` e `protected`.
- Event Bus: publica eventos operacionais e de worker.
- Telemetry: persiste formato consumido pelo coletor de métricas.
- Dashboard: expõe dados via `memory/workers/` para Dashboard Runtime API/Web.
- Plugins: executa hooks readonly `beforeWorkflow`, `beforeExecution`, `afterExecution`, `afterWorkflow`, `beforeTelemetry` e `afterTelemetry`.
- Connectors: executa capabilities readonly `telemetry-read` e `dashboard-read` quando saudáveis.

## Persistência

O runtime persiste o mesmo relatório em:

- `runtime-data/workers/worker-runtime-root-*.json`
- `memory/workers/worker-runtime-root-*.json`

Esses arquivos incluem execução, leases, health, rebalances, plugins, connectors, eventos, fallback e metadados de governança.

## Fallback Seguro

Fallbacks obrigatórios:

- diretório de queue ausente: usa fila demo declarativa;
- JSON inválido: ignora arquivo inválido e registra `readErrors`;
- worker stale: marca unhealthy e evita atribuição;
- worker saturado: evita atribuição;
- capability ausente: envia workflow para protected queue;
- plugin inválido: bloqueia e registra;
- connector unhealthy: pula execução;
- erro ao publicar evento: registra fallback sem interromper execução.

## Compatibilidade

O script `npm run workers:demo` aponta para o runtime root V1. O demo anterior permanece disponível como `npm run workers:legacy-demo`, preservando compatibilidade e evitando remoção de flows existentes.

## Validação

Comandos esperados:

```bash
npm run governance:validate
npm run telemetry:demo
npm run dashboard:web-demo
npm run workers:demo
npm run validate
npm run normalize
```

## Riscos e Limites

- Execução ainda é simulada e readonly-safe, sem worker sandbox externo.
- Lease-lock é em memória durante o processo; persistência registra o resultado do run.
- Rebalance é declarativo nesta V1.
- Não há concorrência real multi-processo nesta versão.
- Database mirror pode consumir os relatórios posteriormente, mas JSON segue como fonte compatível.

## Próximos Passos

- Adicionar worker sandbox real com processo isolado.
- Persistir leases ativos em database adapter.
- Integrar fila operacional com prioridade e backpressure contínuos.
- Expor detalhes do worker runtime no Dashboard Web.
- Adicionar contratos OpenAPI específicos para workers.
