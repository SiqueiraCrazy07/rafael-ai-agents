# GitHub Actions Debugging

## Objetivo

Padronizar analise e correcao de falhas em GitHub Actions, CI/CD, checks, builds e deploys.

## Quando usar

- Workflow falhou.
- Build quebrou.
- Testes falharam no CI.
- Deploy nao foi publicado.
- Permissao de token falhou.
- Ambiente remoto difere do local.

## Agentes envolvidos

- Backend Agent
- Frontend Agent
- QA Agent
- Executivo quando houver bloqueio de release.

## Entradas necessarias

- link ou log do workflow;
- branch;
- commit;
- arquivo `.yml` do workflow;
- variaveis e secrets esperados;
- comando que falhou;
- resultado local se existir.

## Passo a passo

1. Identificar job e step com falha.
2. Ler o primeiro erro relevante.
3. Comparar ambiente local e CI.
4. Verificar dependencias e cache.
5. Verificar secrets e permissoes.
6. Reproduzir comando localmente quando possivel.
7. Ajustar workflow ou codigo com menor mudanca viavel.
8. Rodar validacao local.
9. Reexecutar CI.
10. Registrar causa e prevencao.

## Saidas esperadas

- causa provavel;
- arquivo ou step afetado;
- correcao proposta;
- validacao local;
- resultado do novo CI;
- riscos residuais.

## Criterios de qualidade

- erro raiz foi identificado;
- correcao nao enfraquece checks;
- secrets continuam protegidos;
- workflow continua reproduzivel;
- logs finais indicam sucesso.

## Regras de seguranca

- nao expor secrets;
- nao desativar checks sem aprovacao;
- nao ampliar permissoes desnecessariamente;
- nao ignorar falhas de teste para liberar deploy.
