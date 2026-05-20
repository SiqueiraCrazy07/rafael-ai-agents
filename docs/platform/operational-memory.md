# Operational Memory

## Objetivo

Definir como preservar contexto operacional entre agentes, projetos, decisoes, incidentes e mudancas arquiteturais.

Memoria operacional reduz retrabalho, melhora rastreabilidade e evita que agentes repitam decisoes sem conhecer historico.

## Como registrar decisoes

Use:

```text
memory/decisions/decision-template.md
```

Registre:

- data;
- status;
- contexto;
- decisao;
- alternativas consideradas;
- impacto;
- riscos;
- mitigacoes;
- revisao futura.

Quando registrar:

- mudanca de arquitetura;
- mudanca de processo;
- mudanca de ferramenta;
- decisao de deploy;
- alteracao de fluxo critico;
- escolha entre alternativas tecnicas.

## Como registrar incidentes

Use:

```text
memory/incidents/incident-template.md
```

Registre:

- data;
- severidade;
- status;
- impacto;
- linha do tempo;
- causa raiz;
- correcao;
- validacao;
- acoes preventivas.

Incidentes devem virar aprendizado operacional e, quando necessario, atualizar playbooks.

## Como registrar mudancas arquiteturais

Use:

```text
memory/architecture/
```

Registre mudancas quando:

- novo workflow entra em producao;
- novo conector e adotado;
- schema muda;
- cache/API muda;
- permissao operacional muda;
- um sistema externo passa a ser dependencia critica.

## Como preservar contexto entre agentes

1. Registrar decisoes em `memory/`.
2. Linkar projeto afetado em `projects/`.
3. Atualizar registry quando agente mudar escopo.
4. Atualizar playbooks quando processo mudar.
5. Atualizar docs quando arquitetura formal mudar.

Agentes devem consultar memoria antes de alterar fluxos criticos.

## Regras

- Nao incluir credenciais.
- Separar fato, hipotese e decisao.
- Registrar impacto e riscos.
- Marcar decisoes substituidas.
- Manter linguagem objetiva.
