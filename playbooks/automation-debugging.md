# Automation Debugging

## Objetivo

Padronizar depuracao de automacoes, ingestores, normalizadores, publishers, conectores e jobs recorrentes.

## Quando usar

- Falha em ingestao.
- Erro em API externa.
- Dados rejeitados em massa.
- Cache invalido.
- Logs inconsistentes.
- Automacao parada ou intermitente.

## Agentes envolvidos

- Backend Agent
- Ofertas Agent
- QA Agent
- Metricas e Dados
- Executivo quando houver impacto operacional.

## Entradas necessarias

- comando executado;
- logs;
- arquivo de entrada;
- arquivo de saida;
- configuracao usada;
- horario da falha;
- impacto conhecido;
- mudancas recentes.

## Passo a passo

1. Reproduzir o erro localmente quando possivel.
2. Ler logs e separar erro raiz de efeito colateral.
3. Validar variaveis de ambiente.
4. Validar credenciais e permissoes.
5. Validar formato de entrada.
6. Validar schema de saida.
7. Isolar etapa com falha.
8. Criar ajuste minimo.
9. Rodar validacao.
10. Registrar causa e prevencao.

## Saidas esperadas

- causa raiz;
- etapa afetada;
- correcao proposta;
- validacao executada;
- riscos residuais;
- recomendacao de monitoramento.

## Criterios de qualidade

- causa raiz esta demonstrada;
- ajuste e pequeno e rastreavel;
- logs foram preservados;
- validacao cobre o erro;
- prevencao foi registrada.

## Regras de seguranca

- nao imprimir segredos em logs;
- nao editar producao diretamente;
- nao apagar logs relevantes;
- nao aumentar permissoes sem justificativa.
