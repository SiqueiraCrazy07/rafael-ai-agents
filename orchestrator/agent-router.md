# Agent Router

## Objetivo

Definir como agentes sao selecionados para atuar em uma demanda operacional.

O router nao executa agentes por si so. Ele define criterios de decisao para escolher o agente correto, o playbook aplicavel, a criticidade e o nivel de validacao humana necessario.

## Fontes de decisao

O roteamento deve consultar:

- `registry/agents-registry.json`;
- `projects/*.md`;
- `governance/agent-governance.md`;
- `governance/orchestration-rules.md`;
- playbooks aplicaveis;
- memoria operacional em `memory/`.

## Regras de roteamento

1. Identificar o projeto.
2. Identificar o tipo de tarefa.
3. Verificar agentes compativeis com o projeto.
4. Filtrar agentes por escopo.
5. Verificar permissoes necessarias.
6. Definir criticidade.
7. Selecionar playbook aplicavel.
8. Verificar necessidade de validacao humana.
9. Definir agente primario e agentes de apoio.
10. Registrar contexto e decisao quando houver impacto relevante.

## Prioridade

Ordem de prioridade para selecao:

1. Compatibilidade explicita com o projeto.
2. Escopo mais especifico.
3. Permissao adequada.
4. Menor criticidade suficiente.
5. Playbook mais proximo.
6. Historico em memoria operacional.

Exemplo: uma mudanca em cache de ofertas do PromoClub007 deve priorizar `site-backend-agent` e `site-ofertas-agent`, nao um agente PM generico.

## Criticidade

Criticidade deve seguir `governance/agent-governance.md`:

- `low`: documentacao e analise;
- `medium`: produto, UX, dados e priorizacao;
- `high`: codigo, automacao, cache, integracao e deploy;
- `critical`: producao, banco, secrets, seguranca e rollback.

Quanto maior a criticidade, maior a exigencia de QA, registro e validacao humana.

## Fallback

Quando nao houver agente especifico:

1. Usar agente mais proximo por escopo.
2. Reduzir autonomia para modo analise.
3. Solicitar contexto adicional se houver risco.
4. Registrar lacuna no projeto.
5. Recomendar criacao de novo agente se a tarefa for recorrente.

Fallback nunca deve ampliar permissao automaticamente.

## Resolucao de conflito

Conflitos comuns:

- dois agentes recomendam caminhos diferentes;
- um agente quer executar e outro recomenda bloquear;
- dados indicam uma decisao, mas UX/QA aponta risco;
- automacao esta correta tecnicamente, mas risco de produto e alto.

Regra de resolucao:

1. Agente de QA pode bloquear release por risco critico.
2. Governanca prevalece sobre velocidade.
3. Owner do projeto decide tradeoffs de produto.
4. Mudancas high e critical exigem validacao humana.
5. Decisoes relevantes devem ser registradas em `memory/decisions`.
