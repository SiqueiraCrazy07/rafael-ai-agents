class ComponentLibraryGenerator {
  generate(project) {
    return {
      componentLibraryId: `component_library_${project.projectSlug}`,
      components: [
        { name: "Button", variants: ["primary", "secondary", "icon", "danger-disabled-plan-only"] },
        { name: "Card", variants: ["task", "dashboard", "mission", "feedback"] },
        { name: "HUD", variants: ["learning", "game", "progress"] },
        { name: "ProgressBar", variants: ["linear", "mastery", "XP"] },
        { name: "Quiz", variants: ["choice", "matching", "fill-blank", "written"] },
        { name: "Dashboard", variants: ["learner", "operator", "analytics"] },
        { name: "Navigation", variants: ["sidebar", "bottom-tabs", "breadcrumb"] },
        { name: "StreakWidget", variants: ["daily", "weekly", "comeback"] },
        { name: "XpWidget", variants: ["compact", "reward", "level"] }
      ],
      readonly: true,
      safetyMode: "readonly-safe-component-library-generator"
    };
  }
}

module.exports = { ComponentLibraryGenerator };
