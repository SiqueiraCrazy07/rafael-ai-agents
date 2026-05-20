# Agent Contracts

## Objetivo

Definir contratos minimos para inputs, outputs, status, erros e validacoes entre agentes.

## Inputs obrigatorios

Todo agente deve receber, quando aplicavel:

- `project`: projeto afetado;
- `objective`: objetivo da tarefa;
- `scope`: arquivos, sistemas ou areas permitidas;
- `context`: contexto relevante;
- `constraints`: restricoes;
- `successCriteria`: criterio de sucesso;
- `riskLevel`: criticidade inicial;
- `requestedMode`: analise, implementacao, validacao ou documentacao.

## Outputs padronizados

Todo agente deve produzir:

- `summary`: resumo objetivo;
- `actionsTaken`: acoes realizadas;
- `filesChanged`: arquivos alterados, quando houver;
- `validation`: validacoes executadas;
- `risks`: riscos e mitigacoes;
- `nextSteps`: proximos passos;
- `status`: status operacional.

## Schema de resposta

Formato conceitual:

```json
{
  "project": "promoclub007",
  "agent": "site-qa-agent",
  "status": "validated",
  "summary": "Validacao concluida.",
  "actionsTaken": [],
  "filesChanged": [],
  "validation": [],
  "risks": [],
  "nextSteps": []
}
```

## Regras de erro

Quando houver erro:

- declarar erro raiz conhecido;
- separar causa de sintoma;
- informar etapa afetada;
- informar se houve impacto em arquivos;
- recomendar rollback se necessario;
- registrar incidente quando high ou critical.

## Validacoes

Validacoes devem ser proporcionais ao risco:

- `low`: checagem documental;
- `medium`: revisao de consistencia e criterios;
- `high`: validacao local, QA e logs;
- `critical`: validacao humana, rollback e registro de decisao/incidente.

## Status operacionais

- `queued`: aguardando execucao;
- `running`: em execucao;
- `blocked`: bloqueado por dependencia, risco ou decisao;
- `failed`: falhou;
- `validated`: validado;
- `completed`: concluido;
- `rollback`: rollback necessario ou em andamento.
