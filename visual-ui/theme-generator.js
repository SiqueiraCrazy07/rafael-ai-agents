class ThemeGenerator {
  generate(project) {
    return {
      themeId: `themes_${project.projectSlug}`,
      selectedTheme: project.category === "game" ? "gamificado-infantil" : project.category === "crm" ? "corporativo" : project.category === "education" ? "educacional" : "minimalista",
      themes: {
        infantil: { mood: "playful, clear, low-friction", useFor: "younger learners" },
        educacional: { mood: "focused, supportive, calm", useFor: "learning platforms" },
        corporativo: { mood: "quiet, dense, operational", useFor: "CRM and business workflows" },
        gamificado: { mood: "rewarding, energetic, structured", useFor: "missions and level systems" },
        minimalista: { mood: "clean, direct, content-first", useFor: "general prototypes" }
      },
      readonly: true,
      safetyMode: "readonly-safe-theme-generator"
    };
  }
}

module.exports = { ThemeGenerator };
