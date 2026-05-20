# AI Supervisor

## Objetivo

Definir a camada de AI Supervisor da plataforma.

O AI Supervisor observa execucoes, detecta anomalias, classifica risco, recomenda recovery, aciona bloqueios e prepara rollback quando necessario.

## Runtime supervision

Supervisiona:

- estado;
- tempo de execucao;
- retries;
- checkpoints;
- logs;
- handoffs;
- outputs;
- riscos.

## Anomaly detection

Detecta:

- loops;
- deadlocks;
- queue starvation;
- retries excessivos;
- handoffs invalidos;
- falhas repetidas;
- ausencia de checkpoints;
- queda anormal de outputs.

## Operational recovery

Pode recomendar:

- retry;
- recovery por checkpoint;
- fallback;
- bloqueio;
- rollback;
- escalonamento humano.

## Autonomous governance

Autonomia deve respeitar governanca:

- low/medium podem ter recovery automatico quando seguro;
- high exige validacao humana para acao com efeito externo;
- critical exige humano imediato.

## Supervised autonomy

O objetivo nao e autonomia irrestrita.

Modelo:

```text
detectar -> classificar -> recomendar -> executar apenas se seguro -> registrar
```

Para high/critical:

```text
detectar -> bloquear -> recomendar -> humano decide -> registrar
```
