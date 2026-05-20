# Worker Heartbeat + Lease/Lock V1

## Objetivo

A camada Worker Heartbeat + Lease/Lock V1 aumenta a seguranca da execucao distribuida do runtime.

Ela reduz dois riscos centrais:

- worker travado ou invisivel continuar parecendo disponivel;
- item de fila ser processado mais de uma vez em paralelo.

## Componentes

### Worker Heartbeat Manager

Arquivo:

- `runtime/workers/heartbeat/worker-heartbeat-manager.js`

Responsavel por registrar:

- `workerId`;
- `status`;
- `lastSeenAt`;
- `running`;
- `capacity`;
- `capabilities`.

Persistencia:

- `runtime-data/workers/`;
- `memory/workers/`.

### Worker Lease Manager

Arquivo:

- `runtime/workers/leases/worker-lease-manager.js`

Responsavel por:

- reservar um item de fila para um worker;
- definir `expiresAt`;
- renovar lease;
- liberar lease;
- detectar lease expirado.

Persistencia:

- `runtime-data/leases/`.

### Queue Lock Manager

Arquivo:

- `runtime/workers/locks/queue-lock-manager.js`

Responsavel por:

- impedir processamento duplicado de `queueItem`;
- bloquear execucao concorrente da mesma chave;
- liberar lock ao concluir ou falhar.

Persistencia:

- `runtime-data/locks/`.

## Fluxo no Queue Demo

Comando:

```bash
npm run runtime:queue-demo
```

O demo agora demonstra:

1. workers registrados;
2. heartbeat ativo para cada worker;
3. item reservado por lease antes da execucao;
4. lock criado antes do processamento;
5. tentativa duplicada bloqueada pelo lock;
6. execucao concluida ou falha;
7. lease liberado;
8. lock liberado;
9. lease expirado detectado em cenario demonstrativo;
10. relatorio persistido em `runtime-data/queue/` e `memory/queue/`.

## Como Evita Execucao Duplicada

Antes de executar um item, o runtime cria um lock baseado em:

- projeto;
- workflow;
- `queueId`.

Se outro worker tentar adquirir o mesmo lock enquanto ele estiver ativo, a tentativa recebe `duplicate_blocked`.

Na V1, o bloqueio e local e em memoria durante a simulacao, com persistencia em JSON para auditoria.

## Como Detecta Worker Travado

O heartbeat registra `lastSeenAt` para cada worker.

Um worker pode ser considerado travado quando:

- nao renova heartbeat dentro da janela esperada;
- mantem lease ativo ate expirar;
- nao libera lock apos execucao;
- permanece com `running` acima de zero sem progresso.

Na V1, o demo mostra deteccao de lease expirado. A evolucao natural e cruzar heartbeat vencido com leases e locks ainda ativos.

## Limites da V1

- Heartbeats sao gravados localmente em JSON.
- Locks nao sao distribuidos entre processos reais.
- Leases nao usam storage transacional.
- Nao ha heartbeat loop continuo.
- Nao ha requeue automatico apos lease expirado.
- Nao altera workflows existentes nem automacoes atuais.

## Proximos Passos

- adicionar heartbeat interval real por worker;
- implementar lease renewal durante execucoes longas;
- reprocessar automaticamente itens com lease expirado;
- adicionar lock distribuido com banco ou Redis;
- criar lock por chave funcional alem de `queueId`;
- integrar stale worker detection ao Supervisor;
- alimentar Learning Engine com expiracoes de lease;
- aplicar politicas automaticas quando worker ficar instavel;
- adicionar testes automatizados de race condition.
