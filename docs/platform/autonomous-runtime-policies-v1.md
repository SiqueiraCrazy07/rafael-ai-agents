# Autonomous Runtime Policies V1

## Objetivo

A camada de Autonomous Runtime Policies V1 permite que o runtime transforme sinais historicos e operacionais em decisoes automaticas antes de executar ou rotear workflows.

Ela combina:

- memoria operacional em `memory/`;
- analises do Learning Engine;
- relatorios do Supervisor Intelligence Layer;
- sinais do Adaptive Routing;
- historico de execucoes em `runtime-data/`.

Na V1, as politicas sao declarativas: elas geram decisoes persistidas, mas nao executam rollback real, deploy, alteracao de producao ou bloqueio fisico de workflows.

## Componentes

### Runtime Policy Engine

Arquivo principal:

- `runtime/policies/runtime-policy-engine.js`

Responsabilidades:

- carregar memoria operacional;
- recalcular sinais do Learning Engine;
- ler o relatorio mais recente do supervisor;
- avaliar politicas;
- consolidar decisoes;
- persistir artefatos em `runtime-data/policies/` e `memory/policies/`.

### Runtime Policy Demo

Arquivo:

- `runtime/policies/runtime-policy-demo.js`

Comando:

```bash
npm run runtime:policy-demo
```

O demo mostra:

- politicas disparadas;
- workflows bloqueados;
- agentes penalizados;
- throttling aplicado;
- rollback recomendado;
- gates humanos exigidos.

## Politicas V1

### unstable-agent-routing-block

Avalia health score e confiabilidade historica de agentes.

Comportamento:

- agentes abaixo de 60 sao marcados para bloqueio de roteamento;
- agentes instaveis ou abaixo de 80 recebem penalidade;
- a decisao nao remove agentes do registry, apenas gera enforcement declarativo.

### critical-workflow-human-gate

Avalia workflows com risco alto, baixa estabilidade ou status instavel.

Comportamento:

- exige gate humano antes da execucao;
- aplica principalmente em workflows com `riskScore >= 80` ou `stabilityScore < 60`;
- preserva a rastreabilidade do motivo da exigencia.

### automatic-rollback-recommendation

Consolida sinais de rollback vindos do supervisor e do Learning Engine.

Comportamento:

- recomenda rollback quando ha incidente severo ou risco critico;
- marca se a decisao exige revisao humana;
- nao executa rollback automaticamente na V1.

### adaptive-throttling

Reduz agressividade operacional quando a plataforma ou workflows estao degradados.

Comportamento:

- plataforma com health score abaixo de 60 entra em modo conservador;
- workflows com risco acima de 70 recebem limite de concorrencia;
- workflows com risco alto exigem checkpoint antes de handoff.

### retry-limit-protection

Protege o runtime contra loops de retry e repeticao de falhas.

Comportamento:

- workflows com retry esgotado podem ser bloqueados;
- workflows com retry arriscado exigem gate humano;
- workflows marcados como risco alto pelo Learning Engine podem ser bloqueados ate validacao.

## Persistencia

Cada execucao do policy demo grava a mesma decisao em dois lugares:

- `runtime-data/policies/`: estado operacional do runtime;
- `memory/policies/`: memoria historica para aprendizado e auditoria.

O objeto de decisao contem:

- `decisionId`;
- `generatedAt`;
- `source`;
- `status`;
- `policiesTriggered`;
- `blockedWorkflows`;
- `penalizedAgents`;
- `throttlingApplied`;
- `rollbackRecommended`;
- `humanGatesRequired`;
- `decisions`;
- snapshots resumidos de learning e supervisor.

## Reacao automatica do runtime

Na V1, a reacao automatica acontece em tres niveis:

1. Decisao: o engine identifica risco e gera uma acao declarativa.
2. Persistencia: a decisao fica disponivel para router, supervisor e runtime.
3. Auditoria: a decisao entra na memoria operacional para aprendizado futuro.

A execucao real da acao fica para a proxima versao, quando o router e a fila poderao consumir `runtime-data/policies/` antes de selecionar agentes ou iniciar workflows.

## Limites de seguranca

- Nenhuma politica executa rollback real.
- Nenhuma politica altera producao.
- Nenhuma politica remove agentes do registry.
- Nenhuma politica modifica workflows existentes.
- Toda acao critica e registrada como recomendacao, gate ou bloqueio declarativo.

## Evolucao recomendada

Proximos passos:

- fazer o Runtime Router consultar `runtime-data/policies/` antes da selecao final;
- adicionar cooldown e expiracao de decisoes;
- criar override humano para liberar workflows bloqueados;
- persistir learning outputs versionados;
- conectar politicas ao Queue Manager V1;
- criar dashboard operacional;
- transformar recomendacoes recorrentes em regras de governanca;
- adicionar testes automatizados para cada politica.
