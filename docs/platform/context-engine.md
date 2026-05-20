# Context Engine

## Objetivo

Definir a arquitetura de contexto compartilhado para agentes, projetos e workflows.

O context engine e conceitual nesta fase: ele organiza onde o contexto vive, como deve ser lido, quando deve ser persistido e como evitar contaminacao entre projetos.

## Memoria compartilhada

Fontes:

- `memory/decisions`;
- `memory/incidents`;
- `memory/architecture`;
- `memory/projects`;
- `projects`;
- `registry`;
- `governance`.

## Preservacao de contexto

Contexto deve ser preservado quando:

- ha decisao arquitetural;
- ha incidente;
- ha mudanca de workflow;
- ha aprendizado operacional;
- ha nova dependencia critica.

## Isolamento entre projetos

Cada projeto deve ter contexto proprio em:

```text
projects/<project>.md
memory/projects/<project>/
```

Um agente so deve usar contexto de outro projeto quando a tarefa declarar reutilizacao ou comparacao.

## Versionamento contextual

Contexto e versionado pelo Git.

Regras:

- decisoes substituidas devem manter historico;
- incidentes resolvidos nao devem ser apagados;
- mudancas arquiteturais devem registrar data;
- registry deve refletir estado atual dos agentes.

## Contexto persistente

Persistir apenas o que tem valor futuro:

- decisao;
- incidente;
- convencao;
- risco;
- dependencia;
- regra;
- aprendizado recorrente.

Nao persistir:

- rascunhos irrelevantes;
- dados sensiveis;
- logs volumosos;
- tokens;
- contexto temporario sem valor operacional.
