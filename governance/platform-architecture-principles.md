# Platform Architecture Principles

## Enterprise Vision

Rafael AI Agents e uma plataforma operacional modular para coordenar agentes, runtime, roteamento, filas, memoria operacional, supervisao, predicao, recuperacao e governanca.

A arquitetura deve permitir evolucao incremental sem acoplar projetos, sem depender de um unico fluxo central fragil e sem misturar execucao real com planos declarativos.

## Mandatory Principles

- Modulos devem ter fronteiras claras e contratos explicitos.
- Decisoes operacionais devem ser rastreaveis, persistidas e reversiveis.
- Runtime, memory e runtime-data devem manter responsabilidades separadas.
- Novas features devem preservar compatibilidade retroativa.
- Planos declarativos nao devem executar efeitos irreversiveis sem integracao explicita.
- Todo fluxo critico deve ter fallback seguro.
- Projetos devem ser isolados por escopo, memoria e impactos de runtime.

## Forbidden Anti-Patterns

- Acoplar feature nova diretamente a PromoClub007.
- Misturar dados de projeto com regras globais da plataforma.
- Ler arquivos recentes sem fallback para diretorio vazio.
- Persistir estado operacional apenas em console.
- Criar automacao que altera producao sem gate humano quando risco for alto.
- Duplicar logica de decisao em Router, Queue, Recovery e Supervisor sem fonte central.
- Apagar ou sobrescrever memoria historica para corrigir estado.

## Architecture Criteria

- A feature deve declarar modulo proprietario, entradas, saidas e dependencias.
- Regras compartilhadas devem ficar em runtime, governance, validators ou docs, nao em projeto especifico.
- O design deve favorecer extensao por readers, writers e policies versionadas.
- Toda integracao entre modulos deve documentar o contrato consumido.

## Runtime Criteria

- O runtime deve aceitar fallback quando memoria ou policy estiver ausente.
- Concorrencia, throttling, retry e recovery devem ser configuraveis por plano.
- Workflows criticos devem suportar human gate.
- Qualquer decisao automatica deve preservar trilha de auditoria.

## Persistence Criteria

- `memory/` guarda historico operacional e aprendizado.
- `runtime-data/` guarda estado e saidas de execucao.
- Novos relatatorios devem usar nomes versionaveis, timestamp e JSON legivel.
- Escritas devem ser append-only sempre que possivel.

## Observability Criteria

- Eventos relevantes devem expor fonte, timestamp, decisao, efeito e fallback.
- Demos devem imprimir resumo suficiente para auditoria.
- Relatorios persistidos devem conter evidence ou sourcePath.
- Falhas de leitura devem ser reportadas sem derrubar fluxos seguros.

## Fallback Criteria

- Fonte ausente deve gerar comportamento conservador.
- Relatorio invalido deve ser ignorado ou marcado como indisponivel.
- Se uma regra bloquear todos os candidatos de roteamento, deve existir fallback documentado.
- Human gate deve ser preferido quando risco e incerteza forem altos.

## Project Isolation Criteria

- Projetos nao podem depender de memoria privada de outro projeto.
- Mudancas globais devem ser neutras para projetos existentes.
- Artefatos por projeto devem conter `project` quando houver impacto operacional.
- PromoClub007 nao deve ser alterado por governanca de plataforma.

## Backward Compatibility Criteria

- Scripts existentes devem continuar funcionando.
- Formatos antigos de memoria devem ser aceitos ou ignorados com fallback.
- Novos campos devem ser opcionais para consumidores existentes.
- Breaking changes exigem documento de aprovacao e plano de migracao.

## Operational Security Criteria

- Acoes destrutivas exigem aprovacao explicita.
- Secrets nao devem ser persistidos em memory, runtime-data ou docs.
- Workflows criticos exigem validacao antes de publicar ou alterar estado externo.
- Decisoes de alto risco devem ter `safetyMode`, `reason` e `expiresAt` quando aplicavel.
