class SpacedRepetitionEngine {
  generate({ project, profile }) {
    const baseIntervals = profile.ageBand === "8-13" ? [1, 2, 5, 10] : [1, 3, 7, 14, 30];
    return {
      planId: `spaced_repetition_${project.projectSlug}`,
      forgettingCurve: "review before predicted recall drop",
      intervalsDays: baseIntervals,
      reviewStrategy: [
        "review weak items first",
        "mix previous and current topics",
        "increase interval only after successful recall",
        "reset interval after repeated misses"
      ],
      longTermMemory: {
        target: "durable recall",
        evidenceSignals: ["accuracy", "time-to-answer", "repeat mistakes", "missed sessions"]
      },
      readonly: true,
      safetyMode: "readonly-safe-spaced-repetition-engine"
    };
  }
}

module.exports = { SpacedRepetitionEngine };
