# Incident Classification

## Low

### Impacto

Sem impacto em usuario, producao ou dados.

### Risco

Baixo, geralmente documental ou local.

### Resposta obrigatoria

- registrar se recorrente;
- corrigir quando conveniente.

### Necessidade humana

Nao obrigatoria.

## Medium

### Impacto

Impacto operacional limitado, sem dano em producao.

### Risco

Pode atrasar workflow ou gerar saida incompleta.

### Resposta obrigatoria

- registrar causa;
- validar correcao;
- atualizar playbook se recorrente.

### Necessidade humana

Recomendada quando bloquear projeto.

## High

### Impacto

Pode afetar cache, dados, frontend, automacao, QA ou deploy.

### Risco

Pode causar publicacao incorreta, regressao ou perda de confianca operacional.

### Resposta obrigatoria

- bloquear execucao;
- criar checkpoint;
- validar recovery;
- registrar incidente;
- exigir revisao humana.

### Necessidade humana

Obrigatoria.

## Critical

### Impacto

Afeta producao, seguranca, credenciais, banco, receita ou usuarios.

### Risco

Dano operacional, financeiro, reputacional ou de seguranca.

### Resposta obrigatoria

- interromper execucao;
- acionar rollback;
- registrar incidente;
- preservar logs;
- exigir decisao humana;
- revisar governanca.

### Necessidade humana

Obrigatoria e imediata.
