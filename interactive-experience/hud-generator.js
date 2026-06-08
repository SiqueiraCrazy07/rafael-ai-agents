class HudGenerator {
  generate(project) {
    return {
      hudId: `hud_${project.projectSlug}`,
      elements: [
        "progress bar",
        "XP counter",
        "level indicator",
        "lives or attempts",
        "correct and error feedback",
        "current mission"
      ],
      layout: {
        top: ["progress bar", "level indicator", "XP counter"],
        main: ["challenge prompt", "interaction area"],
        side: ["current mission", "attempts"],
        bottom: ["feedback", "next action"]
      },
      states: ["idle", "attempting", "correct", "needs-review", "reward", "mastery"],
      accessibility: ["status not color-only", "visible focus", "readable counters"],
      readonly: true,
      safetyMode: "readonly-safe-hud-generator"
    };
  }
}

module.exports = { HudGenerator };
