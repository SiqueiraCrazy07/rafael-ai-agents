class VisualWireframeGenerator {
  generate({ project, layout, gamifiedUi }) {
    const screens = project.screens.length ? project.screens : ["dashboard", "practice", "review"];
    return {
      visualWireframeId: `visual_wireframes_${project.projectSlug}`,
      screens: screens.map((screen, index) => ({
        order: index + 1,
        screen,
        structure: ["header/HUD", "primary content", "feedback panel", "next action"],
        layout: index === 0 ? layout.layouts[0] : layout.layouts[Math.min(index, layout.layouts.length - 1)],
        gamifiedLayer: gamifiedUi.levelProgressionVisuals[index % gamifiedUi.levelProgressionVisuals.length],
        accessibility: ["visible focus", "semantic heading", "no overlap"]
      })),
      readonly: true,
      safetyMode: "readonly-safe-visual-wireframe-generator"
    };
  }
}

module.exports = { VisualWireframeGenerator };
