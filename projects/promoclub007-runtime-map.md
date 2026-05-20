# PromoClub007 Runtime Map

## Objetivo

Mapear como o Runtime Operacional se aplica ao PromoClub007.

## Workflows ativos

### Ingestao de ofertas

```text
Google Sheets -> ingest -> validate -> normalize -> sample-output.json
```

### Publish de ofertas

```text
sample-output.json -> site-publisher -> offers-cache.json
```

### Futuro frontend deploy

```text
offers-cache.json -> frontend/API -> QA -> deploy
```

## Runtime states esperados

- `queued`: execucao agendada ou solicitada;
- `routed`: agentes definidos;
- `running`: ingest/publish em andamento;
- `waiting_input`: aguardando credencial, planilha ou decisao;
- `blocked`: QA falhou ou governanca bloqueou;
- `retrying`: nova tentativa em falha transitoria;
- `validated`: cache/schema validado;
- `completed`: execucao concluida;
- `failed`: falha sem recovery automatico;
- `rolled_back`: rollback de cache/deploy executado.

## Agentes participantes

- `site-ofertas-agent`;
- `site-backend-agent`;
- `site-qa-agent`;
- `site-frontend-agent`;
- `site-seo-cro-agent`;
- `metricas-dados`;
- `executivo`.

## Checkpoints

Criar checkpoints:

- antes de ingestao real;
- apos normalizacao;
- antes de publish;
- apos geracao de cache;
- antes de deploy;
- apos QA.

## Pontos de falha

- Google Sheets API indisponivel;
- credencial invalida;
- schema da planilha alterado;
- preco mal normalizado;
- link de afiliado invalido;
- imagem quebrada;
- cache invalido;
- frontend nao consegue consumir cache;
- deploy falha.

## Recovery paths

- Reexecutar ingestao quando falha for transitoria.
- Usar ultimo cache valido se publish falhar.
- Bloquear deploy se QA falhar.
- Reverter cache se dados forem corrompidos.
- Registrar incidente para falha high/critical.

## Dependencias criticas

- `automation/config/.env`;
- service account Google;
- Google Sheets API;
- planilha compartilhada;
- scripts de ingestao;
- validador;
- normalizador;
- publisher;
- futuro frontend/API.
