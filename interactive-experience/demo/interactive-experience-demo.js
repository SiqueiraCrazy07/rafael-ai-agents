const { InteractiveExperienceEngine } = require("../interactive-experience-engine");

function runInteractiveExperienceDemo({ rootDir = process.cwd() } = {}) {
  const engine = new InteractiveExperienceEngine({ rootDir });
  const report = engine.run({ limit: 4 });
  console.log(JSON.stringify({
    interactiveExperienceReportId: report.interactiveExperienceReportId,
    status: report.status,
    projectsProcessed: report.projectsProcessed,
    gameplayLoops: report.processedProjects.map((item) => ({
      project: item.project.projectSlug,
      objective: item.gameplayLoop.objective,
      loop: item.gameplayLoop.learningLoop
    })),
    minigames: report.processedProjects.map((item) => ({
      project: item.project.projectSlug,
      minigames: item.minigames.recommended.map((game) => `${game.subject}:${game.name}`)
    })),
    missions: report.processedProjects.map((item) => ({
      project: item.project.projectSlug,
      daily: item.missions.dailyMissions,
      levels: item.missions.levelMissions
    })),
    rewards: report.processedProjects.map((item) => ({
      project: item.project.projectSlug,
      xp: item.rewards.xp,
      badges: item.rewards.badges,
      unlocks: item.rewards.unlocks
    })),
    hud: report.processedProjects.map((item) => ({
      project: item.project.projectSlug,
      elements: item.hud.elements,
      states: item.hud.states
    })),
    visualFeedback: report.processedProjects.map((item) => ({
      project: item.project.projectSlug,
      positive: item.visualFeedback.positive,
      errorWithoutFrustration: item.visualFeedback.errorWithoutFrustration
    })),
    speakingListeningFlows: report.processedProjects
      .filter((item) => item.speakingListening.enabled)
      .map((item) => ({
        project: item.project.projectSlug,
        listeningPractice: item.speakingListening.listeningPractice,
        speakingPrompt: item.speakingListening.speakingPrompt,
        conversationPractice: item.speakingListening.conversationPractice
      })),
    adaptiveInteractions: report.processedProjects.map((item) => ({
      project: item.project.projectSlug,
      difficultyAdjustment: item.adaptiveInteractions.difficultyAdjustment,
      reviewSuggestion: item.adaptiveInteractions.reviewSuggestion
    })),
    filesCreated: report.processedProjects.map((item) => ({
      project: item.project.projectSlug,
      files: item.filesCreated
    })),
    validations: report.processedProjects.map((item) => ({
      project: item.project.projectSlug,
      valid: item.validation.valid,
      failures: item.validation.failures
    })),
    risks: report.risks,
    readiness: report.readiness,
    persistence: report.persistence
  }, null, 2));
  return report;
}

if (require.main === module) {
  try {
    runInteractiveExperienceDemo();
  } catch (error) {
    console.error(JSON.stringify({
      status: "interactive_experience_demo_failed",
      error: error.message,
      fallback: {
        safeMode: true,
        reason: "interactive-experience-demo-error",
        jsonFallback: true
      }
    }, null, 2));
    process.exitCode = 1;
  }
}

module.exports = { runInteractiveExperienceDemo };
