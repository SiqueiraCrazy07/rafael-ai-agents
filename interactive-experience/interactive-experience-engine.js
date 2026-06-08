const fs = require("node:fs");
const path = require("node:path");
const { ProjectBootstrapper, ensureDir, writeFile } = require("../product-codegen/project-bootstrapper");
const { AdaptiveInteractionEngine } = require("./adaptive-interaction-engine");
const { GameplayLoopEngine } = require("./gameplay-loop-engine");
const { HudGenerator } = require("./hud-generator");
const { InteractionFlowGenerator } = require("./interaction-flow-generator");
const { MinigameGenerator } = require("./minigame-generator");
const { MissionSystemGenerator } = require("./mission-system-generator");
const { QuizInteractionGenerator } = require("./quiz-interaction-generator");
const { RewardSystemGenerator } = require("./reward-system-generator");
const { SpeakingListeningFlowGenerator } = require("./speaking-listening-flow-generator");
const { VisualFeedbackEngine } = require("./visual-feedback-engine");

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

function lines(title, values) {
  const body = Array.isArray(values)
    ? values.map((value) => `- ${typeof value === "string" ? value : JSON.stringify(value)}`).join("\n")
    : `- ${JSON.stringify(values)}`;
  return `# ${title}\n\n${body}`;
}

class InteractiveExperienceEngine {
  constructor({ rootDir = process.cwd() } = {}) {
    this.rootDir = rootDir;
    this.runtimeDir = path.join(rootDir, "runtime-data", "interactive-experience");
    this.memoryDir = path.join(rootDir, "memory", "interactive-experience");
    this.projectBootstrapper = new ProjectBootstrapper({ rootDir });
    this.gameplayLoopEngine = new GameplayLoopEngine();
    this.minigameGenerator = new MinigameGenerator();
    this.missionSystemGenerator = new MissionSystemGenerator();
    this.rewardSystemGenerator = new RewardSystemGenerator();
    this.hudGenerator = new HudGenerator();
    this.visualFeedbackEngine = new VisualFeedbackEngine();
    this.interactionFlowGenerator = new InteractionFlowGenerator();
    this.quizInteractionGenerator = new QuizInteractionGenerator();
    this.speakingListeningFlowGenerator = new SpeakingListeningFlowGenerator();
    this.adaptiveInteractionEngine = new AdaptiveInteractionEngine();
  }

