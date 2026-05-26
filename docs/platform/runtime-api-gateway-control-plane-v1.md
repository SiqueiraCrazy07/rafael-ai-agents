# Runtime API Gateway + External Control Plane V1

## Objetivo

Runtime API Gateway + External Control Plane V1 cria uma camada local readonly-safe para expor inspecao do runtime distribuido com governanca, RBAC, tenant scope, rate limiting, envelopes padronizados e auditoria.

Esta V1 nao abre API publica externa, nao executa mutacoes e nao implementa OAuth/JWT real.

## Arquivos

- `api/gateway/runtime-api-gateway.js`
- `api/gateway/runtime-route-registry.js`
- `api/gateway/runtime-request-validator.js`
- `api/gateway/runtime-response-envelope.js`
- `api/gateway/runtime-control-plane.js`
- `api/gateway/runtime-api-audit.js`
- `api/gateway/runtime-api-versioning.js`
- `api/gateway/runtime-api-rate-limit.js`
- `api/gateway/demo/runtime-api-gateway-demo.js`

## Endpoints

Namespace: `/api-gateway/v1`.

- `GET /runtime/status`
- `GET /runtime/workers`
- `GET /runtime/queue`
- `GET /runtime/replay`
- `GET /runtime/recovery`
- `GET /runtime/streams`
- `GET /runtime/replication`
- `GET /runtime/telemetry`
- `GET /runtime/dashboard`

## Route Registry

Cada rota registra:

- path;
- metodo `GET`;
- permissao RBAC;
- fonte de leitura em `memory/`;
- control plane inspection;
- tenant scope;
- contrato readonly-safe.

## Request Validator

O validator:

- valida schema minimo;
- bloqueia metodos destrutivos;
- bloqueia payloads com chaves destrutivas;
- injeta `requestId`;
- injeta `correlationId`;
- preserva tenant metadata.

## Response Envelope

Toda resposta inclui:

- `requestId`;
- `correlationId`;
- `tenantId`;
- `source`;
- `timestamp`;
- fallback metadata;
- `readErrors`;
- warnings;
- `readonly=true`.

## Control Plane

O control plane faz inspecao readonly de:

- runtime;
- cluster;
- workers;
- queue;
- replay;
- recovery;
- streams;
- replication;
- telemetry;
- dashboard.

## RBAC Enforcement

O gateway usa `RuntimeAuthManager` para aplicar:

- token local;
- role;
- permissao por rota;
- tenant scope;
- deny-by-default;
- bloqueio cross-tenant.

## Rate Limit

Rate limit V1 e local e metadata-only:

- limite por tenant/rota;
- burst protection;
- stream protection metadata;
- violacoes entram no audit.

## API Audit

Audita:

- requests;
- denied requests;
- RBAC violations;
- tenant violations;
- rate limit violations;
- fontes e fallback.

## Integracoes

- Auth/RBAC;
- Streaming;
- Replay;
- Recovery/Self-Healing;
- Distributed Runtime;
- Distributed Queue;
- Replication;
- Telemetry;
- Dashboard;
- Redis Streams;
- Multi-process Workers.

## Persistencia

Relatorios em:

- `runtime-data/api-gateway/`;
- `memory/api-gateway/`.

## Script

```bash
npm run api-gateway:demo
```

## Fallback Seguro

- Rota desconhecida: deny readonly-safe.
- Token invalido: deny readonly-safe.
- Permissao insuficiente: deny readonly-safe.
- Tenant divergente: deny readonly-safe.
- Rate limit excedido: deny readonly-safe.
- Fonte ausente: envelope com fallback JSON.

## Riscos

- Gateway e local/simulado nesta V1.
- OAuth/JWT real permanecem fora de escopo.
- Rate limit e in-memory para demo.
- Operacoes de control plane com escrita exigem fase futura e human gate.

## Readiness

Readiness: `runtime-api-gateway-control-plane-v1-ready`.

A plataforma passa a ter um gateway governado, auditavel, readonly-safe e preparado para expor o runtime distribuido em fases futuras.
