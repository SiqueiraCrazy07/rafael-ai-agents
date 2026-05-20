# Registry

## Objetivo

Centralizar o cadastro operacional dos agentes disponiveis na plataforma.

O registry permite saber quais agentes existem, onde podem atuar, quais permissoes possuem, quais playbooks usam, quais riscos carregam e qual e o status operacional de cada um.

## Como usar

1. Consulte `agents-registry.json` antes de reutilizar um agente em um projeto.
2. Cadastre novos agentes seguindo o schema padrao.
3. Atualize compatibilidade quando um agente passar a atuar em novo projeto.
4. Revise criticidade e permissoes antes de usar em fluxos sensiveis.

## Boas praticas

- Manter IDs estaveis.
- Usar nomes claros e especificos.
- Separar permissao de leitura, escrita, deploy e producao.
- Registrar riscos e playbooks aplicaveis.
- Atualizar status quando agente estiver em draft, ativo, deprecated ou bloqueado.
