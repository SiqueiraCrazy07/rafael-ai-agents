# Runtime Safety Rules

## Objetivo

Definir regras de seguranca para execucoes no runtime operacional.

## Limites de retry

- low: ate 3 retries automaticos;
- medium: ate 3 retries com logs;
- high: ate 2 retries com checkpoint;
- critical: sem retry automatico sem validacao humana.

## Rollback obrigatorio

Rollback deve ser considerado obrigatorio quando:

- deploy quebra fluxo critico;
- dados incorretos sao publicados;
- cache e corrompido;
- segredo e exposto;
- automacao causa impacto operacional ou financeiro.

## Agentes criticos

Agentes com potencial high/critical:

- Backend Agent;
- Frontend Agent;
- QA Agent;
- Ofertas Agent;
- futuros Deploy/Release Agents;
- futuros Scheduler Agents.

## Validacao humana

Obrigatoria para:

- producao;
- secrets;
- banco;
- rollback;
- deploy high/critical;
- bypass de QA;
- mudanca de schema;
- publicacao em massa com anomalia.

## Protecao de producao

- Nenhum agente altera producao diretamente por padrao.
- Toda acao high/critical exige gate humano.
- Toda falha high/critical deve gerar incidente.
- Todo publish deve ter checkpoint anterior.

## Bloqueios automaticos

Bloquear execucao quando:

- cache invalido;
- registry invalido;
- contexto de projeto ausente;
- credencial ausente;
- QA falhou;
- anomalia de volume detectada;
- retry maximo excedido;
- risco critical sem aprovacao.
