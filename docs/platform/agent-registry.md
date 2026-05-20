# Agent Registry

## Conceito

O registry e o catalogo operacional dos agentes disponiveis na plataforma.

Ele responde:

- quais agentes existem;
- qual e a missao de cada agente;
- onde cada agente pode atuar;
- quais permissoes possui;
- quais playbooks usa;
- quais riscos carrega;
- qual e sua criticidade e status.

Arquivo principal:

```text
registry/agents-registry.json
```

## Como cadastrar novos agentes

1. Criar ou atualizar o arquivo do agente em `agents/`.
2. Adicionar entrada em `registry/agents-registry.json`.
3. Definir `id`, `nome`, `missao` e `escopo`.
4. Declarar permissoes.
5. Declarar projetos compativeis.
6. Declarar entradas e saidas.
7. Relacionar playbooks aplicaveis.
8. Definir owner, criticidade e status.
9. Revisar riscos antes de usar em workflows.

## Padroes de naming

IDs devem ser:

- minusculos;
- sem acentos;
- separados por hifen;
- estaveis ao longo do tempo;
- especificos o suficiente para evitar colisao.

Exemplos:

- `pm-estrategico`
- `site-frontend-agent`
- `site-qa-agent`
- `analytics-agent`
- `scheduler-agent`

## Versionamento

O registry possui `version` no topo do JSON.

Atualize a versao quando houver:

- mudanca de schema;
- mudanca de semantica de permissoes;
- mudanca relevante no lifecycle;
- migracao de formato.

Mudancas simples de cadastro nao exigem nova versao de schema, mas devem ser rastreadas pelo Git.

## Lifecycle

Estados permitidos:

- `draft`: agente em definicao;
- `active`: agente pronto para uso;
- `deprecated`: agente substituido, mas ainda documentado;
- `blocked`: agente temporariamente bloqueado por risco, incidente ou dependencia.

## Compatibilidade entre projetos

Um agente pode atuar em varios projetos, mas a compatibilidade deve ser explicita.

Antes de usar um agente em novo projeto:

1. Confirmar escopo.
2. Confirmar permissoes.
3. Verificar riscos locais.
4. Relacionar playbooks.
5. Registrar no registry.

Essa regra evita que agentes especializados em um produto sejam usados fora de contexto.
