class AdaptiveTutorEngine {
  generate(project) {
    const childTone = project.category === "game";
    return {
      adaptiveTutorId: `adaptive_tutor_${project.projectSlug}`,
      difficulty: [
        "start with guided examples",
        "increase challenge after mastery evidence",
        "return to review mode after repeated errors"
      ],
      tone: childTone ? "short, concrete and encouraging" : "clear, reflective and goal-oriented",
      explanation: childTone ? "one idea per message" : "step-by-step with optional deeper rationale",
      speed: childTone ? "fast feedback with short turns" : "self-paced with recap checkpoints",
      depth: childTone ? "practical examples first" : "concept, example, application and reflection",
      profileAdaptation: ["age band", "retention risk", "error pattern", "engagement signal"],
      readonly: true,
      externalAiUsed: false,
      safetyMode: "readonly-safe-adaptive-tutor-engine"
    };
  }
}

module.exports = { AdaptiveTutorEngine };
