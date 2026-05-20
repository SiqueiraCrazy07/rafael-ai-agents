# Agent Governance

## Objetivo

Definir regras de governanca para uso de agentes em ambientes operacionais, especialmente quando houver risco de producao, dados, deploy, credenciais ou experiencia do usuario.

## Niveis de criticidade

### Low

Atividades documentais ou analiticas sem impacto direto em produto.

Exemplos:

- criar documento;
- revisar texto;
- organizar backlog;
- sintetizar contexto.

### Medium

Atividades que influenciam produto, UX, dados ou priorizacao, mas nao alteram producao diretamente.

Exemplos:

- revisar UX;
- propor PRD;
- analisar metricas;
- atualizar playbook.

### High

Atividades que alteram codigo, automacao, cache, integracao, deploy ou fluxo operacional.

Exemplos:

- alterar ingestao;
- alterar frontend;
- gerar cache para publicacao;
- mudar validacao de dados;
- alterar workflow de deploy.

### Critical

Atividades com impacto direto em producao, credenciais, banco, dados sensiveis, billing, seguranca ou rollback.

Exemplos:

- alterar banco de producao;
- publicar deploy critico;
- mudar secrets;
- remover dados;
- alterar permissoes.

## Quais agentes podem alterar producao

Padrao atual: nenhum agente pode alterar producao diretamente sem validacao humana.

Agentes podem preparar mudancas, validar, documentar e recomendar. Deploy ou alteracao em producao exige revisao humana quando houver risco medium, high ou critical.

## Agentes que exigem validacao humana

Exigem validacao humana para mudancas high ou critical:

- Backend Agent;
- Frontend Agent;
- QA Agent;
- Ofertas Agent;
- qualquer agente que altere automacao, dados, deploy ou integracao.

Agentes documentais tambem exigem validacao quando a decisao afetar roadmap, producao ou seguranca.

## Regras de seguranca

- Nao expor tokens, senhas, cookies ou credenciais.
- Nao alterar banco de producao diretamente.
- Nao executar mudancas destrutivas sem pedido explicito.
- Nao remover funcionalidade sem validacao.
- Nao ampliar permissoes sem justificativa.
- Nao publicar cache ou deploy sem QA quando houver risco relevante.
- Registrar decisoes criticas em `memory/decisions`.
- Registrar incidentes em `memory/incidents`.

## Limites de atuacao

Agentes podem:

- analisar;
- documentar;
- propor;
- implementar em ambiente local;
- validar localmente;
- preparar PR;
- gerar relatorio.

Agentes nao podem sem autorizacao:

- fazer deploy de producao;
- alterar secrets;
- apagar dados;
- alterar billing;
- mudar permissoes;
- ignorar checks;
- reverter alteracoes de usuario.

## Gates recomendados

- QA antes de deploy.
- Revisao humana para high e critical.
- Registro de decisao para mudanca arquitetural.
- Registro de incidente para falha operacional.
- Conferencia de `git status` antes de finalizar.
