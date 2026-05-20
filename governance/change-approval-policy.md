# Change Approval Policy

## Purpose

Definir quando uma mudanca pode ser aplicada diretamente, quando precisa de revisao e quando exige aprovacao explicita.

## Change Classes

### Documentation Change

Mudanca limitada a docs, README ou governance. Pode ser aplicada quando nao altera runtime, automacoes, projetos ou contratos persistidos.

### Validator Change

Mudanca que adiciona validacao sem alterar execucao funcional. Deve ter comando npm e falha clara.

### Runtime Declarative Change

Mudanca que gera planos, decisoes ou relatorios sem executar efeito real. Deve persistir evidencias e fallback.

### Runtime Functional Change

Mudanca que altera Router, Queue, Recovery, Supervisor, Enforcement ou execução. Exige validacao dos demos relevantes e revisao de rollback.

### Project Change

Mudanca em `projects/` ou artefatos especificos de projeto. Exige escopo explicito do projeto afetado.

### Destructive Change

Mudanca que apaga dados, sobrescreve historico, altera deploy ou modifica estado externo. Exige aprovacao explicita.

## Approval Criteria

- Arquitetura revisada pelo checklist enterprise.
- Impacto em `memory/` e `runtime-data/` entendido.
- Fallback definido.
- Rollback definido.
- Segurança operacional revisada.

## Mandatory Human Approval

Human approval e obrigatorio quando:

- workflow critico sera pausado, liberado ou publicado;
- dado historico sera removido;
- segredo, credencial ou integracao externa sera alterada;
- automacao atual sera modificada;
- projeto existente sera alterado;
- compatibilidade retroativa pode quebrar.

## Compatibility Policy

- Novos campos devem ser opcionais.
- Novos arquivos devem ser ignoraveis por consumidores antigos.
- Breaking changes exigem versao, migracao e plano de rollback.

## Rollback Policy

- Preferir desativar consumo de planos novos em vez de apagar memoria.
- Manter artefatos historicos para auditoria.
- Reverter codigo funcional separadamente de relatorios gerados.

## Operational Security Policy

- Nunca persistir secrets.
- Nunca executar acao destrutiva sem aprovacao explicita.
- Sempre registrar `reason`, `source` e `safetyMode` em decisoes operacionais de alto risco.
