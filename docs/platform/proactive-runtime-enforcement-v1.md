# Proactive Runtime Enforcement V1

## Objetivo

O Proactive Runtime Enforcement V1 permite que o runtime aplique acoes preventivas usando forecasts do Predictive Runtime Intelligence.

Na V1, o enforcement e declarativo: ele registra throttling, bloqueios, rerouting, gates humanos e triggers de recovery, mas nao altera producao nem executa mudancas destrutivas.

## Estrutura

Arquivos principais:

- `runtime/proactive/throttling/predictive-throttling-enforcer.js`
- `runtime/proactive/routing/predictive-routing-enforcer.js`
- `runtime/proactive/routing/predictive-workflow-blocker.js`
- `runtime/proactive/gates/predictive-human-gate-enforcer.js`
- `runtime/proactive/recovery/predictive-recovery-trigger.js`
- `runtime/proactive/enforcement/runtime-enforcement-coordinator.js`
- `runtime/proactive/enforcement/forecast-enforcement-policy-engine.js`
- `runtime/proactive/enforcement/proactive-runtime-coordinator.js`
- `runtime/proactive/proactive-runtime-demo.js`

Comando:

```bash
npm run proactive:demo
```

## Fluxo

1. Le o forecast mais recente em `memory/predictive/`.
2. Avalia a policy de enforcement.
3. Aplica throttling preventivo quando o risco esta alto.
4. Bloqueia workflows criticos com soft block declarativo.
5. Aplica rerouting preventivo para workers saturados.
6. Exige human gate para plataforma ou workflows criticos.
7. Dispara recovery preventivo para workers/runtime de risco.
8. Persiste relatorio em `runtime-data/proactive/` e `memory/proactive/`.

## Enforcers

### Predictive Throttling Enforcer

Aplica throttling declarativo quando o forecast recomenda reducao preventiva de concorrencia.

### Predictive Routing Enforcer

Cria regras para evitar workers saturados e proteger workflows guardados.

### Predictive Workflow Blocker

Bloqueia preventivamente workflows classificados como criticos pelo forecast.

Na V1, o bloqueio e `preventive-soft-block`: ele registra a decisao para consumo futuro pelo router/queue.

### Predictive Human Gate Enforcer

Exige validacao humana quando:

- health preditivo esta critico;
- workflow tem probabilidade de falha alta;
- o forecast recomenda gate.

### Predictive Recovery Trigger

Dispara verificacoes preventivas de recovery quando:

- worker tem saturacao critica;
- worker tem stale signals;
- runtime risk esta critico.

## Policy Engine

O `Forecast Enforcement Policy Engine` define:

- nivel de enforcement: `observe`, `guarded`, `strict`;
- se throttling automatico e permitido;
- se bloqueio de workflow e permitido;
- se rerouting preventivo e permitido;
- se gate humano e obrigatorio;
- se recovery preventivo pode ser disparado.

## Persistencia

Cada relatorio contem:

- `enforcementId`;
- `forecastId`;
- policy aplicada;
- resumo de acoes;
- actions;
- snapshot do forecast.

Persistencia:

- `runtime-data/proactive/`;
- `memory/proactive/`.

## Limites da V1

- Enforcement ainda e declarativo.
- Nao altera fila real em producao.
- Nao remove workers reais.
- Nao executa recovery real automaticamente.
- Nao altera PromoClub007.
- Nao altera automacoes atuais.

## Proximos Passos

- fazer Queue Manager consultar `runtime-data/proactive/` antes de executar;
- fazer Runtime Router aplicar rerouting preventivo;
- adicionar expiracao/cooldown para enforcement;
- criar override humano auditavel;
- alimentar Learning Engine com efetividade do proactive enforcement;
- criar dashboards de enforcement;
- promover soft block para hard block apenas com governanca explicita.
