# Learning Engine V1

## Objetivo

Permitir que o Agent Operating System aprenda com memoria operacional historica.

## Fontes de memoria

```text
memory/incidents/generated/
memory/health/
memory/workflows/
memory/recovery/
memory/routing-decisions/
memory/executions/
```

## Analisadores

- Incident Pattern Analyzer
- Workflow Failure Pattern Detector
- Routing Decision Analyzer
- Recovery Effectiveness Analyzer
- Agent Reliability Scorer
- Workflow Risk Scorer
- Historical Stability Analyzer
- Recommendation Engine

## Demo

```bash
npm run learning:demo
```

O demo:

- le `memory/`;
- detecta padroes historicos;
- calcula confiabilidade de agentes;
- detecta workflows criticos;
- detecta recoveries eficientes;
- gera recomendacoes operacionais.

## Como usar os resultados

- Adaptive routing pode reduzir preferencia por agentes instaveis.
- Supervisor pode converter recomendacoes recorrentes em politicas.
- Workflows com alto risco podem exigir checkpoints extras.
- Recovery patterns podem virar regras de self-healing.

## Limitacoes da V1

- Sem persistencia dos resultados do learning.
- Sem janela temporal configuravel.
- Sem decay de incidentes antigos.
- Sem modelo estatistico avancado.
- Sem integracao direta no router.

## Proximos passos

- Persistir learning reports.
- Adicionar retention/decay temporal.
- Integrar risk score ao Runtime Router.
- Gerar policies automaticamente para Supervisor.
- Criar dashboards de aprendizado operacional.
