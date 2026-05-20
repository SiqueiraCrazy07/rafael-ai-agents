# Enterprise Architecture Governance V1

## Objetivo

Formalizar a governanca arquitetural do Rafael AI Agents como plataforma operacional modular enterprise.

Esta camada define principios, gates, checklist de review, roadmap governance e politica de aprovacao de mudancas.

## Arquivos

- `governance/platform-architecture-principles.md`
- `governance/enterprise-review-checklist.md`
- `governance/runtime-quality-gates.md`
- `governance/roadmap-governance.md`
- `governance/change-approval-policy.md`
- `validators/governance/governance-checklist-validator.js`

## Visao Enterprise

Rafael AI Agents deve evoluir como plataforma operacional modular, com separacao clara entre runtime, memoria, governanca, validadores, orquestracao e projetos.

O objetivo enterprise e reduzir acoplamento, preservar auditabilidade, permitir fallback seguro e manter compatibilidade retroativa enquanto novos modulos sao adicionados.

## Principios Obrigatorios

- Modulos com fronteiras claras.
- Persistencia auditavel em `memory/` e `runtime-data/`.
- Planos declarativos antes de efeitos reais.
- Human gate para risco alto.
- Compatibilidade retroativa por padrao.
- Isolamento entre projetos.
- Segurança operacional em mudancas destrutivas ou externas.

## Anti-Patterns Proibidos

- Acoplar plataforma a PromoClub007.
- Persistir apenas em console.
- Alterar automacoes atuais sem pedido explicito.
- Criar efeito runtime sem fallback.
- Quebrar scripts existentes.
- Misturar dados globais e dados de projeto sem escopo.

## Checklist de Feature

Antes de qualquer feature, revisar:

- arquitetura;
- modularidade;
- persistencia;
- observabilidade;
- fallback;
- validacao;
- impacto em runtime;
- impacto em `memory/`;
- impacto em `runtime-data/`;
- impacto em projetos;
- risco de acoplamento;
- rollback.

O checklist completo esta em `governance/enterprise-review-checklist.md`.

## Quality Gates

Os gates obrigatorios cobrem:

- arquitetura;
- runtime;
- persistencia;
- observabilidade;
- fallback;
- isolamento entre projetos;
- compatibilidade retroativa;
- segurança operacional;
- validacao.

## Validacao

Executar:

```bash
npm run governance:validate
```

O validador verifica se os arquivos de governanca existem e se possuem secoes minimas obrigatorias.

## Fallback Seguro

Governanca V1 nao altera runtime funcional.

Quando um documento ou secao obrigatoria estiver ausente, o validador falha com mensagem clara. A plataforma continua operacional, mas a feature deve ser bloqueada ate a governanca ser corrigida.

## Proximos Passos

- Integrar `governance:validate` ao fluxo padrao de validacao.
- Adicionar templates de decision record.
- Criar score de maturidade arquitetural por feature.
- Fazer o Runtime Decision Engine consumir sinais de governanca quando uma feature afetar runtime.
