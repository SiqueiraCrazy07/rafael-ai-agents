# Execution Memory V1

## Objetivo

Persistir memoria operacional historica para que runtime, supervisor e router possam aprender com execucoes anteriores.

## Estrutura

```text
memory/
  executions/
  routing-decisions/
  recovery/
  health/
  workflows/
  incidents/generated/
```

## O que e salvo

### Incidentes

Destino:

```text
memory/incidents/generated/
```

Gerado por:

```bash
npm run supervisor:demo
```

### Health reports

Destino:

```text
memory/health/
```

Contem score da plataforma, agentes, workflows e resumo de eventos analisados.

### Workflow stability

Destino:

```text
memory/workflows/
```

Contem estabilidade por workflow, execucoes, completions, rollbacks, retries e score.

### Recovery recommendations

Destino:

```text
memory/recovery/
```

Contem recomendacoes de recovery, rollback e validacao humana.

### Routing decisions

Destino:

```text
memory/routing-decisions/
```

Gerado por:

```bash
npm run runtime:routing-demo
```

Contem request, candidatos, agente selecionado, health score, plano, grafo e handoff.

### Execution summaries

Destino:

```text
memory/executions/
```

Contem resumo de execucao roteada, agentes, status, checkpoints e telemetry.

## Como essa memoria melhora decisoes futuras

- Router pode comparar decisoes anteriores.
- Supervisor pode detectar agentes instaveis.
- Health score pode ser calculado historicamente.
- Recovery pode reutilizar recomendacoes anteriores.
- Workflows problematicos podem ser priorizados para correcao.
- Adaptive routing pode evitar agentes degradados.

## Limitacoes da V1

- Persistencia em arquivos JSON.
- Sem indice global.
- Sem deduplicacao historica.
- Sem expurgo/retencao.
- Sem banco.
- Sem agregacao temporal automatica.

## Evolucao futura

- Criar indice `memory/index.json`.
- Adicionar retention policy.
- Migrar para SQLite/PostgreSQL.
- Criar analytics historico.
- Conectar memory diretamente ao adaptive routing.
- Criar supervisor learning loop.
