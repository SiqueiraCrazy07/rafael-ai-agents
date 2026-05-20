# Multi-Agent Workflows

## Objetivo

Documentar cadeias operacionais entre agentes para reduzir improviso, preservar contexto e criar gates de validacao.

---

## PM -> UX -> Frontend -> QA

### Quando usar

- Nova funcionalidade frontend.
- Mudanca em experiencia ou conversao.
- Ajuste de fluxo critico.
- Integracao de dados dinamicos no site.

### Sequencia

1. `PM Estrategico`: define objetivo, impacto, prioridade e riscos.
2. `UX Produto`: revisa jornada, fluxo, clareza e mobile.
3. `Frontend Agent`: implementa ou especifica mudanca frontend.
4. `QA Agent`: valida comportamento, visual, mobile, dados e release.

### Gates

- PM valida objetivo.
- UX valida experiencia.
- Frontend valida implementacao.
- QA aprova, pede ajuste ou bloqueia.

---

## Backend -> QA -> Deploy

### Quando usar

- Mudanca em API.
- Mudanca em automacao.
- Mudanca em cache.
- Mudanca em integracao.

### Sequencia

1. `Backend Agent`: altera ou especifica backend/automacao.
2. `QA Agent`: valida integridade, logs, erros e regressao.
3. Deploy review: validacao humana quando high ou critical.

### Gates

- Validacao local obrigatoria.
- Logs preservados.
- QA obrigatorio.
- Deploy humano para high/critical.

---

## Ofertas -> Curadoria -> Publish

### Quando usar

- Atualizacao de ofertas.
- Integracao com marketplace.
- Mudanca em regras de curadoria.
- Publicacao de cache.

### Sequencia

1. `Ofertas Agent`: valida origem, preco, link, imagem e marketplace.
2. Curadoria: revisa qualidade comercial e relevancia.
3. `Backend Agent`: gera cache/payload de publicacao.
4. `QA Agent`: valida cache, links e exibicao.
5. Publish: automatico apenas para baixo risco.

### Gates

- Rejeicao por dados invalidos.
- Bloqueio por queda anormal de ofertas.
- Revisao humana para mudanca de schema ou regras.

---

## Discovery -> PRD -> Execucao

### Quando usar

- Produto novo.
- Funcionalidade nova.
- Mudanca relevante de estrategia.
- Problema ainda pouco entendido.

### Sequencia

1. `Discovery`: investiga problema, usuario e hipoteses.
2. `PM Estrategico`: prioriza e decide proximo passo.
3. `PRD e Backlog`: transforma contexto em escopo e criterios.
4. Execucao: agentes tecnicos atuam conforme projeto.
5. `QA Agent`: valida entrega.
6. `Metricas e Dados`: acompanha resultado.

### Gates

- Discovery separa fato de hipotese.
- PRD define escopo e nao escopo.
- Execucao respeita criterios de aceite.
- Resultado e medido.
