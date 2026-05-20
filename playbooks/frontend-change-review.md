# Frontend Change Review

## Objetivo

Padronizar revisao de mudancas frontend para proteger UX, performance, acessibilidade, SEO, responsividade e estabilidade.

## Quando usar

- Mudanca em layout ou componente.
- Mudanca em dados renderizados.
- Alteracao em filtros, busca ou navegacao.
- Ajustes de SEO ou metadata.
- Integracao com cache, API ou automacao.

## Agentes envolvidos

- Frontend Agent
- UX Produto
- QA Agent
- SEO/CRO Agent
- PM Estrategico

## Entradas necessarias

- descricao da mudanca;
- arquivos alterados;
- screenshots antes/depois;
- criterios de aceite;
- rotas afetadas;
- metricas relevantes;
- riscos conhecidos.

## Passo a passo

1. Entender objetivo da mudanca.
2. Verificar impacto em componentes e rotas.
3. Revisar responsividade.
4. Revisar estados de loading, vazio e erro.
5. Revisar acessibilidade basica.
6. Revisar SEO quando houver conteudo ou metadata.
7. Validar performance mobile.
8. Confirmar que dados estao desacoplados.
9. Registrar riscos.
10. Aprovar, pedir ajuste ou bloquear.

## Saidas esperadas

- parecer tecnico;
- problemas encontrados;
- recomendacoes;
- riscos de release;
- checklist de validacao.

## Criterios de qualidade

- mudanca preserva comportamento esperado;
- textos cabem em mobile;
- componentes nao quebram layout;
- estados alternativos existem;
- SEO e performance foram considerados.

## Regras de seguranca

- nao expor segredos no bundle;
- nao quebrar rotas indexadas sem redirecionamento;
- nao aumentar bundle sem justificativa;
- nao publicar alteracao visual critica sem QA.
