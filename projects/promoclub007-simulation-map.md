# PromoClub007 Simulation Map

## Objetivo

Mapear workflows simulaveis, pontos criticos, checkpoints, recovery paths, falhas perigosas e validacoes prioritarias do PromoClub007.

## Workflows simulaveis

- ingestao de ofertas;
- normalizacao de ofertas;
- publish de cache;
- QA de cache;
- futura integracao frontend;
- futuro deploy.

## Pontos criticos

- Google Sheets API;
- credenciais;
- schema da planilha;
- preco e preco promocional;
- links de afiliado;
- imagens;
- cache `offers-cache.json`;
- handoff Backend -> QA;
- publish antes de deploy.

## Checkpoints

- antes de ingestao;
- apos ingestao;
- apos normalizacao;
- antes de publish;
- apos publish;
- antes de deploy;
- apos QA.

## Recovery paths

- usar ultimo cache valido;
- bloquear publish;
- reexecutar ingestao;
- pedir input humano;
- rollback de cache;
- registrar incidente high/critical.

## Falhas mais perigosas

- preco incorreto publicado;
- link de afiliado quebrado em massa;
- cache vazio publicado;
- credencial exposta;
- deploy com layout mobile quebrado;
- SEO prejudicado por renderizacao incorreta;
- automacao falhar silenciosamente.

## Validacoes prioritarias

1. Registry valido.
2. Runtime schema valido.
3. Estado de execucao valido.
4. Cache com ofertas.
5. Links e imagens validos.
6. Checkpoint antes de publish.
7. QA antes de deploy.
8. Gate humano para high/critical.
