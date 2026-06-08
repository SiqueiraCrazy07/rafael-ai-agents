class ErrorCorrectionEngine {
  generate(project) {
    return {
      correctionId: `error_correction_${project.projectSlug}`,
      contextualCorrection: [
        "identify the exact misconception",
        "show the correct reasoning",
        "offer a similar retry",
        "schedule review if error repeats"
      ],
      friendlyExplanation: "short explanation that separates the learner from the mistake",
      noPunishmentReinforcement: [
        "no shame language",
        "retry is normal",
        "progress remains visible",
        "feedback points to next action"
      ],
      suggestedReview: [
        "review prerequisite concept",
        "try one guided example",
        "retry original challenge",
        "mark weak skill for spaced review"
      ],
      readonly: true,
      safetyMode: "readonly-safe-error-correction-engine"
    };
  }
}

module.exports = { ErrorCorrectionEngine };
