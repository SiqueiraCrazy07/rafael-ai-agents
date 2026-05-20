# Agents

## Objetivo

Centralizar agentes operacionais reutilizaveis por frente de trabalho, produto ou capacidade.

Um agente e uma especificacao de comportamento: ele define missao, escopo, entradas, saidas, ferramentas permitidas, riscos e checklist de qualidade. Ele nao e necessariamente um script executavel.

## Como usar

1. Escolha a frente ou projeto adequado.
2. Leia o arquivo do agente antes de aciona-lo.
3. Combine o agente com um playbook quando houver processo operacional.
4. Registre decisoes relevantes em `memory/` ou `projects/`.
5. Use o agente dentro dos limites do escopo descrito.

## Exemplos

- `agents/01-pm/pm-estrategico.md`: decisao, priorizacao e roadmap.
- `agents/01-pm/discovery.md`: investigacao de problemas e oportunidades.
- `agents/02-site-vitrine/frontend-agent.md`: evolucao de frontend, UX e performance.
- `agents/02-site-vitrine/qa-agent.md`: validacao, qualidade e estabilidade.

## Boas praticas

- Manter agentes pequenos e especializados.
- Separar agente de playbook: agente define papel; playbook define processo.
- Evitar sobreposicao excessiva entre agentes.
- Explicitar riscos e limites.
- Atualizar agentes quando o processo real mudar.
- Nunca incluir tokens, senhas ou credenciais nos arquivos de agente.
