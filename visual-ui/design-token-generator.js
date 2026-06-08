class DesignTokenGenerator {
  generate({ project, theme }) {
    const playful = project.category === "game";
    return {
      tokenId: `design_tokens_${project.projectSlug}`,
      colors: {
        background: "#F7FAFC",
        surface: "#FFFFFF",
        text: "#172033",
        mutedText: "#5B677A",
        primary: playful ? "#2563EB" : "#0F766E",
        accent: playful ? "#F59E0B" : "#2563EB",
        success: "#15803D",
        warning: "#B45309",
        error: "#B91C1C",
        focus: "#111827"
      },
      fonts: { body: "Inter, system-ui, sans-serif", mono: "ui-monospace, SFMono-Regular, monospace" },
      spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
      sizes: { tapTarget: 44, sidebar: 240, hudHeight: 64, cardRadius: 8 },
      animationsPlanned: { fast: "120ms", normal: "200ms", reward: "420ms" },
      theme: theme.selectedTheme,
      readonly: true,
      safetyMode: "readonly-safe-design-token-generator"
    };
  }
}

module.exports = { DesignTokenGenerator };
