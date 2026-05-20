# Runtime Quality Gates

## Purpose

Definir gates minimos para qualquer mudanca que afete runtime, Router, Queue, Enforcement, Supervisor, Learning, Predictive, Recovery, memory ou runtime-data.

## Architecture Gate

- O modulo deve ter responsabilidade unica.
- O contrato de entrada e saida deve ser claro.
- A feature deve preservar fronteiras entre plataforma e projetos.

## Runtime Gate

- Fluxos existentes devem continuar executando.
- Concorrencia e throttling devem ter limites explicitos.
- Workflows criticos devem suportar human gate.
- Falhas previsiveis devem ter fallback seguro.

## Persistence Gate

- `memory/` deve receber historico operacional.
- `runtime-data/` deve receber estado de execucao ou relatorios runtime.
- Persistencia deve ser auditavel e nao destrutiva.
- Dados novos devem ser opcionais para consumidores antigos.

## Observability Gate

- Demos devem imprimir resumo operacional.
- Relatorios devem incluir `source`, `evidence`, `reason` ou equivalentes.
- Falhas e fallbacks devem aparecer no output.

## Fallback Gate

- Diretorios vazios devem ser suportados.
- Arquivos ausentes devem gerar modo seguro.
- Regras que impedem execucao devem declarar motivo e expiracao quando aplicavel.

## Project Isolation Gate

- Mudancas de plataforma nao devem editar arquivos de projeto.
- Dados de um projeto nao devem dirigir execucao de outro sem escopo explicito.
- Artefatos globais devem ser neutros e reutilizaveis.

## Backward Compatibility Gate

- Scripts npm existentes devem continuar validos.
- Campos novos em JSON devem ser opcionais.
- Breaking changes exigem policy de aprovacao e plano de migracao.

## Operational Security Gate

- Acoes destrutivas exigem aprovacao explicita.
- Secrets nao podem ser persistidos.
- Mudancas que afetam publicacao, deploy ou integracao externa exigem validacao humana.

## Validation Gate

- Deve existir pelo menos um comando verificavel.
- O comando deve falhar com mensagem clara quando requisito minimo nao for cumprido.
- A validacao deve ser documentada no arquivo de plataforma correspondente.
