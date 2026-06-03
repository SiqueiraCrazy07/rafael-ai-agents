class GamificationEngine {
  generate({ project }) {
    const missionLabel = project.category === "game" ? "missions" : "learning quests";
    return {
      gamificationId: `gamification_${project.projectSlug}`,
      xp: {
        lessonComplete: 20,
        reviewComplete: 10,
        masteryAchieved: 50,
        comebackSession: 15
      },
      streaks: ["daily practice", "weekly mastery", "review consistency"],
      achievements: ["first mastery", "five reviews", "no-hint solution", "comeback learner"],
      missions: [
        `complete 3 ${missionLabel}`,
        "recover one weak skill",
        "finish a mastery checkpoint"
      ],
      rewards: ["visual badge", "progress milestone", "unlock next challenge"],
      visualProgression: ["level bar", "skill map", "mastery rings"],
      readonly: true,
      safetyMode: "readonly-safe-gamification-engine"
    };
  }
}

module.exports = { GamificationEngine };
