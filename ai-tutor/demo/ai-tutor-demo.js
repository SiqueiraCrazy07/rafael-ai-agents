const { AiTutorRuntime } = require("../ai-tutor-runtime");

function runAiTutorDemo({ rootDir = process.cwd() } = {}) {
  const runtime = new AiTutorRuntime({ rootDir });
  const report = runtime.run({ limit: 4 });
  const generated = report.processedProjects.filter((item) => item.generated);
  console.log(JSON.stringify({
    aiTutorReportId: report.aiTutorReportId,
    status: report.status,
    projectsProcessed: report.projectsProcessed,
    tutorsGenerated: generated.map((item) => ({
      project: item.project.projectSlug,
      personality: item.tutorPlan.personality,
      filesCreated: item.filesCreated
    })),
    conversationalFlows: generated.map((item) => ({
      project: item.project.projectSlug,
      questions: item.conversationalLearning.questions,
      followUps: item.conversationalLearning.followUps,
      simulations: item.conversationSimulation.scenarios
    })),
    guidanceSystems: generated.map((item) => ({
      project: item.project.projectSlug,
      orientation: item.studentGuidance.orientation,
      tips: item.studentGuidance.tips,
      coaching: item.studentGuidance.coaching
    })),
    contextualCorrection: generated.map((item) => ({
      project: item.project.projectSlug,
      correction: item.errorCorrection.contextualCorrection,
      suggestedReview: item.errorCorrection.suggestedReview
    })),
    motivationSystems: generated.map((item) => ({
      project: item.project.projectSlug,
      motivation: item.motivation.motivation,
      streakReinforcement: item.motivation.streakReinforcement,
      progressCelebration: item.motivation.progressCelebration
    })),
    pronunciationCoaching: generated
      .filter((item) => item.pronunciationCoaching.enabled)
      .map((item) => ({
        project: item.project.projectSlug,
        speakingPrompts: item.pronunciationCoaching.speakingPrompts,
        phoneticGuidance: item.pronunciationCoaching.phoneticGuidance,
        checkpoints: item.pronunciationCoaching.pronunciationCheckpoints,
        placeholderOnly: item.pronunciationCoaching.placeholderOnly
      })),
    memorySystems: generated.map((item) => ({
      project: item.project.projectSlug,
      history: item.studentMemory.history,
      difficulties: item.studentMemory.difficulties,
      progress: item.studentMemory.progress,
      mastery: item.studentMemory.mastery
    })),
    progressCoaching: generated.map((item) => ({
      project: item.project.projectSlug,
      progressSummary: item.progressCoaching.progressSummary,
      weakAreas: item.progressCoaching.weakAreas,
      suggestedGoals: item.progressCoaching.suggestedGoals
    })),
    validations: generated.map((item) => ({
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
    runAiTutorDemo();
  } catch (error) {
    console.error(JSON.stringify({
      status: "ai_tutor_demo_failed",
      error: error.message,
      fallback: {
        safeMode: true,
        reason: "ai-tutor-demo-error",
        jsonFallback: true
      }
    }, null, 2));
    process.exitCode = 1;
  }
}

module.exports = { runAiTutorDemo };
