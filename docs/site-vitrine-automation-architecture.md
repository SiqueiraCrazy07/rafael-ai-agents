# Arquitetura de Automacao do Site Vitrine

## 1. Objetivo da arquitetura

Definir a arquitetura inicial de automacao do Site Vitrine para ler ofertas a partir de Google Sheets, validar dados, normalizar produtos, atualizar o site automaticamente, gerar logs, executar controles de qualidade e permitir revisao antes de deploy quando necessario.

A arquitetura deve reduzir a dependencia do Make, manter estabilidade operacional, suportar multiplos marketplaces no futuro e evoluir gradualmente para uma base reutilizavel no SaaS proprio de automacao.

---

## 2. Fluxo completo da automacao

1. Google Sheets recebe ou centraliza ofertas vindas de curadoria manual, marketplaces ou fontes externas.
2. Um processo agendado consulta as planilhas autorizadas.
3. Os dados brutos sao lidos e armazenados em uma area temporaria de ingestao.
4. O sistema valida campos obrigatorios, formatos, links, precos, imagens, disponibilidade e regras de afiliacao.
5. As ofertas validas sao normalizadas para um modelo unico de produto/oferta.
6. As ofertas invalidas sao registradas em logs com motivo de rejeicao.
7. O backend atualiza a base do site com dados aprovados.
8. O frontend consome os dados atualizados para exibir produtos, filtros e ofertas.
9. O QA executa validacoes automaticas e, quando necessario, revisao manual.
10. O SEO/CRO valida impactos em indexacao, estrutura de pagina, conteudo e conversao.
11. O deploy ocorre automaticamente para mudancas de baixo risco ou via revisao para mudancas sensiveis.
12. Logs, erros, metricas e resultados da sincronizacao sao monitorados continuamente.

---

## 3. Componentes principais

- Google Sheets: fonte inicial de ofertas e dados operacionais.
- Ingestor de planilhas: componente responsavel por ler abas, linhas e metadados.
- Validador de ofertas: componente responsavel por regras de qualidade, obrigatoriedade e consistencia.
- Normalizador de produtos: componente responsavel por transformar dados brutos em um modelo padrao.
- Base de dados: armazenamento das ofertas normalizadas, historico, status e logs.
- API do site: camada de leitura e escrita para ofertas, produtos, filtros e metadados.
- Frontend do site vitrine: camada de exibicao e conversao.
- Pipeline de QA: validacoes funcionais, visuais, responsivas e de integracao.
- Monitoramento e logs: trilha de execucao, erros, alertas e metricas.
- Deploy continuo: publicacao automatizada ou revisada conforme risco.
- Camada futura de workflows: base para substituir Make e evoluir para SaaS proprio.

---

## 4. Responsabilidade de cada agente

### Frontend Agent

- evoluir a exibicao de ofertas, filtros, cards, paginas e fluxos;
- garantir compatibilidade mobile, performance e revisao visual;
- consumir dados normalizados de forma estavel;
- apoiar SEO/CRO e QA em mudancas de interface.

### Backend Agent

- definir APIs, contratos, banco, cache e integracoes;
- implementar leitura, escrita e atualizacao automatizada das ofertas;
- garantir seguranca, estabilidade, logs e tratamento de falhas;
- preparar arquitetura para multiplos marketplaces.

### SEO/CRO Agent

- avaliar impacto das ofertas em SEO, conteudo, indexacao e conversao;
- sugerir melhorias de paginas, CTAs, filtros e estrutura;
- definir metricas de sucesso para trafego e conversao;
- propor experimentos e prioridades de otimizacao.

### QA Agent

- validar integridade dos dados exibidos;
- testar fluxos criticos, mobile, desktop e estados de erro;
- revisar visualmente paginas e componentes impactados;
- bloquear deploy quando houver risco critico.

### Ofertas Agent

- validar origem, qualidade e consistencia das ofertas;
- definir regras de curadoria, normalizacao e exibicao;
- identificar duplicidades, links quebrados, precos invalidos e dados desatualizados;
- apoiar automacao de atualizacao e expansao para marketplaces.

---

## 5. Fluxo de dados

1. Entrada: ofertas sao registradas no Google Sheets.
2. Ingestao: o sistema le linhas novas ou alteradas.
3. Validacao: campos obrigatorios e regras de negocio sao aplicados.
4. Normalizacao: os dados sao convertidos para o modelo interno.
5. Persistencia: ofertas aprovadas sao salvas na base do site.
6. Publicacao: a API disponibiliza ofertas para o frontend.
7. Exibicao: o frontend renderiza produtos, filtros, paginas e chamadas de conversao.
8. Qualidade: QA e SEO/CRO validam dados, visual, performance e conversao.
9. Observabilidade: logs e metricas registram sucesso, erro, tempo de execucao e status.

