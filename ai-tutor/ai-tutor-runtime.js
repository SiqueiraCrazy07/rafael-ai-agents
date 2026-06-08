const fs = require("node:fs");
const path = require("node:path");
const { ProjectBootstrapper, ensureDir, writeFile } = require("../product-codegen/project-bootstrapper");
const { AdaptiveTutorEngine } = require("./adaptive-tutor-engine");
const { ConversationSimulationEngine } = require("./conversation-simulation-engine");
const { ConversationalLearningEngine } = require("./conversational-learning-engine");
const { ErrorCorrectionEngine } = require("./error-correction-engine");
const { LearningRecommendationEngine } = require("./learning-recommendation-engine");
const { MotivationEngine } = require("./motivation-engine");
const { ProgressCoachingEngine } = require("./progress-coaching-engine");
const { PronunciationCoachingEngine } = require("./pronunciation-coaching-engine");
const { StudentGuidanceEngine } = require("./student-guidance-engine");
const { StudentMemoryEngine } = require("./student-memory-engine");

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

function md(title, sections) {
  const body = Object.entries(sections)
    .map(([key, value]) => {
      const content = Array.isArray(value)
        ? value.map((item) => `- ${typeof item === "string" ? item : JSON.stringify(item)}`).join("\n")
        : String(value);
      return `## ${key}\n\n${content}`;
    })
    .join("\n\n");
  return `# ${title}\n\n${body}`;
}

class AiTutorRuntime {
  constructor({ rootDir = process.cwd() } = {}) {
    this.rootDir = rootDir;
    this.runtimeDir = path.join(rootDir, "runtime-data", "ai-tutor");
    this.memoryDir = path.join(rootDir, "memory", "ai-tutor");
    this.projectBootstrapper = new ProjectBootstrapper({ rootDir });
    this.conversationalLearningEngine = new ConversationalLearningEngine();
    this.adaptiveTutorEngine = new AdaptiveTutorEngine();
    this.studentGuidanceEngine = new StudentGuidanceEngine();
    this.errorCorrectionEngine = new ErrorCorrectionEngine();
    this.motivationEngine = new MotivationEngine();
    this.pronunciationCoachingEngine = new PronunciationCoachingEngine();
    this.conversationSimulationEngine = new ConversationSimulationEngine();
    this.learningRecommendationEngine = new LearningRecommendationEngine();
    this.studentMemoryEngine = new StudentMemoryEngine();
    this.progressCoachingEngine = new ProgressCoachingEngine();
  }

