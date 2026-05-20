# Platform Health Model

## Objetivo

Definir modelos de saude para plataforma, workflows, runtime, execucoes, projetos e agentes.

## Health score

Score sugerido: `0` a `100`.

- `90-100`: saudavel;
- `70-89`: atencao;
- `50-69`: degradado;
- `0-49`: critico.

## Workflow health

Sinais:

- ultima execucao;
- taxa de sucesso;
- falhas recentes;
- tempo medio;
- retries;
- checkpoints;
- incidentes.

## Runtime health

Sinais:

- execucoes presas;
- fila acumulada;
- deadlocks;
- loops;
- retries acima do normal;
- rollback pendente.

## Execution health

Sinais:

- status atual;
- tempo no estado;
- logs recentes;
- checkpoints;
- riscos;
- validacoes.

## Project health

Sinais:

- workflows ativos;
- incidentes abertos;
- dependencias criticas;
- agentes compativeis;
- memoria atualizada;
- risco operacional.

## Agent health

Sinais:

- status no registry;
- falhas em handoff;
- outputs fora de contrato;
- excesso de bloqueios;
- permissoes inadequadas;
- playbooks ausentes.
