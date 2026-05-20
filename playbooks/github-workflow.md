# GitHub Workflow

## Objetivo

Padronizar o fluxo de trabalho com GitHub para mudancas em agentes, documentacao, playbooks, arquitetura e futuras implementacoes de produto.

---

## Quando usar

Use este playbook sempre que uma mudanca precisar ser planejada, implementada, revisada, documentada ou publicada no repositorio.

---

## Agentes envolvidos

- PM Estrategico
- Executivo
- PRD e Backlog
- UX Produto
- Metricas e Dados
- Discovery

---

## Entradas necessarias

- objetivo da mudanca;
- contexto do problema;
- arquivos impactados;
- riscos conhecidos;
- criterios de aceite;
- prioridade da demanda;
- decisao ou aprovacao necessaria.

---

## Passo a passo

1. Entender o objetivo da mudanca e o impacto esperado.
2. Confirmar se a mudanca envolve documentacao, produto, codigo, banco, integracoes ou operacao.
3. Criar uma branch especifica para a alteracao.
4. Implementar a mudanca de forma incremental e organizada.
5. Validar o funcionamento ou a consistencia documental.
6. Atualizar documentacao relevante quando necessario.
7. Revisar riscos, dependencias e possiveis impactos.
8. Abrir Pull Request com resumo, escopo, validacoes e riscos.
9. Solicitar revisao antes de merge.
10. Registrar decisoes importantes quando houver impacto estrategico ou operacional.

---

## Saidas esperadas

- branch criada;
- alteracao implementada;
- documentacao atualizada quando aplicavel;
- validacao registrada;
- Pull Request aberto;
- riscos e decisoes documentados.

---

## Criterios de qualidade

- mudanca pequena, clara e rastreavel;
- escopo bem definido;
- ausencia de alteracoes nao relacionadas;
- documentacao coerente com arquitetura e roadmap;
- validacao proporcional ao risco;
- PR com contexto suficiente para revisao;
- decisoes e premissas explicitadas.

---

## Regras de seguranca

- nao alterar codigo critico sem revisao;
- nao executar mudancas destrutivas;
- nao expor segredos, tokens ou credenciais;
- nao alterar banco de producao diretamente;
- nao remover funcionalidades sem validacao;
- priorizar estabilidade, performance e seguranca;
- solicitar revisao para mudancas relevantes.
