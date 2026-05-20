# Router + Queue Enforcement Integration V1

## Objetivo

Integrar o Runtime Router e o Queue Manager aos planos declarativos gerados pelo Optimization Enforcement V1.

Na V1, a integracao consome os planos e ajusta os demos de forma segura, sem alterar producao, PromoClub007 ou automacoes atuais.

## Reader

Arquivo:

- `runtime/optimization/enforcement/optimization-enforcement-reader.js`

O reader le o relatorio mais recente em `memory/optimization-enforcement/` e extrai:

- workers a evitar;
- agentes derivados dos workers a evitar;
- limite de concorrencia;
- modo de throttling;
- prioridades gated;
- retry strategy.

## Queue Integration

O `runtime:queue-demo` passou a consumir o enforcement para:

- respeitar `maxConcurrentExecutions`;
- aplicar `throttlingMode`;
- marcar workers saturados como unavailable;
- enviar workflows `p0-gated` para protected queue;
- aplicar retry strategy por workflow e default.

Se nao houver relatorio, a queue usa comportamento anterior.

## Router Integration

O `runtime:routing-demo` passou a consumir o enforcement para:

- evitar agentes mapeados a workers saturados;
- escolher o melhor candidato restante;
- registrar se a decisao veio de optimization enforcement;
- persistir relatorio de integracao.

Mapeamento V1:

- `worker-site-frontend-1` -> `site-frontend-agent`;
- `worker-site-backend-1` -> `site-backend-agent`;
- `worker-qa-1` -> `site-qa-agent`.

## Fallback Seguro

Fallbacks:

- sem relatorio: comportamento anterior;
- todos os candidatos evitados: mantem decisao original e registra `all-candidates-avoided`;
- worker sem mapeamento para agente: e ignorado pelo router, mas ainda aplicado na queue.

## Persistencia

Relatorios sao gravados em:

- `runtime-data/enforcement-integration/`;
- `memory/enforcement-integration/`.

## Riscos

- Mapeamento worker -> agente ainda e estatico.
- Enforcement e declarativo, mas a simulacao ja altera decisao do demo.
- Workers evitados podem reduzir capacidade disponivel.
- Protected queue ainda nao tem scheduler proprio.

## Proximos Passos

- mover mapeamento worker/agente para registry;
- fazer Router usar enforcement como score penalty configuravel;
- criar scheduler dedicado para protected queue;
- adicionar expiracao/cooldown de enforcement;
- medir ganhos reais apos aplicar os planos;
- adicionar testes automatizados de fallback.
