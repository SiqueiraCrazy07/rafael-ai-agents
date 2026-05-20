# Playbooks

## Objetivo

Padronizar processos operacionais executados por agentes, humanos ou fluxos automatizados.

Um playbook descreve quando usar um processo, quais agentes entram, quais entradas sao necessarias, quais passos seguir, quais saidas produzir e quais criterios de qualidade aplicar.

## Como usar

1. Escolha o playbook mais proximo da tarefa.
2. Identifique os agentes envolvidos.
3. Reuna as entradas necessarias.
4. Execute o passo a passo.
5. Valide os criterios de qualidade.
6. Registre decisoes relevantes.

## Exemplos

- `pm-product-discovery.md`: discovery de produto.
- `ux-review.md`: revisao de experiencia e fluxos.
- `qa-validation.md`: validacao de qualidade antes de release.
- `frontend-change-review.md`: revisao de mudancas frontend.
- `automation-debugging.md`: depuracao de automacoes.
- `github-actions-debugging.md`: analise de falhas em CI/CD.

## Boas praticas

- Usar playbooks para reduzir improviso operacional.
- Nao misturar decisao estrategica com alteracao tecnica sem registrar contexto.
- Manter passos verificaveis.
- Declarar criterios de bloqueio.
- Atualizar playbooks apos incidentes ou aprendizados.
- Nunca autorizar mudancas destrutivas sem revisao explicita.
