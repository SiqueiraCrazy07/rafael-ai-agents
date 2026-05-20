# Execution Lifecycle

## Objetivo

Definir o ciclo de vida operacional de uma execucao coordenada por agentes.

## queued

Execucao foi registrada, mas ainda nao iniciou.

Deve conter:

- projeto;
- objetivo;
- agente primario;
- playbook;
- criticidade inicial.

## running

Execucao esta em andamento.

Deve registrar:

- etapa atual;
- agente ativo;
- arquivos lidos;
- comandos executados;
- logs relevantes.

## blocked

Execucao esta bloqueada.

Motivos comuns:

- falta de contexto;
- permissao insuficiente;
- risco high/critical sem validacao;
- dependencia externa indisponivel;
- conflito entre agentes.

## failed

Execucao falhou.

Deve registrar:

- erro;
- etapa;
- impacto;
- logs;
- acao recomendada;
- necessidade de incidente.

## validated

Execucao foi validada, mas pode ainda nao estar concluida.

Exemplos:

- QA aprovado;
- schema valido;
- teste local passou;
- revisao humana feita.

## completed

Execucao foi concluida.

Deve registrar:

- saidas;
- arquivos alterados;
- validacoes;
- riscos residuais;
- proximos passos.

## rollback

Rollback e necessario ou esta em andamento.

Quando usar:

- deploy falhou;
- dado incorreto foi publicado;
- regressao critica;
- credencial exposta;
- workflow corrompeu saida.

Rollback high/critical exige registro em `memory/incidents`.
