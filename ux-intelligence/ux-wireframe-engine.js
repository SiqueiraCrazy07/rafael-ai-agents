class UxWireframeEngine {
  generate({ project, flow, accessibility, ageAdaptation }) {
    const screens = project.screens.length ? project.screens : ["home dashboard", "practice", "review"];
    return {
      wireframeId: `ux_wireframes_${project.projectSlug}`,
      screens: screens.map((screen, index) => ({
        order: index + 1,
        screen,
        layout: [
          "top status area with learner goal",
          "main task area with one primary action",
          "progress and feedback panel",
          "secondary navigation below or sidebar"
        ],
        cognitiveIntent: flow.cognitiveFlow,
        ageAdaptation: ageAdaptation.language,
        accessibilityChecks: accessibility.focus.slice(0, 2)
      })),
      navigationMap: screens.map((screen, index) => ({
        from: screen,
        to: screens[index + 1] || "review checkpoint",
        trigger: "primary action complete"
      })),
      readonly: true,
      safetyMode: "readonly-safe-ux-wireframe-engine"
    };
  }
}

module.exports = { UxWireframeEngine };
