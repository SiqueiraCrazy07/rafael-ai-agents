# Queue System

## Objetivo

Definir o modelo de fila operacional para execucoes de agentes e workflows.

## Prioridade

Prioridades sugeridas:

- `p0`: incidente critico ou producao quebrada;
- `p1`: bloqueio operacional relevante;
- `p2`: execucao normal de produto/automacao;
- `p3`: documentacao, melhoria ou tarefa sem urgencia.

## Criticidade

Criticidade e diferente de prioridade.

- prioridade define ordem de atendimento;
- criticidade define risco e governanca.

Uma tarefa pode ser `p1` e `medium`, ou `p3` e `high`.

## Retries

Regras recomendadas:

- low/medium: ate 3 retries;
- high: ate 2 retries com checkpoint;
- critical: sem retry automatico sem validacao humana.

Retries devem registrar:

- tentativa;
- erro;
- etapa;
- tempo;
- resultado.

## Starvation prevention

Evitar que tarefas de baixa prioridade nunca sejam executadas:

- envelhecimento de prioridade;
- reserva de capacidade para `p2` e `p3`;
- limite de execucoes consecutivas por projeto;
- revisao manual de fila acumulada.

## Fila por projeto

Cada projeto pode ter uma fila logica.

Exemplo:

```text
queue/promoclub007
queue/site-vitrine
queue/pm
```

## Fila por agente

Agentes criticos podem ter fila propria para evitar conflito.

Exemplo:

- QA Agent;
- Backend Agent;
- Ofertas Agent.

## Deduplicacao

Antes de criar nova execucao, verificar:

- mesmo projeto;
- mesmo workflow;
- mesma entrada;
- mesma janela de tempo;
- mesma criticidade.

Se duplicado:

- anexar contexto a execucao existente;
- ou rejeitar com status `blocked`;
- ou criar nova execucao apenas com justificativa.
