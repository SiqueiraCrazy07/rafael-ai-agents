# Queue Manager + Distributed Execution V1

## Objetivo

A camada Queue Manager + Distributed Execution V1 cria a base de execucao distribuida do runtime.

Ela permite:

- criar multiplas execucoes;
- ordenar por prioridade;
- distribuir trabalho entre workers;
- respeitar capacidade e concorrencia;
- aplicar throttling vindo de runtime policies;
- mover falhas para retry queue;
- gerar telemetria e metricas operacionais;
- persistir historico para memoria e auditoria.

## Estrutura

Arquivos principais:

- `runtime/queue/queue-manager.js`
- `runtime/queue/workflow-queue.js`
- `runtime/queue/retry-queue.js`
- `runtime/priority/priority-queue.js`
- `runtime/workers/worker-registry.js`
- `runtime/workers/worker-execution-simulator.js`
- `runtime/concurrency/concurrency-controller.js`
- `runtime/concurrency/capacity-controller.js`
- `runtime/distribution/distributed-execution-simulator.js`
- `runtime/queue/queue-telemetry.js`
- `runtime/queue/runtime-queue-demo.js`

Comando:

```bash
npm run runtime:queue-demo
```

## Fluxo Operacional

1. O demo carrega a policy mais recente em `runtime-data/policies/`.
2. Registra workers simulados com capacidades diferentes.
3. Cria execucoes para workflows com prioridades `p0` a `p3`.
4. A fila priorizada seleciona o proximo item.
5. O simulador verifica se o workflow esta bloqueado por policy.
6. O controle de concorrencia aplica a capacidade atual.
7. O registry seleciona um worker compativel.
8. O worker executa ou falha de forma simulada.
9. Falhas com retry disponivel sao movidas para retry queue.
10. Telemetria e metricas sao geradas e persistidas.

## Queue Manager

Responsavel por:

- enfileirar workflows;
- deduplicar itens equivalentes;
- desenfileirar por prioridade;
- mover falhas para retry queue;
- expor estado da fila.

## Workflow Queue

Representa a fila principal de workflows.

Cada item contem:

- `queueId`;
- `executionId`;
- `project`;
- `workflow`;
- `objective`;
- `priority`;
- `criticidade`;
- `payload`;
- `attempts`;
- `maxRetries`;
- `status`.

## Priority Queue

Ordena execucoes por:

1. prioridade (`p0`, `p1`, `p2`, `p3`);
2. horario de entrada na fila.

## Retry Queue

Recebe itens que falharam e ainda tem retry disponivel.

Na V1, o retry e imediato no simulador. A evolucao recomendada e adicionar backoff, jitter, cooldown e bloqueio por policy.

## Worker Registry

Mantem workers disponiveis e seleciona o melhor worker compativel por:

- status ativo;
- capacidade disponivel;
- compatibilidade de capabilities;
- menor carga atual.

## Worker Execution Simulator

Executa o item de forma simulada.

Ele pode:

- completar a execucao;
- falhar propositalmente com `failUntilAttempt`;
- registrar duracao, worker e tentativa.

## Concurrency Controller

Controla o numero maximo de execucoes concorrentes.

Na V1, a capacidade e local e simples. Em producao, este controle deve ser compartilhado entre runners.

## Capacity Controller

Calcula capacidade operacional a partir das policies.

Se existir throttling de plataforma, a capacidade pode cair para `maxConcurrentExecutions = 1`.

## Distributed Execution Simulator

Coordena o fluxo completo:

- cria workers;
- cria execucoes;
- aplica policy;
- seleciona workers;
- processa retry;
- gera relatorio.

## Telemetria

Eventos gerados:

- `queue_item_enqueued`;
- `queue_item_dequeued`;
- `queue_item_blocked`;
- `queue_item_throttled`;
- `queue_item_waiting_worker`;
- `queue_item_retry_queued`;
- `retry_item_dequeued`;
- `queue_item_executed`.

Metricas geradas:

- total enfileirado;
- total em retry;
- completadas;
- falhas;
- bloqueadas;
- workers registrados;
- workers ativos;
- modo de throttling;
- total de eventos.

## Persistencia

Cada execucao do demo grava relatorio em:

- `runtime-data/queue/`;
- `memory/queue/`.

O relatorio contem:

- itens de fila;
- retry queue;
- workers;
- resultados de distribuicao;
- metricas;
- eventos de telemetria;
- policy usada como fonte.

## Limites da V1

- Workers sao locais e simulados.
- Nao ha execucao real remota.
- Retry nao tem backoff.
- Concorrencia nao e distribuida entre processos.
- Policies sao lidas, mas ainda nao fazem enforcement real em producao.
- Nao altera PromoClub007 nem automacoes existentes.

## Proximos Passos

- conectar Queue Manager ao Runtime Engine V1;
- fazer o Router consultar a fila antes de iniciar execucoes;
- implementar backoff exponencial no Retry Queue;
- adicionar lease/lock por worker;
- criar heartbeat de workers;
- criar fila por projeto e por agente;
- persistir em banco no lugar de JSON local;
- adicionar dashboard de capacidade;
- permitir cancelamento e pausa de workflows;
- integrar policies como enforcement real antes da execucao.
