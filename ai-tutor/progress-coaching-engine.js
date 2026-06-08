class ProgressCoachingEngine {
  generate(project) {
    return {
      progressCoachingId: `progress_coaching_${project.projectSlug}`,
      progressSummary: [
        "current mission status",
        "recent review completion",
        "mastery checkpoint progress"
      ],
      currentMastery: "summarize mastered, practicing and weak skills",
      weakAreas: ["repeated errors", "missed reviews", "slow recall"],
      suggestedGoals: [
        "complete one review checkpoint",
        "retry one weak skill",
        "finish one conversation or challenge"
      ],
      cadence: "short summary after session and weekly recap placeholder",
      readonly: true,
      safetyMode: "readonly-safe-progress-coaching-engine"
    };
  }
}

module.exports = { ProgressCoachingEngine };
