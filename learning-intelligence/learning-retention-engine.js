class LearningRetentionEngine {
  generate({ project, spacedRepetition }) {
    return {
      retentionId: `learning_retention_${project.projectSlug}`,
      strategy: "combine active recall with spaced review and interleaving",
      checkpoints: spacedRepetition.intervalsDays.map((day) => ({
        day,
        prompt: `Recall and apply key ${project.productName} concepts after ${day} day(s)`
      })),
      memoryStrengthSignals: ["first-attempt accuracy", "review completion", "error decay", "time since last success"],
      riskRules: [
        "flag skill as at-risk after two misses",
        "increase review frequency for weak concepts",
        "keep mastered items in low-frequency maintenance"
      ],
      readonly: true,
      safetyMode: "readonly-safe-learning-retention-engine"
    };
  }
}

module.exports = { LearningRetentionEngine };
