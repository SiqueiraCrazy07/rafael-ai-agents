const fs = require("node:fs");
const path = require("node:path");
const { AdaptiveLearningEngine } = require("../adaptive-learning-engine");
const { CognitiveProgressionEngine } = require("../cognitive-progression-engine");
const { GamificationEngine } = require("../gamification-engine");
const { LearningAnalyticsEngine } = require("../learning-analytics-engine");
const { LearningDifficultyEngine } = require("../learning-difficulty-engine");
const { LearningMemoryEngine } = require("../learning-memory-engine");
const { LearningRetentionEngine } = require("../learning-retention-engine");
const { MasteryLearningEngine } = require("../mastery-learning-engine");
const { SpacedRepetitionEngine } = require("../spaced-repetition-engine");
const { StudentProfileEngine } = require("../student-profile-engine");
const { UxAccessibilityEngine } = require("../../ux-intelligence/ux-accessibility-engine");
const { UxAgeAdaptationEngine } = require("../../ux-intelligence/ux-age-adaptation-engine");
const { UxCognitiveFlowEngine } = require("../../ux-intelligence/ux-cognitive-flow-engine");
const { UxEngagementEngine } = require("../../ux-intelligence/ux-engagement-engine");
const { UxFeedbackEngine } = require("../../ux-intelligence/ux-feedback-engine");
const { UxWireframeEngine } = require("../../ux-intelligence/ux-wireframe-engine");
const { ProjectBootstrapper } = require("../../product-codegen/project-bootstrapper");

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

class AutonomousUxLearningIntelligenceRuntime {
  constructor({ rootDir = process.cwd() } = {}) {
    this.rootDir = rootDir;
    this.projectBootstrapper = new ProjectBootstrapper({ rootDir });
    this.learningRuntimeDir = path.join(rootDir, "runtime-data", "learning-intelligence");
    this.learningMemoryDir = path.join(rootDir, "memory", "learning-intelligence");
    this.uxRuntimeDir = path.join(rootDir, "runtime-data", "ux-intelligence");
    this.uxMemoryDir = path.join(rootDir, "memory", "ux-intelligence");
    this.studentProfileEngine = new StudentProfileEngine();
    this.spacedRepetitionEngine = new SpacedRepetitionEngine();
    this.masteryLearningEngine = new MasteryLearningEngine();
    this.cognitiveProgressionEngine = new CognitiveProgressionEngine();
    this.learningDifficultyEngine = new LearningDifficultyEngine();
    this.learningRetentionEngine = new LearningRetentionEngine();
    this.gamificationEngine = new GamificationEngine();
    this.learningMemoryEngine = new LearningMemoryEngine();
    this.learningAnalyticsEngine = new LearningAnalyticsEngine();
    this.adaptiveLearningEngine = new AdaptiveLearningEngine();
    this.uxCognitiveFlowEngine = new UxCognitiveFlowEngine();
    this.uxEngagementEngine = new UxEngagementEngine();
    this.uxAccessibilityEngine = new UxAccessibilityEngine();
    this.uxAgeAdaptationEngine = new UxAgeAdaptationEngine();
    this.uxFeedbackEngine = new UxFeedbackEngine();
    this.uxWireframeEngine = new UxWireframeEngine();
  }

