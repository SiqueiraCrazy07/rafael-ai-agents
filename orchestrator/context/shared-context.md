# Shared Context

## Objetivo

Definir como contexto e compartilhado entre agentes sem misturar projetos, perder memoria operacional ou quebrar rastreabilidade.

## Contexto global

Contexto global vale para toda a plataforma.

Fontes:

- `docs/agent-operating-system.md`;
- `docs/platform/*.md`;
- `registry/agents-registry.json`;
- `governance/*.md`;
- `templates/*.md`.

Uso:

- regras gerais;
- padroes de agente;
- governanca;
- observabilidade;
- contratos.

## Contexto por projeto

Contexto de projeto vale apenas para um produto.

Fontes:

- `projects/promoclub007.md`;
- `projects/promoclub007-system-map.md`;
- `projects/promoclub007-agent-flow.md`;
- `memory/projects/promoclub007/`.

Uso:

- agentes compativeis;
- workflows locais;
- riscos especificos;
- dependencias;
- roadmap.

## Contexto temporario

Contexto temporario vale para uma execucao.

Inclui:

- pedido do usuario;
- arquivos lidos;
- comandos executados;
- saidas geradas;
- erros;
- decisoes durante a execucao.

Deve virar memoria persistente apenas quando gerar decisao, incidente ou mudanca arquitetural relevante.

## Persistencia de memoria

Persistir em:

- `memory/decisions/` para decisoes;
- `memory/incidents/` para falhas;
- `memory/architecture/` para mudancas estruturais;
- `memory/projects/<projeto>/` para contexto local.

## Handoff entre agentes

Todo handoff deve incluir:

- objetivo;
- projeto;
- agente anterior;
- agente seguinte;
- contexto relevante;
- arquivos afetados;
- riscos;
- status;
- decisao ou bloqueio pendente.

Formato recomendado:

```text
Projeto:
Objetivo:
Agente anterior:
Agente seguinte:
Contexto:
Arquivos:
Riscos:
Status:
Proxima acao:
```

## Regras

- Nao misturar contexto de projetos diferentes sem declarar.
- Nao carregar memoria irrelevante.
- Nao usar decisao antiga como regra se estiver substituida.
- Preservar rastreabilidade entre agente, workflow e projeto.
