# AI Tutor + Conversational Learning Runtime V1

## Objetivo

AI Tutor + Conversational Learning Runtime V1 adiciona tutores inteligentes conversacionais aos produtos educacionais gerados pelo Rafael AI Agents, permitindo orientacao adaptativa, pratica conversacional, correcao contextual, coaching pedagogico e acompanhamento continuo do aluno.

Esta V1 e readonly-safe: nao executa deploy, nao usa AI externa, nao processa voz real, preserva fallback JSON e gera apenas placeholders pedagogicos.

## Arquivos

- `ai-tutor/ai-tutor-runtime.js`
- `ai-tutor/conversational-learning-engine.js`
- `ai-tutor/adaptive-tutor-engine.js`
- `ai-tutor/student-guidance-engine.js`
- `ai-tutor/error-correction-engine.js`
- `ai-tutor/motivation-engine.js`
- `ai-tutor/pronunciation-coaching-engine.js`
- `ai-tutor/conversation-simulation-engine.js`
- `ai-tutor/learning-recommendation-engine.js`
- `ai-tutor/student-memory-engine.js`
- `ai-tutor/progress-coaching-engine.js`
- `ai-tutor/demo/ai-tutor-demo.js`

## AI Tutor Runtime

Gerencia tutores educacionais por projeto gerado em `projects/generated/`.

Projetos educacionais sao identificados por:

- categoria `education`;
- categoria `game`;
- curriculo gerado.

Projetos nao educacionais sao ignorados com metadata readonly-safe.

## Conversational Learning

Gera pratica conversacional, perguntas, respostas, follow-ups e reforco contextual.

## Adaptive Tutor

Adapta dificuldade, tom, explicacao, velocidade e profundidade por perfil do aluno.

## Student Guidance

Gera orientacao, dicas, reforco, coaching e incentivo.

## Error Correction

Gera correcao contextual, explicacao amigavel, reforco sem punicao e revisao sugerida.

## Motivation

Gera motivacao, incentivo, streak reinforcement, feedback positivo e celebracao de progresso.

## Pronunciation Coaching

Para produtos de ingles, gera:

- speaking prompts;
- phonetic guidance;
- pronunciation checkpoints;
- repetition loops.

O fluxo e placeholder-only nesta V1 e nao executa processamento real de voz.

## Conversation Simulation

Gera dialogos, cenarios, roleplay e pratica contextual.

## Learning Recommendation

Gera revisao sugerida, exercicios recomendados, reforco adaptativo e proxima habilidade ideal.

## Student Memory

Define memoria de historico, dificuldades, progresso, revisoes e dominio, persistida em `memory/ai-tutor/` como relatorio JSON fallback.

## Progress Coaching

Gera resumo de progresso, dominio atual, areas fracas e metas sugeridas.

## Saida por Projeto

Projetos educacionais recebem:

- `ai-tutor/tutor-personality.md`
- `ai-tutor/conversation-flows.md`
- `ai-tutor/adaptive-guidance.md`
- `ai-tutor/correction-system.md`
- `ai-tutor/motivation-system.md`
- `ai-tutor/progress-coaching.md`
- `ai-tutor/tutor-plan.json`

`english-learning-platform` tambem recebe:

- `ai-tutor/pronunciation-coaching.md`
- `ai-tutor/speaking-roleplay.md`
- `ai-tutor/listening-guidance.md`

## Integracoes

- Product Codegen: usa metadados dos projetos e pode orientar superficies tutor no frontend/backend.
- Learning Intelligence: usa adaptive learning, mastery, retention e progress.
- Interactive Experience: usa missoes, feedback e speaking/listening placeholders.
- Runtime: persiste relatorios em `runtime-data`.
- Telemetry: relatorios em `memory` sao observability-readable.
- Dashboard: resumo e validacoes sao dashboard-readable.

## Persistencia

Relatorios em:

- `runtime-data/ai-tutor/`
- `memory/ai-tutor/`

## Script

```bash
npm run ai-tutor:demo
```

## Validacao

O demo valida:

- arquivos obrigatorios;
- conversational learning;
- adaptive tutor;
- student guidance;
- correcao contextual;
- motivation;
- student memory;
- progress coaching;
- readonly-safe;
- ausencia de AI externa e processamento real de voz.

## Fallback Seguro

- Projetos nao educacionais sao ignorados sem erro.
- Projetos ausentes geram relatorio vazio seguro.
- JSON fallback e preservado.
- Nenhum deploy e executado.
- Nenhuma AI externa e chamada.
- Nenhum processamento de voz e executado.

## Riscos

- Respostas do tutor sao planos pedagogicos roteirizados, nao conversas AI de producao.
- Pronunciation coaching e placeholder-only.
- Student memory define estrutura, mas nao possui telemetria real de aluno.
- Produtos infantis ou regulados exigem revisao humana antes de release.

## Readiness

Readiness: `ai-tutor-conversational-learning-runtime-v1-ready`.