  run({ limit = 4 } = {}) {
    ensureDir(this.runtimeDir);
    ensureDir(this.memoryDir);
    const projects = this.projectBootstrapper.discoverProjects().slice(0, limit);
    const processedProjects = projects.map((project) => this.generateForProject(project));
    const allValid = processedProjects.every((item) => item.validation.valid);
    const report = {
      interactiveExperienceReportId: `interactive_experience_report_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      status: allValid ? "autonomous_interactive_experience_ready" : "autonomous_interactive_experience_attention_required",
      readonly: true,
      deployExecuted: false,
      dependenciesInstalled: false,
      externalAiUsed: false,
      mediaGenerated: false,
      projectsProcessed: processedProjects.map((item) => ({
        projectSlug: item.project.projectSlug,
        productType: item.productType,
        filesCreated: item.filesCreated.length,
        speakingListening: item.speakingListening.enabled,
        educationalGameExtras: item.educationalGameExtras
      })),
      processedProjects,
      integrations: {
        productBuilder: "reads generated project metadata and writes interactive plans under each generated project",
        productCodegen: "plans interaction surfaces that can be implemented by generated frontend/backend stubs",
        learningIntelligence: "uses mastery, retention and adaptive-learning concepts as interaction rules",
        uxIntelligence: "uses cognitive flows, feedback and wireframe concepts as interaction plans",
        runtime: "persists reports in runtime-data",
        telemetry: "memory reports are telemetry-readable",
        dashboard: "report summary is dashboard-readable"
      },
      fallback: {
        safeMode: true,
        jsonFallback: true,
        behavior: "plan-only interactive structures; no deploy, dependency install, external AI or final media generation"
      },
      risks: [
        "interactive plans are not production gameplay code",
        "speaking and listening flows are placeholders without speech engine integration",
        "visual animations are planned, not generated media",
        "adaptive rules need real learner telemetry before production use"
      ],
      readiness: allValid
        ? "autonomous-interactive-experience-engine-v1-ready"
        : "autonomous-interactive-experience-engine-v1-attention-required",
      persistence: null
    };
    report.persistence = this.persist(report);
    return report;
  }

  generateForProject(project) {
    const productType = this.identifyProductType(project);
    const gameplayLoop = this.gameplayLoopEngine.generate(project);
    const minigames = this.minigameGenerator.generate(project);
    const missions = this.missionSystemGenerator.generate(project);
    const rewards = this.rewardSystemGenerator.generate(project);
    const hud = this.hudGenerator.generate(project);
    const visualFeedback = this.visualFeedbackEngine.generate(project);
    const interactionFlows = this.interactionFlowGenerator.generate(project);
    const quizInteractions = this.quizInteractionGenerator.generate(project);
    const speakingListening = this.speakingListeningFlowGenerator.generate(project);
    const adaptiveInteractions = this.adaptiveInteractionEngine.generate(project);
    const experiencePlan = {
      experiencePlanId: `experience_plan_${project.projectSlug}_${Date.now()}`,
      project: {
        projectSlug: project.projectSlug,
        productName: project.productName,
        category: project.category,
        productType
      },
      gameplayLoop,
      minigames,
      missions,
      rewards,
      hud,
      visualFeedback,
      interactionFlows,
      quizInteractions,
      speakingListening,
      adaptiveInteractions,
      readonly: true,
      externalAiUsed: false,
      mediaGenerated: false,
      safetyMode: "readonly-safe-interactive-experience-plan"
    };
    const filesCreated = this.writeProjectFiles({ project, experiencePlan });
    const validation = this.validate({ project, experiencePlan, filesCreated });
    return {
      interactiveExperienceId: `interactive_experience_${project.projectSlug}_${Date.now()}`,
      project,
      productType,
      gameplayLoop,
      minigames,
      missions,
      rewards,
      hud,
      visualFeedback,
      interactionFlows,
      quizInteractions,
      speakingListening,
      adaptiveInteractions,
      filesCreated,
      educationalGameExtras: project.category === "game",
      validation,
      readonly: true,
      deployExecuted: false,
      dependenciesInstalled: false,
      externalAiUsed: false,
      mediaGenerated: false,
      safetyMode: "readonly-safe-autonomous-interactive-experience"
    };
  }

  identifyProductType(project) {
    if (project.category === "game") return "educational-game";
    if (project.projectSlug.includes("english") || project.productName.toLowerCase().includes("english")) return "english-learning";
    if (project.curriculumGenerated || project.category === "education") return "educational-platform";
    if (project.category === "crm") return "business-crm";
    return "interactive-business-platform";
  }

  writeProjectFiles({ project, experiencePlan }) {
    const dir = path.join(project.projectRoot, "interactive");
    ensureDir(dir);
    const files = [
      writeFile(path.join(dir, "experience-plan.json"), JSON.stringify(experiencePlan, null, 2)),
      writeFile(path.join(dir, "gameplay-loop.md"), lines("Gameplay Loop", experiencePlan.gameplayLoop)),
      writeFile(path.join(dir, "missions.md"), lines("Missions", experiencePlan.missions)),
      writeFile(path.join(dir, "rewards.md"), lines("Rewards", experiencePlan.rewards)),
      writeFile(path.join(dir, "hud-spec.md"), lines("HUD Spec", experiencePlan.hud)),
      writeFile(path.join(dir, "feedback-system.md"), lines("Feedback System", experiencePlan.visualFeedback)),
      writeFile(path.join(dir, "interaction-flows.md"), lines("Interaction Flows", experiencePlan.interactionFlows)),
      writeFile(path.join(dir, "minigames.md"), lines("Minigames", experiencePlan.minigames.recommended)),
      writeFile(path.join(dir, "adaptive-interactions.md"), lines("Adaptive Interactions", experiencePlan.adaptiveInteractions)),
      writeFile(path.join(dir, "quiz-interactions.md"), lines("Quiz Interactions", experiencePlan.quizInteractions))
    ];
    if (experiencePlan.speakingListening.enabled) {
      files.push(writeFile(path.join(dir, "speaking-listening-flow.md"), lines("Speaking Listening Flow", experiencePlan.speakingListening)));
      files.push(writeFile(path.join(dir, "vocabulary-practice.md"), lines("Vocabulary Practice", experiencePlan.speakingListening.vocabularyRecall)));
      files.push(writeFile(path.join(dir, "conversation-practice.md"), lines("Conversation Practice", experiencePlan.speakingListening.conversationPractice)));
    }
    if (project.category === "game") {
      files.push(writeFile(path.join(dir, "game-levels.md"), lines("Game Levels", experiencePlan.missions.levelMissions)));
      files.push(writeFile(path.join(dir, "game-rules.md"), lines("Game Rules", [
        "complete missions through mastery evidence",
        "retry is encouraged and never punitive",
        "reward progress without hiding learning goals",
        "difficulty adapts from performance signals"
      ])));
      files.push(writeFile(path.join(dir, "challenge-system.md"), lines("Challenge System", experiencePlan.minigames.recommended)));
    }
    return files;
  }

  validate({ project, experiencePlan, filesCreated }) {
    const required = [
      "experience-plan.json",
      "gameplay-loop.md",
      "missions.md",
      "rewards.md",
      "hud-spec.md",
      "feedback-system.md",
      "interaction-flows.md",
      "minigames.md",
      "adaptive-interactions.md"
    ];
    if (experiencePlan.speakingListening.enabled) {
      required.push("speaking-listening-flow.md", "vocabulary-practice.md", "conversation-practice.md");
    }
    if (project.category === "game") {
      required.push("game-levels.md", "game-rules.md", "challenge-system.md");
    }
    const checks = [
      ...required.map((file) => ({
        id: `file:${file}`,
        ok: fs.existsSync(path.join(project.projectRoot, "interactive", file)),
        reason: "required interactive artifact"
      })),
      { id: "gameplay-loop", ok: experiencePlan.gameplayLoop.learningLoop.length >= 5 },
      { id: "minigames", ok: experiencePlan.minigames.recommended.length >= 6 },
      { id: "missions", ok: experiencePlan.missions.dailyMissions.length >= 3 },
      { id: "rewards", ok: experiencePlan.rewards.badges.length >= 4 },
      { id: "hud", ok: experiencePlan.hud.elements.length >= 6 },
      { id: "visual-feedback", ok: experiencePlan.visualFeedback.errorWithoutFrustration.length >= 3 },
      { id: "adaptive-interactions", ok: experiencePlan.adaptiveInteractions.difficultyAdjustment.length >= 3 },
      { id: "readonly-safe", ok: experiencePlan.readonly && experiencePlan.externalAiUsed === false && experiencePlan.mediaGenerated === false },
      { id: "files-created", ok: filesCreated.length >= required.length }
    ].map((check) => ({ ...check, readonly: true }));
    const failures = checks.filter((check) => !check.ok);
    return {
      valid: failures.length === 0,
      checks,
      failures,
      readonly: true,
      safetyMode: "readonly-safe-interactive-experience-validation"
    };
  }

  persist(report) {
    const filename = `interactive-experience-${timestampForFile()}-${report.interactiveExperienceReportId}.json`;
    const runtimePath = path.join(this.runtimeDir, filename);
    const memoryPath = path.join(this.memoryDir, filename);
    fs.writeFileSync(runtimePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(memoryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    return { runtimePath, memoryPath, safetyMode: "readonly-safe-interactive-experience-persistence" };
  }
}

module.exports = { InteractiveExperienceEngine };
