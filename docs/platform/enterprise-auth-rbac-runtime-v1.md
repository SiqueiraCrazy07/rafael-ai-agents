# Enterprise Auth + RBAC Runtime V1

## Objetivo

Enterprise Auth + RBAC Runtime V1 cria uma camada local readonly-safe de autenticacao, autorizacao e RBAC para proteger operacoes criticas do runtime distribuido.

A V1 nao implementa OAuth, JWT real ou autenticacao externa. O objetivo e formalizar contratos, roles, permissoes, sessoes, tenant scope e auditoria operacional sem permitir mutacoes destrutivas.

## Arquivos

- `governance/auth/runtime-auth-manager.js`
- `governance/auth/runtime-token-manager.js`
- `governance/auth/runtime-rbac-engine.js`
- `governance/auth/runtime-permission-registry.js`
- `governance/auth/runtime-session-manager.js`
- `governance/auth/runtime-auth-audit.js`
- `governance/auth/runtime-role-policies.js`
- `governance/auth/runtime-tenant-scope.js`
- `governance/auth/demo/runtime-auth-demo.js`

## Roles

Roles suportadas:

- `admin`
- `operator`
- `observer`
- `auditor`
- `replay-operator`
- `runtime-manager`

Todas as roles sao readonly-safe. Operacoes destrutivas, acesso a secrets, mutacao de runtime, execucao de replay real, recovery real e execucao de workers sao negadas nesta V1.

## Permissoes

Permissoes registradas:

- `replay:read`
- `recovery:plan`
- `stream:subscribe`
- `stream:admin`
- `queue:read`
- `worker:read`
- `dashboard:access`
- `transport:visibility`
- `replication:visibility`

Permissoes desconhecidas sao negadas por padrao.

## Auth Manager

O Auth Manager coordena:

- autenticacao local readonly-safe;
- metadata de identidade runtime;
- token local simulado;
- sessao;
- tenant scope;
- autorizacao via RBAC;
- auditoria de eventos permitidos e negados.

## Token Manager

O Token Manager emite tokens locais simulados com:

- `identityId`;
- `role`;
- `tenantId`;
- `issuedAt`;
- `expiresAt`;
- metadata de sessao;
- `externalProvider=false`.

Token ausente, invalido ou expirado gera deny readonly-safe.

## RBAC Engine

O RBAC Engine:

- valida role;
- valida permissao;
- bloqueia padroes destrutivos;
- nega `:execute`, `:mutate`, `secrets:*`, `filesystem:write` e `network:external`;
- gera recomendacao de escalacao quando necessario.

## Session Manager

O Session Manager registra:

- sessoes locais;
- expiracao;
- stale session detection;
- recomendacao de reautenticacao.

## Tenant Scope

Tenant Scope registra:

- `tenantId`;
- projeto;
- runtime node;
- boundary de dados;
- isolamento declarativo;
- readiness para multi-tenant futuro.

Acesso cross-tenant e negado por padrao.

## Auth Audit

Persistencia de auditoria:

- auth events;
- denied operations;
- permission violations;
- escalation recommendation;
- session metadata;
- tenant metadata.

## Integracoes

- Streaming: protege `stream:subscribe` e `stream:admin`.
- Replay: protege `replay:read` e bloqueia replay real.
- Recovery/Self-Healing: protege `recovery:plan` e bloqueia recovery real.
- Distributed Runtime: protege visibilidade de workers e transporte.
- Distributed Queue: protege `queue:read`.
- Dashboard: protege `dashboard:access`.
- Transport: protege `transport:visibility`.
- Telemetry: consumida em modo dashboard readonly.

## Persistencia

Relatorios em:

- `runtime-data/auth/`;
- `memory/auth/`.

## Script

```bash
npm run auth:demo
```

## Fallback Seguro

- Token invalido: deny readonly-safe.
- Role desconhecida: deny readonly-safe.
- Permissao desconhecida: deny readonly-safe.
- Operacao destrutiva: deny readonly-safe.
- Cross-tenant: deny readonly-safe.
- Sessao expirada: exige reautenticacao local.

## Riscos

- Auth e local e simulada nesta V1.
- OAuth/JWT real exigem fase futura.
- Integracao com secrets deve passar por governanca.
- Multi-tenant real ainda depende de storage isolation e API enforcement.

## Readiness

Readiness: `enterprise-auth-rbac-runtime-v1-ready`.

A plataforma passa a ter uma camada governada de Auth/RBAC readonly-safe com roles, permissoes, sessoes, tenant scope, auditoria e deny-by-default para operacoes criticas.
