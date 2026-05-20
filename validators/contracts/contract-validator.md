# Contract Validator

## Objetivo

Validar contratos entre agentes, workflows e runtime.

## Inputs obrigatorios

Validar presenca de:

- `project`;
- `objective`;
- `scope`;
- `context`;
- `constraints`;
- `successCriteria`;
- `riskLevel`;
- `requestedMode`.

## Outputs obrigatorios

Validar presenca de:

- `summary`;
- `actionsTaken`;
- `filesChanged`;
- `validation`;
- `risks`;
- `nextSteps`;
- `status`.

## Schema compatibility

Validar:

- execution object segue `runtime/executions/execution-object-schema.json`;
- status pertence ao modelo de runtime;
- logs possuem timestamp, event, level e message.

## Agent compatibility

Validar:

- agente existe no registry;
- agente esta `active`;
- agente e compativel com o projeto;
- agente possui permissao necessaria.

## Workflow compatibility

Validar:

- workflow existe;
- agentes do workflow existem;
- handoffs sao permitidos;
- gates humanos sao respeitados;
- criticidade esta declarada.
