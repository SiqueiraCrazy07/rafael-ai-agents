# Runtime Context Engine

## Objetivo

Definir como o runtime carrega, isola, atualiza e recupera contexto durante execucoes.

## Contexto temporario

Existe apenas durante a execucao.

Inclui:

- prompt ou solicitacao;
- arquivos lidos;
- comandos executados;
- resultados;
- erros;
- decisoes intermediarias.

## Contexto persistente

Vive fora da execucao.

Fontes:

- `memory/decisions`;
- `memory/incidents`;
- `memory/architecture`;
- `memory/projects`;
- `projects`;
- `registry`;
- `governance`.

## Contexto compartilhado

Contexto passado entre agentes por handoff.

Deve conter:

- objetivo;
- projeto;
- agente atual;
- proximo agente;
- estado;
- arquivos;
- riscos;
- bloqueios;
- outputs relevantes.

## Isolamento por projeto

Cada execucao deve declarar `project`.

Contexto de outro projeto so pode ser usado quando:

- solicitado explicitamente;
- documentado como referencia;
- nao introduz risco de acoplamento indevido.

## Contexto de execucao

O execution object deve registrar:

- `executionId`;
- `project`;
- `workflow`;
- `agents`;
- `status`;
- `logs`;
- `checkpoints`;
- `decisions`;
- `outputs`;
- `risks`.

## Recuperacao de contexto

Em falha:

1. Ler ultimo checkpoint valido.
2. Recarregar contexto persistente do projeto.
3. Reconstituir logs e outputs.
4. Identificar etapa falha.
5. Retomar, bloquear ou rollback conforme criticidade.