  run({ limit = 4 } = {}) {
    [this.learningRuntimeDir, this.learningMemoryDir, this.uxRuntimeDir, this.uxMemoryDir].forEach(ensureDir);
    const projects = this.projectBootstrapper.discoverProjects().slice(0, limit);
    const processedProjects = projects.map((project) => this.processProject(project));
    const allValid = processedProjects.every((item) => item.validation.valid);
    const report = {
      learningUxReportId: `learning_ux_intelligence_report_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      status: allValid ? "autonomous_ux_learning_intelligence_ready" : "autonomous_ux_learning_intelligence_attention_required",
      readonly: true,
      externalAiUsed: false,
      deployExecuted: false,
      projectsProcessed: processedProjects.map((item) => ({
        projectSlug: item.project.projectSlug,
        category: item.project.category,
        learningReady: item.validation.valid,
        wireframes: item.ux.wireframes.screens.length
      })),
      processedProjects,
      integrations: {
        productFactory: "uses Product Factory category and learning-framework metadata through generated projects",
        productBuilder: "reads Product Builder prototype JSON and UX/curriculum outputs",
        productCodegen: "aligns with generated frontend/backend/database prototype structure",
        runtime: "persists readonly reports in runtime-data",
        telemetry: "memory reports are telemetry-readable",
        dashboard: "summaries are dashboard-readable"
      },
      fallback: {
        safeMode: true,
        jsonFallback: true,
        behavior: "uses deterministic local engines only; no external AI, deploy, dependency install, or destructive execution"
      },
      risks: [
        "adaptive recommendations are prototype heuristics and need learner data calibration",
        "age adaptation is rule-based in V1",
        "analytics are readiness signals, not measured production outcomes",
        "wireframes are textual and require design review before implementation"
      ],
      readiness: allValid
        ? "autonomous-ux-learning-intelligence-v1-ready"
        : "autonomous-ux-learning-intelligence-v1-attention-required",
      persistence: null
    };
    report.persistence = this.persist(report);
    return report;
  }

  processProject(project) {
    const profile = this.studentProfileEngine.create({ project });
    const spacedRepetition = this.spacedRepetitionEngine.generate({ project, profile });
    const mastery = this.masteryLearningEngine.generate({ project });
    const progression = this.cognitiveProgressionEngine.generate({ project, mastery });
    const difficulty = this.learningDifficultyEngine.generate({ project, profile });
    const retention = this.learningRetentionEngine.generate({ project, spacedRepetition });
    const gamification = this.gamificationEngine.generate({ project });
    const memory = this.learningMemoryEngine.generate({ project, profile, retention });
    const analytics = this.learningAnalyticsEngine.analyze({ project, progression, retention, gamification });
    const adaptiveLearning = this.adaptiveLearningEngine.generate({
      project,
      profile,
      difficulty,
      spacedRepetition,
      mastery,
      analytics
    });
    const cognitiveFlow = this.uxCognitiveFlowEngine.generate({ project, profile });
    const engagement = this.uxEngagementEngine.generate({ project, gamification });
    const accessibility = this.uxAccessibilityEngine.generate({ project });
    const ageAdaptation = this.uxAgeAdaptationEngine.generate({ project, profile });
    const feedback = this.uxFeedbackEngine.generate({ project, mastery });
    const wireframes = this.uxWireframeEngine.generate({ project, flow: cognitiveFlow, accessibility, ageAdaptation });
    const learning = {
      profile,
      spacedRepetition,
      mastery,
      progression,
      difficulty,
      retention,
      gamification,
      memory,
      analytics,
      adaptiveLearning
    };
    const ux = {
      cognitiveFlow,
      engagement,
      accessibility,
      ageAdaptation,
      feedback,
      wireframes
    };
    return {
      intelligenceId: `learning_ux_${project.projectSlug}_${Date.now()}`,
      project,
      learning,
      ux,
      validation: this.validate({ learning, ux }),
      readonly: true,
      externalAiUsed: false,
      deployExecuted: false,
      safetyMode: "readonly-safe-autonomous-ux-learning-intelligence"
    };
  }

  validate({ learning, ux }) {
    const checks = [
      { id: "adaptive-learning", ok: learning.adaptiveLearning.adjustments.review.length > 0 },
      { id: "spaced-repetition", ok: learning.spacedRepetition.intervalsDays.length >= 4 },
      { id: "mastery-learning", ok: learning.mastery.threshold >= 0.8 },
      { id: "gamification", ok: learning.gamification.missions.length >= 3 },
      { id: "analytics", ok: Boolean(learning.analytics.performance.status) },
      { id: "ux-cognitive-flow", ok: ux.cognitiveFlow.journeys.length >= 4 },
      { id: "ux-accessibility", ok: ux.accessibility.focus.length >= 3 },
      { id: "ux-wireframes", ok: ux.wireframes.screens.length > 0 },
      { id: "readonly-safe", ok: learning.adaptiveLearning.readonly && ux.wireframes.readonly },
      { id: "no-external-ai", ok: learning.adaptiveLearning.externalAiUsed === false }
    ].map((check) => ({ ...check, readonly: true }));
    const failures = checks.filter((check) => !check.ok);
    return {
      valid: failures.length === 0,
      checks,
      failures,
      readonly: true,
      safetyMode: "readonly-safe-learning-ux-validation"
    };
  }

  persist(report) {
    const filename = `learning-ux-intelligence-${timestampForFile()}-${report.learningUxReportId}.json`;
    const learningRuntimePath = path.join(this.learningRuntimeDir, filename);
    const learningMemoryPath = path.join(this.learningMemoryDir, filename);
    const uxRuntimePath = path.join(this.uxRuntimeDir, filename);
    const uxMemoryPath = path.join(this.uxMemoryDir, filename);
    fs.writeFileSync(learningRuntimePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(learningMemoryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(uxRuntimePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(uxMemoryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    return {
      learningRuntimePath,
      learningMemoryPath,
      uxRuntimePath,
      uxMemoryPath,
      safetyMode: "readonly-safe-learning-ux-persistence"
    };
  }
}

function runLearningIntelligenceDemo({ rootDir = process.cwd() } = {}) {
  const runtime = new AutonomousUxLearningIntelligenceRuntime({ rootDir });
  const report = runtime.run({ limit: 4 });
  console.log(JSON.stringify({
    learningUxReportId: report.learningUxReportId,
    status: report.status,
    projectsProcessed: report.projectsProcessed,
    learningEngines: [
      "AdaptiveLearningEngine",
      "CognitiveProgressionEngine",
      "SpacedRepetitionEngine",
      "MasteryLearningEngine",
      "GamificationEngine",
      "StudentProfileEngine",
      "LearningMemoryEngine",
      "LearningAnalyticsEngine",
      "LearningDifficultyEngine",
      "LearningRetentionEngine"
    ],
    uxEngines: [
      "UxCognitiveFlowEngine",
      "UxEngagementEngine",
      "UxAccessibilityEngine",
      "UxAgeAdaptationEngine",
      "UxFeedbackEngine",
      "UxWireframeEngine"
    ],
    adaptiveLearning: report.processedProjects.map((item) => ({
      project: item.project.projectSlug,
      pace: item.learning.adaptiveLearning.adjustments.pace,
      review: item.learning.adaptiveLearning.adjustments.review,
      analyticsStatus: item.learning.adaptiveLearning.analyticsStatus
    })),
    gamification: report.processedProjects.map((item) => ({
      project: item.project.projectSlug,
      xp: item.learning.gamification.xp,
      missions: item.learning.gamification.missions,
      rewards: item.learning.gamification.rewards
    })),
    cognitiveFlows: report.processedProjects.map((item) => ({
      project: item.project.projectSlug,
      journeys: item.ux.cognitiveFlow.journeys,
      ageBand: item.learning.profile.ageBand
    })),
    wireframes: report.processedProjects.map((item) => ({
      project: item.project.projectSlug,
      screens: item.ux.wireframes.screens.map((screen) => screen.screen)
    })),
    analytics: report.processedProjects.map((item) => ({
      project: item.project.projectSlug,
      performance: item.learning.analytics.performance,
      engagement: item.learning.analytics.engagement
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
    runLearningIntelligenceDemo();
  } catch (error) {
    console.error(JSON.stringify({
      status: "learning_intelligence_demo_failed",
      error: error.message,
      fallback: {
        safeMode: true,
        reason: "learning-intelligence-demo-error",
        jsonFallback: true
      }
    }, null, 2));
    process.exitCode = 1;
  }
}

module.exports = {
  AutonomousUxLearningIntelligenceRuntime,
  runLearningIntelligenceDemo
};
