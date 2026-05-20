# Observability Foundation

## Objetivo

Definir a base de observabilidade para agentes, workflows, automacoes e projetos.

Observabilidade deve permitir responder:

- o que executou;
- quando executou;
- qual agente ou workflow executou;
- qual entrada foi usada;
- qual saida foi gerada;
- se houve erro;
- qual foi o impacto;
- como depurar.

## Health checks

Health checks recomendados:

- arquivos obrigatorios existem;
- JSONs estao validos;
- credenciais esperadas estao configuradas localmente;
- conectores respondem;
- cache foi gerado recentemente;
- workflow terminou com sucesso;
- numero de registros processados esta dentro do esperado.

## Logs

Logs devem ser estruturados, preferencialmente JSON Lines.

Campos recomendados:

- `timestamp`;
- `level`;
- `event`;
- `project`;
- `workflow`;
- `agent`;
- `status`;
- `durationMs`;
- `message`;
- `errorCode`;
- `metadata`.

Nunca registrar tokens, senhas, cookies ou credenciais.

## Metricas

Metricas recomendadas:

- taxa de sucesso por workflow;
- tempo de execucao;
- quantidade de erros por etapa;
- quantidade de dados processados;
- quantidade de dados rejeitados;
- deploys aprovados e bloqueados;
- incidentes por severidade;
- tempo de recuperacao.

## Workflows

Cada workflow deve ter:

- nome;
- projeto;
- entrada;
- saida;
- etapas;
- logs;
- metricas;
- criterio de sucesso;
- criterio de bloqueio;
- dono.

## Rastreabilidade

Cada execucao deve permitir rastrear:

```text
projeto -> workflow -> agente -> entrada -> saida -> logs -> decisao/incidente
```

Para dados de ofertas:

```text
Google Sheets -> ingest -> validate -> normalize -> publish -> cache -> frontend/API
```

## Monitoramento operacional

Alertas recomendados:

- workflow falhou;
- cache nao foi atualizado;
- dados rejeitados acima do normal;
- credencial expirada;
- deploy bloqueado;
- queda brusca no volume de ofertas;
- erro recorrente em marketplace.

## Debugging

Processo recomendado:

1. Identificar workflow e etapa.
2. Ler logs mais recentes.
3. Verificar entrada e saida.
4. Reproduzir localmente quando possivel.
5. Isolar falha.
6. Aplicar correcao minima.
7. Validar.
8. Registrar decisao ou incidente se relevante.

Playbook relacionado:

```text
playbooks/automation-debugging.md
```
