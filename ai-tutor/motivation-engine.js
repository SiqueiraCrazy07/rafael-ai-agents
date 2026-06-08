class MotivationEngine {
  generate(project) {
    return {
      motivationId: `motivation_${project.projectSlug}`,
      motivation: [
        "remind learner of the current goal",
        "show visible progress",
        "reduce next action to a small step"
      ],
      encouragement: [
        "You improved the part you practiced.",
        "One focused retry is enough for this step.",
        "Let's protect your progress with a quick review."
      ],
      streakReinforcement: [
        "daily practice acknowledged",
        "missed day returns with comeback mission",
        "streak framed as consistency, not pressure"
      ],
      positiveFeedback: [
        "specific success signal",
        "skill named clearly",
        "next challenge unlocked"
      ],
      progressCelebration: ["mastery checkpoint", "review recovered", "mission completed"],
      readonly: true,
      safetyMode: "readonly-safe-motivation-engine"
    };
  }
}

module.exports = { MotivationEngine };