  run({ limit = 4 } = {}) {
    ensureDir(this.runtimeDir);
    ensureDir(this.memoryDir);
    const projects = this.projectBootstrapper.discoverProjects().slice(0, limit);
    const processedProjects = projects.map((project) => (
      this.isEducationalProject(project) ? this.generateTutor(project) : this.skipProject(project)
    ));
    const generatedTutors = processedProjects.filter((item) => item.generated);
    const allValid = generatedTutors.every((item) => item.validation.valid);
    const report = {
      aiTutorReportId: `ai_tutor_report_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      status: allValid ? "ai_tutor_conversational_learning_ready" : "ai_tutor_conversational_learning_attention_required",
      readonly: true,
      externalAiUsed: false,
      deployExecuted: false,
      voiceProcessingExecuted: false,
      projectsProcessed: processedProjects.map((item) => ({
        projectSlug: item.project.projectSlug,
        generated: item.generated,
        reason: item.reason,
        filesCreated: item.filesCreated?.length || 0,
        pronunciationCoaching: Boolean(item.pronunciationCoaching?.enabled)
      })),
      processedProjects,
      integrations: {
        productCodegen: "uses generated project metadata and can guide generated frontend/backend tutor surfaces",
        learningIntelligence: "uses adaptive learning, mastery, retention and progress concepts",
        interactiveExperience: "uses interactive missions, feedback and speaking/listening placeholders",
        runtime: "persists reports in runtime-data",
        telemetry: "memory reports are telemetry-readable",
        dashboard: "summary is dashboard-readable"
      },
      fallback: {
        safeMode: true,
        jsonFallback: true,
        behavior: "deterministic tutor plans only; no external AI, no deploy, no real voice processing"
      },
      risks: [
        "tutor responses are scripted pedagogical plans, not production AI conversations",
        "pronunciation coaching is placeholder-only without speech recognition",
        "student memory stores schema and snapshots, not real learner telemetry",
        "regulated or child-facing products require human review before release"
      ],
      readiness: allValid
        ? "ai-tutor-conversational-learning-runtime-v1-ready"
        : "ai-tutor-conversational-learning-runtime-v1-attention-required",
      persistence: null
    };
    report.persistence = this.persist(report);
    return report;
  }

  isEducationalProject(project) {
    return project.category === "education" || project.category === "game" || project.curriculumGenerated;
  }

  skipProject(project) {
    return {
      aiTutorId: `ai_tutor_skipped_${project.projectSlug}`,
      project,
      generated: false,
      reason: "non-educational-project",
      readonly: true,
      safetyMode: "readonly-safe-ai-tutor-skip"
    };
  }

  generateTutor(project) {
    const conversationalLearning = this.conversationalLearningEngine.generate(project);
    const adaptiveTutor = this.adaptiveTutorEngine.generate(project);
    const studentGuidance = this.studentGuidanceEngine.generate(project);
    const errorCorrection = this.errorCorrectionEngine.generate(project);
    const motivation = this.motivationEngine.generate(project);
    const pronunciationCoaching = this.pronunciationCoachingEngine.generate(project);
    const conversationSimulation = this.conversationSimulationEngine.generate(project);
    const learningRecommendation = this.learningRecommendationEngine.generate(project);
    const studentMemory = this.studentMemoryEngine.generate(project);
    const progressCoaching = this.progressCoachingEngine.generate(project);
    const tutorPlan = {
      tutorPlanId: `tutor_plan_${project.projectSlug}_${Date.now()}`,
      project: {
        projectSlug: project.projectSlug,
        productName: project.productName,
        category: project.category
      },
      personality: {
        role: "adaptive learning tutor",
        tone: adaptiveTutor.tone,
        boundaries: ["pedagogical placeholder", "no external AI", "no voice processing", "no punitive feedback"]
      },
      conversationalLearning,
      adaptiveTutor,
      studentGuidance,
      errorCorrection,
      motivation,
      pronunciationCoaching,
      conversationSimulation,
      learningRecommendation,
      studentMemory,
      progressCoaching,
      readonly: true,
      externalAiUsed: false,
      voiceProcessingExecuted: false,
      safetyMode: "readonly-safe-ai-tutor-plan"
    };
    const filesCreated = this.writeProjectFiles({ project, tutorPlan });
    const validation = this.validate({ project, tutorPlan, filesCreated });
    return {
      aiTutorId: `ai_tutor_${project.projectSlug}_${Date.now()}`,
      project,
      generated: true,
      reason: "educational-project",
      tutorPlan,
      conversationalLearning,
      adaptiveTutor,
      studentGuidance,
      errorCorrection,
      motivation,
      pronunciationCoaching,
      conversationSimulation,
      learningRecommendation,
      studentMemory,
      progressCoaching,
      filesCreated,
      validation,
      readonly: true,
      externalAiUsed: false,
      voiceProcessingExecuted: false,
      deployExecuted: false,
      safetyMode: "readonly-safe-ai-tutor-runtime"
    };
  }

  writeProjectFiles({ project, tutorPlan }) {
    const dir = path.join(project.projectRoot, "ai-tutor");
    ensureDir(dir);
    const files = [
      writeFile(path.join(dir, "tutor-personality.md"), md("Tutor Personality", tutorPlan.personality)),
      writeFile(path.join(dir, "conversation-flows.md"), md("Conversation Flows", {
        practice: tutorPlan.conversationalLearning.practice,
        questions: tutorPlan.conversationalLearning.questions,
        followUps: tutorPlan.conversationalLearning.followUps,
        simulations: tutorPlan.conversationSimulation.dialogs
      })),
      writeFile(path.join(dir, "adaptive-guidance.md"), md("Adaptive Guidance", {
        difficulty: tutorPlan.adaptiveTutor.difficulty,
        tone: tutorPlan.adaptiveTutor.tone,
        explanation: tutorPlan.adaptiveTutor.explanation,
        speed: tutorPlan.adaptiveTutor.speed,
        depth: tutorPlan.adaptiveTutor.depth,
        recommendations: tutorPlan.learningRecommendation.recommendedExercises
      })),
      writeFile(path.join(dir, "correction-system.md"), md("Correction System", {
        contextualCorrection: tutorPlan.errorCorrection.contextualCorrection,
        friendlyExplanation: tutorPlan.errorCorrection.friendlyExplanation,
        noPunishmentReinforcement: tutorPlan.errorCorrection.noPunishmentReinforcement,
        suggestedReview: tutorPlan.errorCorrection.suggestedReview
      })),
      writeFile(path.join(dir, "motivation-system.md"), md("Motivation System", {
        motivation: tutorPlan.motivation.motivation,
        encouragement: tutorPlan.motivation.encouragement,
        streakReinforcement: tutorPlan.motivation.streakReinforcement,
        progressCelebration: tutorPlan.motivation.progressCelebration
      })),
      writeFile(path.join(dir, "progress-coaching.md"), md("Progress Coaching", {
        progressSummary: tutorPlan.progressCoaching.progressSummary,
        currentMastery: tutorPlan.progressCoaching.currentMastery,
        weakAreas: tutorPlan.progressCoaching.weakAreas,
        suggestedGoals: tutorPlan.progressCoaching.suggestedGoals,
        memorySystems: tutorPlan.studentMemory
      })),
      writeFile(path.join(dir, "tutor-plan.json"), JSON.stringify(tutorPlan, null, 2))
    ];
    if (tutorPlan.pronunciationCoaching.enabled) {
      files.push(writeFile(path.join(dir, "pronunciation-coaching.md"), md("Pronunciation Coaching", {
        speakingPrompts: tutorPlan.pronunciationCoaching.speakingPrompts,
        phoneticGuidance: tutorPlan.pronunciationCoaching.phoneticGuidance,
        pronunciationCheckpoints: tutorPlan.pronunciationCoaching.pronunciationCheckpoints,
        repetitionLoops: tutorPlan.pronunciationCoaching.repetitionLoops,
        placeholderOnly: "true"
      })));
      files.push(writeFile(path.join(dir, "speaking-roleplay.md"), md("Speaking Roleplay", {
        scenarios: tutorPlan.conversationSimulation.scenarios,
        roleplay: tutorPlan.conversationSimulation.roleplay,
        dialogs: tutorPlan.conversationSimulation.dialogs
      })));
      files.push(writeFile(path.join(dir, "listening-guidance.md"), md("Listening Guidance", {
        listeningPrompts: ["listen for meaning", "identify key phrase", "repeat after delay"],
        vocabularyRecall: ["hear phrase", "choose meaning", "use in sentence"],
        voiceProcessingExecuted: "false"
      })));
    }
    return files;
  }

  validate({ project, tutorPlan, filesCreated }) {
    const required = [
      "tutor-personality.md",
      "conversation-flows.md",
      "adaptive-guidance.md",
      "correction-system.md",
      "motivation-system.md",
      "progress-coaching.md"
    ];
    if (tutorPlan.pronunciationCoaching.enabled) {
      required.push("pronunciation-coaching.md", "speaking-roleplay.md", "listening-guidance.md");
    }
    const checks = [
      ...required.map((file) => ({
        id: `file:${file}`,
        ok: fs.existsSync(path.join(project.projectRoot, "ai-tutor", file)),
        reason: "required ai tutor artifact"
      })),
      { id: "conversational-learning", ok: tutorPlan.conversationalLearning.questions.length >= 4 },
      { id: "adaptive-tutor", ok: tutorPlan.adaptiveTutor.difficulty.length >= 3 },
      { id: "guidance", ok: tutorPlan.studentGuidance.tips.length >= 4 },
      { id: "correction", ok: tutorPlan.errorCorrection.contextualCorrection.length >= 4 },
      { id: "motivation", ok: tutorPlan.motivation.progressCelebration.length >= 3 },
      { id: "memory", ok: tutorPlan.studentMemory.jsonFallback === true },
      { id: "progress-coaching", ok: tutorPlan.progressCoaching.suggestedGoals.length >= 3 },
      { id: "readonly-safe", ok: tutorPlan.readonly && tutorPlan.externalAiUsed === false && tutorPlan.voiceProcessingExecuted === false },
      { id: "files-created", ok: filesCreated.length >= required.length }
    ].map((check) => ({ ...check, readonly: true }));
    const failures = checks.filter((check) => !check.ok);
    return {
      valid: failures.length === 0,
      checks,
      failures,
      readonly: true,
      safetyMode: "readonly-safe-ai-tutor-validation"
    };
  }

  persist(report) {
    const filename = `ai-tutor-${timestampForFile()}-${report.aiTutorReportId}.json`;
    const runtimePath = path.join(this.runtimeDir, filename);
    const memoryPath = path.join(this.memoryDir, filename);
    fs.writeFileSync(runtimePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(memoryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    return { runtimePath, memoryPath, safetyMode: "readonly-safe-ai-tutor-persistence" };
  }
}

module.exports = { AiTutorRuntime };
