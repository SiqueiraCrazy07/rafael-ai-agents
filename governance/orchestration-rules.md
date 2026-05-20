# Orchestration Rules

## Objetivo

Definir regras de orquestracao entre agentes, limites de autonomia, workflows criticos, bloqueios, rollback e validacao humana.

## Quais agentes podem acionar outros

### PM Estrategico

Pode acionar:

- Discovery;
- PRD e Backlog;
- UX Produto;
- Metricas e Dados;
- Executivo.

### Discovery

Pode acionar:

- PM Estrategico;
- UX Produto;
- Metricas e Dados;
- PRD e Backlog quando houver validacao suficiente.

### PRD e Backlog

Pode acionar:

- Frontend Agent;
- Backend Agent;
- UX Produto;
- QA Agent.

### Frontend Agent

Pode acionar:

- UX Produto;
- SEO/CRO Agent;
- QA Agent;
- Backend Agent quando houver contrato de dados.

### Backend Agent

Pode acionar:

- QA Agent;
- Ofertas Agent;
- Frontend Agent;
- Metricas e Dados.

### Ofertas Agent

Pode acionar:

- Backend Agent;
- QA Agent;
- SEO/CRO Agent.

### QA Agent

Pode bloquear:

- deploy;
- publish;
- release frontend;
- alteracao de automacao.

QA pode acionar:

- Frontend Agent;
- Backend Agent;
- Ofertas Agent.

## Limites de autonomia

- Agentes podem analisar, documentar, implementar localmente e validar.
- Agentes nao podem alterar producao sem validacao humana.
- Agentes nao podem ampliar permissoes.
- Agentes nao podem ignorar QA em workflow high ou critical.
- Agentes nao podem apagar dados ou credenciais.

## Workflows criticos

Criticos:

- deploy de producao;
- alteracao de credenciais;
- alteracao de banco;
- alteracao de schema de ofertas;
- publicacao automatica em massa;
- rollback.

## Regras de bloqueio

Bloquear quando:

- cache invalido;
- QA falhou;
- dados rejeitados acima do esperado;
- queda anormal de ofertas;
- credencial ausente ou exposta;
- conflito entre agentes sem decisao humana;
- risco high/critical sem aprovacao.

## Regras de rollback

Rollback deve ser considerado quando:

- deploy causou regressao;
- dados incorretos foram publicados;
- automacao corrompeu cache;
- credencial foi exposta;
- incidente impacta usuario ou receita.

Rollback high/critical exige:

- registro em `memory/incidents`;
- validacao humana;
- resumo executivo;
- acao preventiva.

## Validacao humana obrigatoria

Obrigatoria para:

- criticidade high ou critical;
- mudanca em producao;
- mudanca em secrets;
- alteracao de permissao;
- deploy critico;
- decisao de ignorar falha de QA;
- rollback.
