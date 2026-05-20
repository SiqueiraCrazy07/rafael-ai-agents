# PromoClub007 Supervision Map

## Objetivo

Mapear supervisao, self-healing, recovery e rollback para workflows criticos do PromoClub007.

## Workflows criticos

- ingestao de ofertas;
- normalizacao;
- publish de cache;
- futura integracao frontend;
- futuro deploy.

## Pontos de falha

- Google Sheets API indisponivel;
- credencial invalida;
- schema da planilha alterado;
- preco incorreto;
- link de afiliado quebrado;
- imagem indisponivel;
- cache vazio;
- QA falhou;
- deploy falhou.

## Recovery paths

- retry de API transitoria;
- reexecutar ingestao;
- regenerar cache;
- usar ultimo cache valido;
- bloquear publish;
- pedir validacao humana;
- registrar incidente.

## Rollback paths

- restaurar cache anterior;
- bloquear deploy;
- reverter publish;
- manter versao anterior do frontend;
- abrir incidente high/critical.

## Incidentes perigosos

- cache vazio publicado;
- preco errado publicado;
- credencial exposta;
- links quebrados em massa;
- deploy quebra mobile;
- SEO afetado por renderizacao incorreta.

## Supervisao prioritaria

1. Validar quantidade de ofertas.
2. Detectar queda brusca de outputs.
3. Verificar checkpoint antes de publish.
4. Bloquear cache invalido.
5. Exigir QA antes de deploy.
6. Escalar high/critical para humano.
