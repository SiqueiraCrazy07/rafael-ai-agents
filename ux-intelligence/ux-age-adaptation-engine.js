class UxAgeAdaptationEngine {
  generate({ project, profile }) {
    const child = profile.ageBand === "8-13";
    return {
      ageAdaptationId: `ux_age_adaptation_${project.projectSlug}`,
      ageBand: profile.ageBand,
      language: child ? "short, concrete and encouraging" : "direct, goal-oriented and reflective",
      complexity: child ? "one concept per screen" : "progressive detail with optional depth",
      navigation: child ? "large targets and guided next step" : "dashboard navigation with clear sections",
      feedback: child ? "immediate visual feedback with simple correction" : "specific feedback with mastery rationale",
      guardrails: [
        "avoid excessive cognitive load",
        "keep actions reversible in prototype",
        "separate practice, review and assessment states"
      ],
      readonly: true,
      safetyMode: "readonly-safe-ux-age-adaptation-engine"
    };
  }
}

module.exports = { UxAgeAdaptationEngine };
