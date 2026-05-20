# Registry Validator

## Objetivo

Validar integridade operacional do registry.

## Agentes duplicados

Detectar:

- IDs repetidos;
- nomes ambiguos;
- agentes com mesmo escopo e permissoes sem justificativa.

## Agentes orfaos

Detectar:

- agente sem projeto compativel;
- agente sem playbook;
- agente sem owner;
- agente sem arquivo correspondente em `agents/`.

## Permissoes invalidas

Permissoes validas:

- `read`
- `write-docs`
- `write-code`
- `run-local-validation`
- `deploy-review`

Qualquer permissao fora dessa lista deve falhar.

## Projetos inexistentes

Validar se projetos compativeis possuem mapa em `projects/` ou foram declarados como futuros.

## Playbooks ausentes

Validar se caminhos em `playbooks` existem.

Playbook ausente deve gerar warning ou erro conforme criticidade do agente.
