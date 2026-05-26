# Runtime Recovery + Self-Healing V1

## Objetivo

Runtime Recovery + Self-Healing V1 cria uma camada readonly-safe para detectar falhas, reconstruir estado, localizar checkpoints restauraveis e gerar planos de self-healing supervisionados.

A V1 nao executa recovery real, nao altera workflows e nao faz mutacoes destrutivas.

## Arquivos

- `self-healing/runtime-recovery-engine.js`
- `self-healing/checkpoint-recovery-manager.js`
- `self-healing/failure-classification-engine.js`
- `self-healing/self-healing-planner.js`
- `self-healing/runtime-health-monitor.js`
- `self-healing/recovery-audit.js`
- `self-healing/demo/runtime-recovery-demo.js`

## Runtime Health Monitor

Detecta:

- worker unhealthy;
- workflow stalled;
- retry storm;
- queue saturation;
- checkpoint inconsistency;
- event stream gap;
- falhas registradas pela execution persistence.

## Failure Classification

Classifica:

- timeout;
- dependency failure;
- worker unavailable;
- queue overload;
- invalid state transition;
- checkpoint corruption;
- replay inconsistency.

Cada classificacao inclui severidade, elegibilidade de retry, evidencia e safety mode.

## Checkpoint Recovery

O manager:

- localiza ultimo checkpoint valido;
- valida marker de consistencia;
- prepara plano readonly-safe;
- bloqueia recovery destrutivo;
- exige human gate antes de qualquer recovery real futuro.

## Self-Healing Planner

Gera recomendacoes:

- reroute recommendation;
- retry recommendation;
- worker isolation recommendation;
- queue protection recommendation;
- replay recommendation;
- escalation recommendation.

O plano e supervisionado e possui `executeRecovery=false`.

## Recovery Engine

O engine:

- executa health scan readonly;
- usa Workflow Replay para reconstruir estado;
- classifica falhas;
- localiza checkpoint restauravel;
- restaura execution context como metadata;
- persiste recovery session;
- nao executa recovery real.

## Integracoes

- Workflow Replay: reconstrucao de timeline e estado.
- Execution Persistence: journal, failures e checkpoints.
- Event Bus: eventos e event stream gaps.
- Workers: unhealthy/stalled signals.
- Scheduler: retry/protected queue pressure.
- Telemetry: auditoria em `memory/self-healing/`.
- Dashboard: relatorio readonly pronto para exposicao futura.
- Autonomous Orchestrator: human gate e plano supervisionado.

## Persistencia

Relatorios em:

- `runtime-data/self-healing/`;
- `memory/self-healing/`.

## Script

```bash
npm run selfhealing:demo
```

## Fallback Seguro

- Diretorio ausente gera lista vazia e fallback.
- JSON invalido e registrado como read error.
- Checkpoint ausente bloqueia recovery.
- Replay inconsistente gera recomendacao de escalacao.
- Recovery real e bloqueado nesta V1.

## Riscos

- Plano depende da qualidade dos artefatos persistidos.
- Classificacao ainda e heuristica.
- Recovery real ainda exige uma fase futura com human gate.
- Dashboard/API ainda nao possuem endpoint dedicado para self-healing.

## Readiness

Readiness: `runtime-recovery-self-healing-v1-ready`.

A plataforma agora possui deteccao de falhas, classificacao, checkpoint recovery plan, self-healing recommendations, metadata de contexto e auditoria readonly-safe.
