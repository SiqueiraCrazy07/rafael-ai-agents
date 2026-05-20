# API Authentication + Governance V1

## Objetivo

Adicionar governanca de acesso, autenticacao readonly e controle seguro de consumo da API do Rafael AI Agents.

A V1 mantem a API como superficie apenas de consulta, sem execucao destrutiva, sem alteracao de runtime e sem alteracao de workflows.

## Estrutura

Diretorios criados:

- `api/auth/`
- `api/governance/`
- `api/keys/`
- `api/policies/`

Arquivos principais:

- `api/auth/api-key-auth.js`
- `api/auth/api-auth-demo.js`
- `api/keys/client-registry.js`
- `api/policies/api-governance-policies.js`
- `api/governance/rate-limiter.js`
- `api/governance/audit-trail.js`
- `api/governance/api-governance-demo.js`

## API Key Readonly

A autenticacao usa header:

```text
x-api-key
```

Regras:

- chaves reais devem vir de `API_READONLY_KEY` ou de client registry injetado em runtime;
- chaves sao comparadas por hash SHA-256;
- a comparacao usa `crypto.timingSafeEqual`;
- secrets nao sao persistidos em `memory/`, `runtime-data/` ou docs;
- na ausencia de chave valida, a API retorna deny seguro.

## Client Registry

Cada client possui:

- `clientId`;
- `scopes`;
- `readonly`;
- `createdAt`;
- `enabled`;
- `keyHash`.

O `keyHash` nao e a chave original. Relatorios e demos exibem apenas metadados seguros do client.

## Governance Policies

Policies aplicadas:

- `readonly-only`;
- `deny-destructive-actions`;
- `safe-request-policy`;
- `request-tracing-policy`.

Essas policies bloqueiam metodos destrutivos, request body em requests readonly e requests sem tracing.

## Rate Limiting

Rate limit simples em memoria por client/API key.

Campos expostos por header:

- `x-ratelimit-limit`;
- `x-ratelimit-remaining`;
- `x-ratelimit-reset`.

Quando excedido, a API retorna `429` com fallback seguro. O runtime interno nao e bloqueado, porque a limitacao existe apenas na camada HTTP da API.

## Audit Trail

Cada request gera trilha em:

- `runtime-data/api-governance/`;
- `memory/api-governance/`.

Campos persistidos:

- `requestId`;
- `clientId`;
- `route`;
- `method`;
- `timestamp`;
- `status`;
- `correlationId`;
- auth status;
- governance status;
- rate limit;
- safety flags.

## Scripts

```bash
npm run api:auth-demo
npm run api:governance-demo
```

`api:auth-demo` valida:

- chave valida aceita;
- chave ausente negada;
- chave invalida negada;
- sem secret persistido.

`api:governance-demo` valida:

- request readonly permitido;
- rate limit excedido;
- metodo destrutivo negado;
- audit/tracing presente.

## Fallback Seguro

Fallbacks:

- sem `x-api-key`: `401 missing-api-key`;
- chave invalida: `401 invalid-api-key`;
- metodo destrutivo: `403 api-governance-policy-denied`;
- rate limit excedido: `429 rate-limit-exceeded`;
- API sem client configurado: deny-by-default;
- todos os fallbacks usam envelope seguro;
- nenhuma falha de governanca executa efeito runtime.

## Compatibilidade

A V1 preserva:

- contratos `/api/v1`;
- response schemas;
- query validation;
- `api:demo`;
- `api:validate-demo`;
- scripts existentes de validacao e normalizacao.

Os demos criam chave efemera em memoria. `api:start` deve receber `API_READONLY_KEY` no ambiente para aceitar requests externos.

## Governanca Enterprise

A camada segue os gates:

- modulo isolado em `api/`;
- sem hardcode de segredo;
- sem alteracao em PromoClub007;
- sem alteracao nas automacoes atuais;
- persistencia auditavel e append-only;
- fallback seguro e visivel;
- readonly por padrao.

## Riscos

- Rate limit e local ao processo.
- Ainda nao ha RBAC granular por endpoint.
- Ainda nao ha rotacao formal de chaves.
- Ainda nao ha armazenamento seguro externo de secrets.
- Audit trail usa arquivos JSON locais.
- Nao ha assinatura de requests ou OAuth.

## Readiness

Readiness: `api-v1-governed-readonly-ready`.

A API V1 agora possui autenticacao readonly, governanca de consumo, rate limiting simples e audit trail persistido. O proximo passo natural e RBAC por escopo, rotacao de chaves e Persistent Database Layer.