Modelo minimo recomendado para oferta normalizada:

- id interno;
- marketplace;
- titulo;
- descricao curta;
- categoria;
- preco;
- preco anterior;
- moeda;
- url de afiliado;
- url da imagem;
- disponibilidade;
- tags;
- prioridade de exibicao;
- status de validacao;
- data da ultima atualizacao;
- origem dos dados.

---

## 6. Estrategia de integracao com Google Sheets

A integracao inicial deve usar Google Sheets como fonte operacional controlada, evitando dependencia total de automacoes externas.

Recomendacoes:

- usar uma service account ou mecanismo seguro de autenticacao;
- limitar acesso apenas as planilhas necessarias;
- padronizar colunas obrigatorias;
- registrar a versao do layout da planilha;
- ler apenas linhas novas ou alteradas quando possivel;
- armazenar o resultado bruto da ingestao para auditoria;
- validar schema antes de processar dados;
- registrar erros por linha, campo e regra violada;
- evitar expor tokens, chaves ou credenciais no repositorio;
- preparar adaptadores para futuras fontes alem de Google Sheets.

Colunas minimas recomendadas:

- marketplace;
- titulo;
- categoria;
- preco;
- preco_anterior;
- url_afiliado;
- url_imagem;
- disponibilidade;
- prioridade;
- status;
- observacoes.

---

## 7. Estrategia de atualizacao do site

A atualizacao do site deve ser incremental, rastreavel e reversivel.

Estrategia inicial:

1. Ingerir dados do Google Sheets.
2. Validar e normalizar ofertas.
3. Salvar ofertas aprovadas em banco ou fonte estruturada.
4. Marcar ofertas invalidas com status e motivo.
5. Atualizar a API consumida pelo frontend.
6. Invalidar cache quando necessario.
7. Executar QA automatico em paginas impactadas.
8. Publicar automaticamente apenas alteracoes de baixo risco.
9. Exigir revisao manual para mudancas que afetem layout, SEO, regras de exibicao ou grande volume de ofertas.

O frontend nao deve depender diretamente do Google Sheets. A planilha deve ser apenas fonte de entrada; o site deve consumir uma camada normalizada e validada.

---

## 8. Estrategia de QA

O QA deve combinar validacao automatica, revisao visual e criterios de bloqueio.

Validacoes recomendadas:

- campos obrigatorios preenchidos;
- preco valido e coerente;
- link de afiliado acessivel;
- imagem carregando corretamente;
- ausencia de duplicidades criticas;
- cards renderizando corretamente;
- filtros funcionando;
- layout mobile sem quebras;
- performance aceitavel;
- paginas relevantes sem erros;
- status de ofertas refletido corretamente.

Criterios de bloqueio:

- links quebrados em ofertas prioritarias;
- erro visual critico em mobile;
- falha de carregamento de paginas principais;
- dados enganosos de preco ou disponibilidade;
- risco de exposicao de credenciais;
- regressao em fluxo de conversao.

---

## 9. Estrategia de monitoramento

O sistema deve registrar logs de execucao e indicadores operacionais desde a primeira versao.

Logs minimos:

- inicio e fim de cada execucao;
- planilha e aba processada;
- quantidade de linhas lidas;
- quantidade de ofertas aprovadas;
- quantidade de ofertas rejeitadas;
- erros por linha e campo;
- tempo total de execucao;
- status da atualizacao do site;
- status de QA;
- responsavel ou origem da execucao.

Metricas recomendadas:

- taxa de ofertas validas;
- taxa de erro por marketplace;
- tempo medio de sincronizacao;
- quantidade de ofertas ativas;
- quantidade de links invalidos;
- impacto em cliques e conversao;
- erros por deploy;
- alertas criticos abertos.

Alertas devem ser gerados para falhas de ingestao, aumento anormal de rejeicoes, indisponibilidade de APIs, links quebrados em massa e falhas de deploy.

---

## 10. Estrategia de deploy

O deploy deve seguir o fluxo do GitHub Workflow e respeitar revisao quando houver risco.

Recomendacao inicial:

- mudancas de codigo devem passar por branch, validacao, documentacao e Pull Request;
- atualizacoes simples de ofertas podem ser publicadas automaticamente apos validacao;
- mudancas em layout, schema, SEO, regras de ordenacao ou integracoes devem exigir revisao;
- deploy deve ocorrer via Vercel ou pipeline equivalente;
- cada deploy deve registrar versao, resumo, validacoes e riscos;
- rollback deve ser previsto para falhas criticas.

