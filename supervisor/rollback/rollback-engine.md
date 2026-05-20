# Rollback Engine

## Objetivo

Definir rollback seguro para execucoes operacionais.

## Rollback seguro

Um rollback e seguro quando:

- existe checkpoint anterior;
- impacto e conhecido;
- acao e rastreavel;
- validacao pos-rollback e definida;
- owner humano esta claro quando high/critical.

## Rollback parcial

Reverte apenas parte afetada.

Exemplos:

- restaurar cache anterior;
- remover ofertas invalidas;
- desfazer publish;
- reverter configuracao de workflow.

## Rollback total

Reverte workflow inteiro ao ultimo estado estavel.

Usar quando:

- falha compromete saida completa;
- integridade nao pode ser garantida;
- deploy afetou fluxo critico.

## Rollback obrigatorio

Obrigatorio quando:

- dados incorretos foram publicados;
- credencial foi exposta;
- deploy quebrou fluxo critico;
- cache foi corrompido;
- falha critical esta ativa.

## Rollback assistido

Rollback assistido exige humano para:

- validar impacto;
- aprovar acao;
- acompanhar logs;
- confirmar recuperacao;
- registrar incidente.
