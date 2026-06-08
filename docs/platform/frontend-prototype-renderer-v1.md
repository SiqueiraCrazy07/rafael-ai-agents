# Frontend Prototype Renderer V1

## Objetivo

Frontend Prototype Renderer V1 transforma especificacoes visuais, interativas e pedagogicas em frontend React mais utilizavel para os projetos em `projects/generated/`.

Esta V1 e readonly-safe: nao executa deploy, nao instala dependencias, nao usa AI externa, preserva fallback JSON e atualiza apenas prototipos React gerados.

## Arquivos

- `frontend-renderer/frontend-renderer-runtime.js`
- `frontend-renderer/react-screen-generator.js`
- `frontend-renderer/react-component-enhancer.js`
- `frontend-renderer/gamified-ui-renderer.js`
- `frontend-renderer/learning-ui-renderer.js`
- `frontend-renderer/business-ui-renderer.js`
- `frontend-renderer/navigation-renderer.js`
- `frontend-renderer/design-token-applier.js`
- `frontend-renderer/frontend-quality-validator.js`
- `frontend-renderer/demo/frontend-renderer-demo.js`

## Runtime

O runtime le:

- `projects/generated/`;
- `visual-ui/design-tokens.json`;
- `interactive/experience-plan.json`;
- `ai-tutor/tutor-plan.json`.

Depois atualiza `projects/generated/<project>/frontend/src/` com rotas, componentes, paginas, estilos e manifesto readonly-safe.

## React Screen Generator

Gera telas reais para:

- dashboard;
- login;
- progresso;
- conteudo;
- missoes;
- conversacao;
- CRM contacts;
- chatbot conversations.

## Component Enhancer

Melhora componentes compartilhados:

- cards;
- buttons;
- HUD;
- progress bars;
- quiz cards;
- mission cards;
- streak widgets;
- XP widgets.

## Gamified UI Renderer

Aplica XP bar, streak, badges, mission progress, rewards e level indicator.

## Learning UI Renderer

Para projetos educacionais gera:

- `LessonPage`;
- `ReviewPage`;
- `QuizPage`;
- `TutorPage`;
- `AdaptiveProgressPage`.

## Business UI Renderer

Para CRM e chatbot gera:

- dashboard comercial;
- lista de contatos;
- pipeline basico;
- conversas;
- status cards.

## Navigation Renderer

Gera navegacao funcional por hash route sem instalar dependencias adicionais.

## Design Token Applier

Aplica tokens de cores, espacamento, tipografia, radius, sombras e estados visuais a `frontend/src/styles.css`.

## Quality Validator

Valida:

- arquivos React obrigatorios;
- imports por rota;
- rotas e navegacao funcional;
- componentes compartilhados;
- tokens aplicados;
- telas obrigatorias;
- manifesto readonly-safe.

## Persistencia

Relatorios sao gravados em:

- `runtime-data/frontend-renderer/`;
- `memory/frontend-renderer/`.

## Script

```bash
npm run frontend-renderer:demo
```

## Restricoes

- readonly-safe obrigatorio;
- sem deploy;
- sem instalar dependencias;
- nao alterar PromoClub007;
- preservar fallback JSON;
- nao usar AI externa nesta V1.

## Readiness

Readiness: `frontend-prototype-renderer-v1-ready`.

Riscos restantes: os prototipos React ainda precisam de QA visual humano, validacao de acessibilidade em navegador real e revisao de branding antes de uso em producao.
