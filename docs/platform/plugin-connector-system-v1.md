# Plugin + Connector System V1

## Objetivo

Criar a primeira camada oficial de extensibilidade modular do Rafael AI Agents, preservando governanca enterprise, runtime readonly e isolamento basico.

## Arquitetura

### Plugins

Arquivos:

- `plugins/runtime-plugin-registry.js`;
- `plugins/runtime-plugin-loader.js`;
- `plugins/runtime-plugin-manager.js`;
- `plugins/examples/readonly-telemetry-plugin.js`;
- `plugins/examples/readonly-dashboard-plugin.js`;
- `plugins/examples/invalid-destructive-plugin.js`.

O Plugin Registry valida:

- `pluginId`;
- `type`;
- `hooks`;
- `dependencies`;
- `readonly`;
- `enabled`;
- `version`.

Plugins com `readonly !== true`, hooks desconhecidos ou `destructiveActions=true` sao rejeitados e registrados como fallback seguro.

### Connectors

Arquivos:

- `connectors/runtime-connector-registry.js`;
- `connectors/runtime-connector-loader.js`;
- `connectors/runtime-connector-manager.js`;
- `connectors/examples/readonly-mock-connector.js`;
- `connectors/examples/unhealthy-readonly-connector.js`;
- `connectors/examples/invalid-ungoverned-connector.js`.

O Connector Registry valida:

- `connectorId`;
- `capabilities`;
- `readonly`;
- `enabled`;
- `authRequired`;
- `healthStatus`;
- `version`;
- `metadata`.

Connectors sem auth precisam declarar `metadata.governed=true`. Connectors destrutivos ou sem governanca sao rejeitados. Connectors unhealthy podem ser carregados, mas sao pulados em execucao.

## Hooks Suportados

- `beforeWorkflow`;
- `afterWorkflow`;
- `beforeDecision`;
- `afterDecision`;
- `beforeExecution`;
- `afterExecution`;
- `beforeTelemetry`;
- `afterTelemetry`.

Cada hook recebe um contexto clonado e readonly. O output tambem e validado para bloquear qualquer retorno com `destructiveActions=true`.

## Integracoes

A V1 integra de forma governada e declarativa com:

- Worker Runtime;
- Event Bus;
- Decision Engine;
- Telemetry;
- Dashboard API.

Nesta versao, a integracao e exercitada pelos demos atraves de contextos representativos. O runtime funcional existente nao e alterado e nenhum plugin ou connector executa efeitos externos.

Telemetry tambem passa a ler `memory/plugins/` e `memory/connectors/` como fontes observacionais, expondo contadores `pluginReports` e `connectorReports` nos relatorios agregados.

## Exemplos

Plugins:

- `readonly-telemetry-plugin`: observa lifecycle de telemetry e execution.
- `readonly-dashboard-plugin`: observa eventos para Dashboard API/Web.
- `invalid-destructive-plugin`: exemplo rejeitado para provar fallback.

Connectors:

- `readonly-mock-connector`: connector governado, readonly e healthy.
- `unhealthy-readonly-connector`: connector carregado, mas pulado por health.
- `invalid-ungoverned-connector`: exemplo rejeitado por falta de governanca e readonly falso.

## Persistencia

Relatorios sao persistidos em:

- `runtime-data/plugins/`;
- `memory/plugins/`;
- `runtime-data/connectors/`;
- `memory/connectors/`.

## Scripts

```bash
npm run plugins:demo
npm run connectors:demo
```

## Fallback Seguro

Garantias:

- plugins destrutivos sao rejeitados;
- connectors destrutivos sao rejeitados;
- connectors sem governanca sao rejeitados;
- connector unhealthy e pulado;
- hooks com erro nao derrubam o runtime;
- contexto de hook e clonado e readonly;
- nenhuma automacao ou projeto e alterado;
- nenhuma acao externa real e executada.

## Riscos

- O isolamento ainda e basico e roda no mesmo processo Node.
- Ainda nao ha sandbox por processo, assinatura de plugins ou marketplace.
- Dependencias declaradas ainda sao informativas.
- Ainda nao ha policy granular por capability.

## Readiness

Readiness: `plugin-connector-system-v1-ready`.

A plataforma agora possui extensibilidade modular inicial com registries, loaders, managers, exemplos readonly, fallback seguro e persistencia auditavel.
