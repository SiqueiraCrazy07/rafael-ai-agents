# Adaptive Routing V1

## Objetivo

Adaptive Routing V1 conecta o Runtime Router ao Supervisor Intelligence Layer para usar health score real dos agentes durante o roteamento.

## Fonte de health score

O router usa:

```text
supervisor/reports/generated/supervisor-report-*.json
```

O provider:

```text
orchestrator/runtime-router/supervisor-health-score-provider.js
```

le o relatorio mais recente, extrai `agentHealth` e retorna um mapa:

```json
{
  "site-backend-agent": 72,
  "site-qa-agent": 72
}
```

Quando nao ha relatorio, o fallback e `100`.

## Regras de roteamento

O score final considera:

- compatibilidade com projeto;
- permissoes;
- matching de capacidades;
- criticidade;
- health score do supervisor.

## Penalidades

- `healthScore < 60`: penalidade forte.
- `healthScore < 40`: agente deve ser evitado quando houver alternativa compativel.

Essas penalidades reduzem o score final, mas nao removem completamente o agente. Isso preserva fallback quando nao houver alternativa.

## Fluxo

```text
supervisor:demo
  -> gera relatorio
  -> agentHealth
  -> SupervisorHealthScoreProvider
  -> RuntimeRouter
  -> CapabilityMatcher
  -> routing decision
  -> execution plan
  -> runtime execution
```

## Comandos

Gerar relatorio do supervisor:

```bash
npm run supervisor:demo
```

Executar demo de adaptive routing:

```bash
npm run runtime:routing-demo
```

## Limitacoes da V1

- Health score vem do relatorio mais recente em arquivo local.
- Nao ha streaming de telemetry.
- Nao ha decay temporal de incidentes antigos.
- Nao ha separacao por tipo de workflow.
- Nao ha persistencia de routing decision em schema dedicado.

## Evolucao futura

- Health score por workflow.
- Health score por projeto.
- Decay temporal.
- Supervisor em tempo real.
- Routing com policy engine.
- Bloqueio automatico de agentes abaixo de threshold critico.
