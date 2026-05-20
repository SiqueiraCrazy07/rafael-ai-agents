# Enterprise Review Checklist

## Purpose

Checklist obrigatorio para qualquer nova feature da plataforma Rafael AI Agents.

## Architecture

- [ ] O modulo proprietario esta claro.
- [ ] Entradas, saidas e dependencias estao documentadas.
- [ ] A feature nao duplica decisao ja existente em outro modulo.

## Modularity

- [ ] A feature e isolada por pasta e responsabilidade.
- [ ] Contratos compartilhados estao documentados.
- [ ] Nao ha dependencia direta em projeto especifico sem justificativa.

## Persistence

- [ ] Escritas em `memory/` e `runtime-data/` estao separadas por finalidade.
- [ ] Arquivos persistidos possuem timestamp e JSON legivel quando aplicavel.
- [ ] Historico nao e sobrescrito sem politica explicita.

## Observability

- [ ] Output de demo mostra fontes, decisoes e efeitos.
- [ ] Relatorios incluem evidence, sourcePath ou reason.
- [ ] Falhas esperadas sao visiveis.

## Fallback

- [ ] Fonte ausente tem fallback seguro.
- [ ] Dados invalidos nao derrubam fluxo critico sem razao.
- [ ] Human gate existe para risco alto.

## Validation

- [ ] Existe comando npm, validador ou demo verificavel.
- [ ] A feature foi testada com os comandos relevantes.
- [ ] O resultado esperado esta documentado.

## Runtime Impact

- [ ] Impacto em Router, Queue, Recovery, Supervisor ou Decision Engine foi avaliado.
- [ ] Concorrencia, retry, throttling e leases nao foram quebrados.
- [ ] O runtime funcional atual permanece compativel.

## Memory Impact

- [ ] Novos arquivos em `memory/` sao versionaveis e append-only.
- [ ] Consumers existentes toleram campos novos.
- [ ] Ausencia de memoria antiga foi considerada.

## Runtime-Data Impact

- [ ] Novos arquivos em `runtime-data/` representam estado ou saida de execucao.
- [ ] Caminhos novos estao documentados.
- [ ] Persistencia pode ser auditada.

## Project Impact

- [ ] PromoClub007 nao foi alterado sem pedido explicito.
- [ ] Outros projetos nao recebem efeitos colaterais.
- [ ] Escopo por projeto e respeitado.

## Coupling Risk

- [ ] A feature nao cria dependencia circular entre modulos.
- [ ] Readers e writers sao preferidos a imports cruzados desnecessarios.
- [ ] Decisoes compartilhadas tem fonte clara.

## Rollback

- [ ] Mudanca pode ser revertida sem apagar memoria historica.
- [ ] Existe fallback para desativar consumo do novo plano.
- [ ] Artefatos gerados podem ser ignorados por consumidores antigos.
