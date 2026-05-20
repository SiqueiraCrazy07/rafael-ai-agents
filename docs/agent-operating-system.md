# Agent Operating System

## Objetivo

Definir o `rafael-ai-agents` como um Agent Operating System reutilizavel para operar varios projetos, incluindo PromoClub007, PM, UX, automacao, analytics, QA e futuros produtos.

O repositorio organiza agentes, playbooks, workflows, conectores, memoria, projetos e documentacao para reduzir improviso e aumentar rastreabilidade.

## Estrutura principal

```text
agents/      especificacoes de agentes
playbooks/   processos operacionais
templates/   modelos reutilizaveis
workflows/   fluxos ponta a ponta
connectors/  integracoes externas
memory/      decisoes e aprendizados
docs/        arquitetura e documentacao tecnica
logs/        exemplos ou formatos de logs
projects/    mapas de projetos
```

## Agente, playbook, workflow e projeto

### Agente

Um agente define um papel operacional: missao, escopo, entradas, saidas, ferramentas permitidas, criterios de qualidade e riscos.

Exemplo: `Frontend Agent`, `PM Estrategico`, `QA Agent`.

### Playbook

Um playbook define um processo repetivel que pode envolver um ou mais agentes.

Exemplo: `qa-validation.md` descreve como validar uma mudanca antes do release.

### Workflow

Um workflow descreve uma sequencia de etapas ponta a ponta, podendo incluir scripts, conectores, agentes e playbooks.

Exemplo: ingestao de ofertas do Google Sheets ate cache de publicacao.

### Projeto

Um projeto mapeia contexto, agentes, riscos, workflows e proximos passos para um produto especifico.

Exemplo: `projects/promoclub007.md`.

## Como acionar agentes no Codex

1. Informe o projeto ou frente.
2. Cite o agente desejado quando souber qual usar.
3. Informe objetivo, arquivos relevantes e restricoes.
4. Declare se deseja apenas analise ou alteracao de arquivos.
5. Peça para aplicar um playbook quando houver processo.

Exemplo:

```text
Use o Frontend Agent e o playbook frontend-change-review para revisar esta mudanca sem editar arquivos.
```

## Como versionar decisoes

Decisoes devem ser registradas quando alterarem arquitetura, processo, risco, deploy, dados ou regras de negocio.

Locais recomendados:

- `memory/`: decisoes e aprendizados reutilizaveis.
- `projects/`: decisoes especificas de projeto.
- `docs/`: arquitetura formal.
- `playbooks/`: mudancas de processo.

Formato minimo:

- data;
- contexto;
- decisao;
- alternativas;
- riscos;
- impacto;
- proxima revisao.

## Como reaproveitar agentes em multiplos produtos

1. Manter agentes genericos quando a capacidade for comum.
2. Criar projeto em `projects/` para mapear aplicacao local.
3. Evitar duplicar agente para cada produto sem necessidade.
4. Criar extensoes especificas apenas quando o contexto exigir.
5. Usar playbooks comuns para QA, UX, discovery e debugging.

Exemplo:

- `QA Agent` pode atuar em PromoClub007, Site Vitrine e SaaS.
- `Ofertas Agent` pode atuar em PromoClub007 e outros produtos de afiliacao.

## Como evitar que agentes alterem arquivos errados

Regras operacionais:

- Definir escopo antes de editar.
- Listar arquivos permitidos quando a tarefa for sensivel.
- Ler estrutura antes de alterar.
- Nao mover arquivos sem motivo.
- Nao apagar arquivos existentes sem pedido explicito.
- Separar analise de implementacao quando solicitado.
- Conferir `git status` antes e depois.
- Preservar alteracoes nao relacionadas.
- Registrar o que foi criado ou modificado.

Checklist antes de qualquer alteracao:

- O usuario pediu edicao ou apenas analise?
- Quais arquivos podem ser alterados?
- Existe arquivo com o mesmo nome?
- A mudanca afeta credenciais, banco, deploy ou producao?
- Existe playbook aplicavel?
- A validacao necessaria esta clara?

## Governanca

- Agentes definem papeis.
- Playbooks definem processos.
- Workflows definem execucao ponta a ponta.
- Connectors definem integracoes.
- Memory registra decisoes.
- Projects conectam tudo a produtos reais.

Essa separacao permite evoluir o Agent OS sem transformar cada produto em uma estrutura isolada.
