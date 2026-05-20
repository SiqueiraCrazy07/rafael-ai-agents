# Runtime Simulator

## Objetivo

Definir como simular execucoes do runtime antes de executar workflows reais.

## Como simular execucoes

Uma simulacao deve criar um execution object artificial com:

- `executionId`;
- `workflow`;
- `project`;
- `agents`;
- `status`;
- `retries`;
- `logs`;
- `checkpoints`;
- `decisions`;
- `outputs`;
- `risks`.

O simulador percorre estados sem executar efeitos colaterais reais.

## Como testar runtime states

Validar transicoes:

```text
queued -> routed -> running -> validated -> completed
running -> waiting_input -> running
running -> blocked
running -> failed -> retrying -> running
failed -> rolled_back
```

Transicoes proibidas devem falhar na simulacao.

Exemplos:

- `queued -> completed`;
- `completed -> running`;
- `rolled_back -> completed`;
- `failed -> completed` sem `retrying` ou `validated`.

## Como validar retries

Simular:

- falha transitoria;
- incremento de retry;
- limite maximo;
- mudanca para `failed` ou `blocked`;
- criacao de checkpoint antes do retry.

## Como validar rollback

Simular:

- falha high/critical;
- existencia de checkpoint seguro;
- transicao para `rolled_back`;
- registro de incidente quando necessario;
- bloqueio caso nao exista checkpoint.

## Como testar handoff entre agentes

Cada handoff deve validar:

- agente anterior;
- agente seguinte;
- contexto minimo;
- status da execucao;
- permissao do agente seguinte;
- compatibilidade com projeto;
- risco e gate humano quando aplicavel.