Tipos de mudanca:

- Baixo risco: novas ofertas validas, pequenas correcoes de dados, atualizacao de disponibilidade.
- Medio risco: mudanca de regras de curadoria, categorias, prioridade ou filtros.
- Alto risco: mudanca de schema, layout, SEO tecnico, APIs, banco, automacao ou deploy.

---

## 11. Estrategia futura para substituir Make

A substituicao do Make deve ser gradual, sem quebrar fluxos operacionais existentes.

Fases recomendadas:

1. Mapear automacoes atuais feitas no Make.
2. Identificar gatilhos, entradas, transformacoes, saidas e falhas conhecidas.
3. Recriar primeiro fluxos simples dentro do proprio sistema.
4. Criar adaptadores para Google Sheets, marketplaces e APIs externas.
5. Centralizar logs e monitoramento fora do Make.
6. Criar um scheduler proprio para execucoes recorrentes.
7. Criar um executor de workflows com retries, status e historico.
8. Migrar fluxos criticos apenas apos validacao paralela.
9. Transformar os componentes reutilizaveis em base do SaaS de Automacao.

O objetivo nao e remover Make de uma vez, mas reduzir dependencia operacional e aumentar controle sobre dados, logs, qualidade e evolucao tecnica.

---

## 12. Roadmap tecnico evolutivo

### Fase 1 - Fundacao

- padronizar planilhas;
- definir schema minimo de ofertas;
- criar validador de dados;
- criar logs basicos;
- documentar processo de QA;
- manter revisao manual para casos sensiveis.

### Fase 2 - Automacao inicial

- implementar leitura automatica do Google Sheets;
- normalizar produtos;
- atualizar base do site;
- executar validacoes automaticas;
- gerar relatorios de erros e rejeicoes;
- publicar ofertas de baixo risco automaticamente.

### Fase 3 - Integracoes e qualidade

- adicionar suporte a multiplos marketplaces;
- criar adaptadores por origem;
- melhorar monitoramento e alertas;
- adicionar testes visuais e responsivos;
- medir impacto em SEO, cliques e conversao.

### Fase 4 - Workflow proprio

- criar scheduler;
- criar executor de jobs;
- adicionar retries e historico;
- versionar workflows;
- reduzir fluxos equivalentes no Make;
- centralizar logs e observabilidade.

### Fase 5 - Base para SaaS

- transformar conectores em modulos reutilizaveis;
- criar painel de monitoramento;
- criar controle de permissoes;
- permitir configuracao de workflows;
- evoluir para AI workers e automacoes distribuideis.

---

## 13. Riscos e desafios

- dados inconsistentes em planilhas;
- mudancas manuais sem padrao;
- links de afiliado quebrados ou expirados;
- imagens indisponiveis;
- diferencas entre marketplaces;
- risco de duplicidade de produtos;
- falhas silenciosas de automacao;
- impacto negativo em SEO por paginas ruins ou dados fracos;
- queda de performance mobile com excesso de ofertas;
- dependencia de credenciais e limites de APIs externas;
- falta de rollback para atualizacoes automaticas;
- ausencia de revisao em mudancas de alto risco.

Mitigacoes recomendadas:

- schema claro de planilha;
- validacao por linha e campo;
- logs detalhados;
- alertas para falhas criticas;
- revisao manual para mudancas sensiveis;
- deploy com rollback;
- adaptadores por marketplace;
- QA automatico e visual;
- metricas de conversao e qualidade.

---

## 14. Recomendacoes tecnicas

- tratar Google Sheets como fonte de entrada, nao como banco principal do site;
- criar uma camada de ingestao separada da camada de publicacao;
- normalizar ofertas antes de exibir no frontend;
- manter historico de execucoes e erros;
- aplicar validacao forte antes de atualizar o site;
- usar status para controlar oferta bruta, valida, rejeitada, publicada e arquivada;
- implementar cache e invalidacao controlada;
- proteger credenciais em variaveis de ambiente ou secret manager;
- criar contratos claros entre backend e frontend;
- priorizar performance mobile em toda mudanca visual;
- usar PR e revisao para mudancas de schema, layout, SEO e integracoes;
- desenhar conectores como componentes reutilizaveis para o futuro SaaS de Automacao;
- evoluir automacoes em etapas, sempre com logs, QA e possibilidade de rollback.
