# Scenario: Invalid Routing

## Objetivo

Simular agente selecionado fora de escopo ou incompatível com projeto.

## Falha simulada

Router seleciona agente sem compatibilidade com `promoclub007`.

## Resultado esperado

- roteamento bloqueado;
- status `blocked`;
- fallback para agente compativel;
- registro da inconsistencia.
