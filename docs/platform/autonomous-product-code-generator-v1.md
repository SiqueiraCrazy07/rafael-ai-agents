# Autonomous Product Code Generator V1

## Objetivo

Autonomous Product Code Generator V1 transforma projetos gerados pelo Product Builder em prototipos executaveis reais, criando codigo base para frontend, backend, banco de dados, rotas, componentes e documentacao tecnica.

Esta V1 e readonly-safe: nao executa deploy, nao instala dependencias automaticamente, nao altera PromoClub007 e preserva fallback JSON.

## Arquivos

- `product-codegen/product-code-generator.js`
- `product-codegen/frontend-generator.js`
- `product-codegen/backend-generator.js`
- `product-codegen/database-generator.js`
- `product-codegen/api-generator.js`
- `product-codegen/component-generator.js`
- `product-codegen/router-generator.js`
- `product-codegen/project-bootstrapper.js`
- `product-codegen/code-quality-validator.js`
- `product-codegen/demo/product-codegen-demo.js`

## Entrada

O gerador le projetos em:

- `projects/generated/`

Cada projeto deve ter metadados criados pelo Product Builder, especialmente `frontend/prototype-demo.json`.

## Frontend

Gera estrutura React/Vite:

- `pages`;
- `components`;
- `layouts`;
- `hooks`;
- `services`;
- `routes`.

Componentes iniciais:

- dashboard;
- login;
- progresso;
- conteudo;
- navegacao.

## Backend

Gera estrutura Node/Express:

- controllers;
- services;
- repositories;
- middleware;
- validators;
- routes.

O middleware `readonlyGuard` bloqueia metodos nao-readonly.

## Database

Gera:

- `schema/schema.sql`;
- entidades em `entities.json`;
- migration plan;
- seed plan.

Migrations sao planos e nao sao executadas automaticamente.

## APIs

Endpoints base:

- auth;
- users;
- progress;
- content;
- dashboard.

Produtos especificos recebem endpoints adicionais, como contacts para CRM e missions para jogos.

## Router

Gera mapa de navegacao estatico com rotas do produto e labels para UI.

## Bootstrapper

Cria e preenche automaticamente:

- `frontend/`;
- `backend/`;
- `database/`.

Nenhuma dependencia e instalada durante a V1.

## Quality Validator

Valida:

- estrutura;
- componentes;
- rotas;
- controllers;
- APIs;
- entidades;
- documentacao;
- ausencia de instalacao automatica;
- readonly-safe.

## Integracoes

- Product Factory: usa metadata derivada dos blueprints.
- Product Builder: usa projetos em `projects/generated/`.
- Runtime: persiste relatorios em `runtime-data/`.
- Telemetry: `memory/product-codegen/` fica legivel para observabilidade.
- Dashboard: relatorios sao dashboard-readable.

## Persistencia

Relatorios em:

- `runtime-data/product-codegen/`;
- `memory/product-codegen/`.

Saida real em:

- `projects/generated/<project>/frontend`;
- `projects/generated/<project>/backend`;
- `projects/generated/<project>/database`.

## Script

```bash
npm run product-codegen:demo
```

## Fallback Seguro

- Sem projetos gerados: relatorio vazio com fallback seguro.
- Dependencias declaradas, mas nao instaladas.
- Deploy real bloqueado.
- Migrations sao documentadas, nao aplicadas.
- JSON fallback preservado.

## Riscos

- Codigo gerado e starter prototype code e exige revisao humana.
- Rotas e auth sao prototipos readonly, nao seguranca de producao.
- Banco e migrations sao planos, nao execucao real.
- Apps podem exigir `npm install` manual futuro para execucao local.

## Readiness

Readiness: `autonomous-product-code-generator-v1-ready`.

A plataforma passa a transformar prototipos documentais em bases executaveis de frontend, backend e database, com validacao, persistencia e seguranca readonly-safe.
