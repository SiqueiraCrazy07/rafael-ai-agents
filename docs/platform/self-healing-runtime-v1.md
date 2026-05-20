# Self-Healing Runtime V1

## Objetivo

O Self-Healing Runtime V1 permite recuperar automaticamente falhas comuns da execucao distribuida.

Ele cobre:

- worker morto ou sem heartbeat recente;
- heartbeat expirado;
- lease expirado;
- lock preso;
- item removido da fila sem conclusao;
- requeue automatico;
- reexecucao controlada;
- prevencao de duplicidade durante recovery;
- registro de recovery e metricas de healing.

## Estrutura

Arquivos principais:

- `runtime/recovery/workers/stale-worker-detector.js`
- `runtime/recovery/leases/lease-expiration-recovery.js`
- `runtime/recovery/queue/automatic-requeue-engine.js`
- `runtime/recovery/queue/queue-healing-engine.js`
- `runtime/recovery/executions/execution-recovery-engine.js`
- `runtime/recovery/queue/retry-recovery-coordinator.js`
- `runtime/recovery/self-healing/runtime-recovery-policies.js`
- `runtime/recovery/self-healing/self-healing-orchestrator.js`
- `runtime/recovery/runtime-recovery-demo.js`

Comando:

```bash
npm run runtime:recovery-demo
```

## Fluxo do Demo

1. Cria um worker com heartbeat antigo.
2. Cria um worker saudavel.
3. Enfileira um workflow `offers-publish`.
4. Simula o item preso com lease expirado e lock ativo.
5. Bloqueia uma tentativa duplicada antes do recovery.
6. Detecta worker stale por heartbeat vencido.
7. Detecta lease expirado.
8. Libera lock preso.
9. Recoloca o item na fila.
10. Reserva novo lease para worker saudavel.
11. Cria novo lock.
12. Bloqueia nova tentativa duplicada.
13. Reexecuta o workflow.
14. Libera lease e lock.
15. Persiste relatorio em `runtime-data/recovery/` e `memory/recovery/`.

## Componentes

### Stale Worker Detector

Detecta workers com heartbeat expirado ou status nao ativo.

Sinal principal:

- `lastSeenAt` mais antigo que a janela configurada.

### Lease Expiration Recovery

Recebe leases expirados e libera recursos relacionados.

Na V1, o principal recurso liberado e o lock do item preso.

### Automatic Requeue Engine

Recria um item recuperado na fila com metadados de recovery:

- `recoveryOf`;
- `recoveredExecutionId`;
- motivo de requeue.

### Queue Healing Engine

Coordena quais recuperacoes de lease viram requeue.

### Execution Recovery Engine

Reexecuta o item recuperado com:

- novo lease;
- novo lock;
- bloqueio de tentativa duplicada;
- execucao em worker saudavel;
- liberacao de lease e lock no final.

### Retry Recovery Coordinator

Gera resumo de coordenacao:

- itens requeued;
- workflows reexecutados;
- completados;
- falhas;
- duplicidades bloqueadas.

### Runtime Recovery Policies

Define se um recovery e permitido.

Na V1, recovery automatico e permitido quando:

- o worker do lease expirado esta stale;
- o lease esta realmente expirado;
- automatic requeue esta habilitado.

### Self-Healing Orchestrator

Executa o fluxo completo de deteccao, decisao, requeue, reexecucao e persistencia.

## Como Evita Duplicidade

O recovery usa o mesmo `QueueLockManager` da execucao distribuida.

Antes de reexecutar, o engine:

1. cria um novo lock para o item requeued;
2. simula uma segunda tentativa concorrente;
3. confirma que a tentativa recebe `duplicateBlocked`;
4. executa apenas uma vez;
5. libera o lock ao concluir.

## Como Detecta Worker Travado

O worker e considerado travado quando:

- o heartbeat passou da janela de tolerancia;
- existe lease expirado associado ao worker;
- ha lock preso no mesmo item.

Esse cruzamento reduz falso positivo: heartbeat antigo sozinho sinaliza risco, mas o recovery automatico so ocorre quando tambem ha lease expirado.

## Persistencia

Relatorios sao gravados em:

- `runtime-data/recovery/`;
- `memory/recovery/`.

O relatorio inclui:

- workers stale;
- leases expirados;
- locks liberados;
- itens requeued;
- execucoes recuperadas;
- duplicidades bloqueadas;
- metricas de healing.

## Limites da V1

- Execucao ainda e simulada localmente.
- Locks e leases usam memoria local e JSON.
- Nao ha storage transacional.
- Nao ha reconciliacao entre multiplos processos reais.
- Nao ha backoff distribuido.
- Nao altera PromoClub007 nem automacoes atuais.

## Proximos Passos

- integrar recovery ao Supervisor como resposta automatica;
- adicionar lock distribuido com Redis ou banco;
- implementar heartbeat loop real;
- reprocessar itens expirados por scheduler;
- criar quarentena para workflows com recovery repetido;
- alimentar Learning Engine com metricas de healing;
- criar alerta quando o mesmo worker expirar multiplas vezes;
- adicionar testes automatizados de race condition e idempotencia.
