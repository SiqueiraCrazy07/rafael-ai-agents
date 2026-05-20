# QA Validation

## Objetivo

Padronizar validacoes de qualidade antes de publicar mudancas em produtos, automacoes, dados ou documentacao operacional.

## Quando usar

- Antes de deploy.
- Apos mudanca em frontend, backend, automacao ou integracao.
- Apos alteracao de dados de ofertas.
- Quando houver correcao de bug.
- Antes de aprovar PR.

## Agentes envolvidos

- QA Agent
- Frontend Agent
- Backend Agent
- Ofertas Agent
- Metricas e Dados

## Entradas necessarias

- escopo da mudanca;
- criterios de aceite;
- ambiente de teste;
- dados de teste;
- fluxos criticos;
- riscos conhecidos;
- evidencias esperadas.

## Passo a passo

1. Confirmar escopo e riscos.
2. Listar fluxos criticos.
3. Validar caminho feliz.
4. Validar estados vazios e erros.
5. Validar mobile e desktop.
6. Validar dados e integracoes.
7. Registrar evidencias.
8. Classificar bugs por severidade.
9. Recomendar aprovar, revisar ou bloquear.
10. Registrar resultado.

## Saidas esperadas

- checklist executado;
- bugs encontrados;
- evidencias;
- recomendacao de release;
- riscos residuais.

## Criterios de qualidade

- validacao cobre fluxos criticos;
- bugs tem passos de reproducao;
- severidade esta clara;
- bloqueios estao explicitos;
- resultado e rastreavel.

## Regras de seguranca

- nao testar com dados sensiveis sem necessidade;
- nao alterar producao diretamente;
- bloquear release em falha critica;
- nao mascarar risco conhecido.
