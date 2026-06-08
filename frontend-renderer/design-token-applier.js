const path = require("node:path");
const { readJson } = require("../product-codegen/project-bootstrapper");

const DEFAULT_TOKENS = {
  colors: {
    background: "#f7f8fb",
    surface: "#ffffff",
    text: "#17202a",
    mutedText: "#5f6b7a",
    primary: "#2563eb",
    accent: "#14b8a6",
    success: "#15803d",
    warning: "#b45309",
    error: "#b91c1c",
    focus: "#111827"
  },
  fonts: { body: "Inter, Arial, sans-serif", mono: "ui-monospace, SFMono-Regular, Consolas, monospace" },
  spacing: { xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "32px" },
  sizes: { sidebar: "248px", contentMax: "1180px", radius: "8px" },
  animationsPlanned: { fast: "120ms", standard: "180ms", reward: "240ms" }
};

class DesignTokenApplier {
  load(project) {
    return readJson(path.join(project.projectRoot, "visual-ui", "design-tokens.json")) || DEFAULT_TOKENS;
  }

  css(tokens = DEFAULT_TOKENS) {
    const colors = { ...DEFAULT_TOKENS.colors, ...(tokens.colors || {}) };
    const fonts = { ...DEFAULT_TOKENS.fonts, ...(tokens.fonts || {}) };
    const spacing = { ...DEFAULT_TOKENS.spacing, ...(tokens.spacing || {}) };
    const sizes = { ...DEFAULT_TOKENS.sizes, ...(tokens.sizes || {}) };
    return `
:root {
  --color-background: ${colors.background};
  --color-surface: ${colors.surface};
  --color-text: ${colors.text};
  --color-muted: ${colors.mutedText};
  --color-primary: ${colors.primary};
  --color-accent: ${colors.accent};
  --color-success: ${colors.success};
  --color-warning: ${colors.warning};
  --color-error: ${colors.error};
  --color-focus: ${colors.focus};
  --font-body: ${fonts.body};
  --font-mono: ${fonts.mono};
  --space-xs: ${spacing.xs};
  --space-sm: ${spacing.sm};
  --space-md: ${spacing.md};
  --space-lg: ${spacing.lg};
  --space-xl: ${spacing.xl};
  --radius: ${sizes.radius || "8px"};
  --sidebar: ${sizes.sidebar || "248px"};
  --content-max: ${sizes.contentMax || "1180px"};
}

* { box-sizing: border-box; }
body { margin: 0; background: var(--color-background); color: var(--color-text); font-family: var(--font-body); }
button, input { font: inherit; }
.app-shell { min-height: 100vh; display: grid; grid-template-columns: var(--sidebar) minmax(0, 1fr); }
.app-nav { background: #111827; color: #fff; padding: var(--space-lg); display: flex; flex-direction: column; gap: var(--space-sm); }
.brand { display: grid; gap: 4px; margin-bottom: var(--space-lg); }
.brand strong { font-size: 18px; }
.brand span { color: #cbd5e1; font-size: 12px; }
.nav-link { border: 0; border-radius: var(--radius); padding: 10px 12px; color: #e5e7eb; background: transparent; text-align: left; cursor: pointer; }
.nav-link:hover, .nav-link.active { background: rgba(255,255,255,0.12); color: #fff; }
.app-main { padding: var(--space-xl); max-width: var(--content-max); width: 100%; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-md); margin-bottom: var(--space-lg); }
.page-title { margin: 0; font-size: 32px; line-height: 1.1; }
.page-kicker { margin: 0 0 6px; color: var(--color-muted); font-size: 13px; text-transform: uppercase; letter-spacing: 0; }
.grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: var(--space-md); }
.span-3 { grid-column: span 3; } .span-4 { grid-column: span 4; } .span-6 { grid-column: span 6; } .span-8 { grid-column: span 8; } .span-12 { grid-column: span 12; }
.card { background: var(--color-surface); border: 1px solid #dbe3ef; border-radius: var(--radius); padding: var(--space-md); box-shadow: 0 10px 24px rgba(17, 24, 39, 0.06); }
.card h2, .card h3 { margin-top: 0; }
.metric { display: grid; gap: 8px; min-height: 112px; }
.metric-value { font-size: 28px; font-weight: 800; }
.muted { color: var(--color-muted); }
.button { border: 0; border-radius: var(--radius); padding: 10px 14px; background: var(--color-primary); color: #fff; cursor: pointer; }
.button.secondary { background: #e5e7eb; color: var(--color-text); }
.hud { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--space-sm); }
.hud-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: var(--radius); padding: 10px; }
.progress-track { height: 10px; border-radius: 999px; background: #e5e7eb; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, var(--color-primary), var(--color-accent)); }
.pill-row { display: flex; flex-wrap: wrap; gap: var(--space-sm); }
.pill { border-radius: 999px; background: #eef2ff; color: #3730a3; padding: 6px 10px; font-size: 13px; }
.list { display: grid; gap: var(--space-sm); }
.list-item { border: 1px solid #e2e8f0; border-radius: var(--radius); padding: var(--space-md); background: #fff; }
.status-success { color: var(--color-success); } .status-warning { color: var(--color-warning); } .status-error { color: var(--color-error); }
.login-panel { max-width: 440px; margin: 0 auto; display: grid; gap: var(--space-md); }
.field { display: grid; gap: 6px; } .field input { border: 1px solid #cbd5e1; border-radius: var(--radius); padding: 10px 12px; }
@media (max-width: 860px) {
  .app-shell { grid-template-columns: 1fr; }
  .app-nav { position: sticky; top: 0; z-index: 2; }
  .app-main { padding: var(--space-md); }
  .span-3, .span-4, .span-6, .span-8 { grid-column: span 12; }
  .hud { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .page-header { display: grid; }
}
`;
  }
}

module.exports = { DesignTokenApplier, DEFAULT_TOKENS };
