# Orchestrator Validator

## Objetivo

Validar integridade da camada de orquestracao.

## Workflows quebrados

Detectar:

- workflow sem agentes;
- workflow sem gates;
- workflow sem status esperado;
- workflow que referencia agente inexistente.

## Handoffs invalidos

Detectar:

- handoff sem contexto minimo;
- handoff para agente sem permissao;
- handoff para agente incompativel com projeto;
- handoff high/critical sem gate humano.

## Loops de agentes

Detectar:

- agente A chama B e B chama A sem mudanca de estado;
- QA devolve para Frontend indefinidamente;
- retry aciona mesmo agente sem alterar input.

## Roteamento inconsistente

Detectar:

- router escolhe agente fora do registry;
- agente nao compativel com projeto;
- criticidade menor do que risco real;
- fallback amplia permissao indevidamente.

## Dependencias criticas ausentes

Detectar:

- registry ausente;
- contexto de projeto ausente;
- governanca ausente;
- contrato de agente ausente;
- runtime schema ausente.
