const fs = require("node:fs");
const path = require("node:path");

const { ProjectBootstrapper, ensureDir, writeFile } = require("../../product-codegen/project-bootstrapper");
const { DesignSystemEngine } = require("../design-system-engine");
const { ThemeGenerator } = require("../theme-generator");
const { ComponentLibraryGenerator } = require("../component-library-generator");
const { UiLayoutEngine } = require("../ui-layout-engine");
const { GamifiedUiEngine } = require("../gamified-ui-engine");
const { AnimationPlanningEngine } = require("../animation-planning-engine");
const { ResponsiveUiEngine } = require("../responsive-ui-engine");
const { AccessibilityVisualEngine } = require("../accessibility-visual-engine");
const { ColorPsychologyEngine } = require("../color-psychology-engine");
const { VisualFeedbackUiEngine } = require("../visual-feedback-ui-engine");
const { DesignTokenGenerator } = require("../design-token-generator");
const { VisualWireframeGenerator } = require("../visual-wireframe-generator");

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function asMarkdownValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => `- ${typeof item === "object" ? JSON.stringify(item) : item}`).join("\n");
  }

  if (value && typeof value === "object") {
    return `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``;
  }

  return String(value);
}

function md(title, sections) {
  const lines = [`# ${title}`, ""];
  Object.entries(sections).forEach(([sectionTitle, value]) => {
    lines.push(`## ${sectionTitle}`, "", asMarkdownValue(value), "");
  });
  return `${lines.join("\n").trim()}\n`;
}

class VisualUiRuntime {
  constructor({ rootDir = process.cwd() } = {}) {
    this.rootDir = rootDir;
    this.runtimeDir = path.join(rootDir, "runtime-data", "visual-ui");
    this.memoryDir = path.join(rootDir, "memory", "visual-ui");
    this.projectBootstrapper = new ProjectBootstrapper({ rootDir });
    this.designSystemEngine = new DesignSystemEngine();
    this.themeGenerator = new ThemeGenerator();
    this.componentLibraryGenerator = new ComponentLibraryGenerator();
    this.uiLayoutEngine = new UiLayoutEngine();
    this.gamifiedUiEngine = new GamifiedUiEngine();
    this.animationPlanningEngine = new AnimationPlanningEngine();
    this.responsiveUiEngine = new ResponsiveUiEngine();
    this.accessibilityVisualEngine = new AccessibilityVisualEngine();
    this.colorPsychologyEngine = new ColorPsychologyEngine();
    this.visualFeedbackUiEngine = new VisualFeedbackUiEngine();
    this.designTokenGenerator = new DesignTokenGenerator();
    this.visualWireframeGenerator = new VisualWireframeGenerator();
  }

  run({ limit = 4 } = {}) {
    ensureDir(this.runtimeDir);
    ensureDir(this.memoryDir);

    const discoveredProjects = this.projectBootstrapper.discoverProjects();
    const projects = discoveredProjects.slice(0, limit);
    const processedProjects = projects.map((project) => this.generateForProject(project));

    const validations = processedProjects.flatMap((project) => project.validation.checks);
    const hasFailures = validations.some((check) => check.status !== "passed");
    const report = {
      visualUiReportId: `visual-ui-${Date.now()}`,
      status: hasFailures ? "attention_required" : "autonomous_visual_ui_design_system_ready",
      readonly: true,
      deployExecuted: false,
      graphicalGeneration: false,
      animationPlanOnly: true,
      projectsProcessed: processedProjects.length,
      designSystems: processedProjects.map((project) => ({
        project: project.project.productName,
        id: project.designSystem.designSystemId,
        typography: project.designSystem.typography.scale,
        spacing: project.designSystem.spacing.baseUnit,
      })),
      themes: processedProjects.map((project) => ({
        project: project.project.productName,
        selected: project.theme.selectedTheme,
        available: Object.keys(project.theme.themes),
      })),
      componentLibraries: processedProjects.map((project) => ({
        project: project.project.productName,
        components: project.componentLibrary.components.map((component) => component.name),
      })),
      responsiveLayouts: processedProjects.map((project) => ({
        project: project.project.productName,
        layouts: project.layout.layouts,
        breakpoints: project.responsiveUi.breakpoints,
      })),
      gamifiedUi: processedProjects.map((project) => ({
        project: project.project.productName,
        xpBars: project.gamifiedUi.xpBars.length,
        badges: project.gamifiedUi.badges.length,
        achievements: project.gamifiedUi.achievements.length,
      })),
      animationPlans: processedProjects.map((project) => ({
        project: project.project.productName,
        planOnly: project.animationPlan.planOnly,
        microinteractions: project.animationPlan.microinteractions.length,
        mediaGenerated: project.animationPlan.mediaGenerated,
      })),
      accessibility: processedProjects.map((project) => ({
        project: project.project.productName,
        contrast: project.accessibility.contrast,
        focus: project.accessibility.focus,
        cognitive: project.accessibility.cognitiveAccessibility,
      })),
      designTokens: processedProjects.map((project) => ({
        project: project.project.productName,
        colors: Object.keys(project.designTokens.colors),
        fontFamilies: Object.keys(project.designTokens.fonts),
        spacingSteps: Object.keys(project.designTokens.spacing).length,
      })),
      visualWireframes: processedProjects.map((project) => ({
        project: project.project.productName,
        screens: project.visualWireframes.screens.length,
      })),
      colorPsychology: processedProjects.map((project) => ({
        project: project.project.productName,
        retention: project.colorPsychology.retention,
        motivation: project.colorPsychology.motivation,
        reward: project.colorPsychology.reward,
      })),
      visualFeedback: processedProjects.map((project) => ({
        project: project.project.productName,
        successStates: project.visualFeedbackUi.successStates.length,
        errorStates: project.visualFeedbackUi.errorStates.length,
        encouragementStates: project.visualFeedbackUi.encouragementStates.length,
      })),
      filesCreated: processedProjects.flatMap((project) => project.filesCreated),
      validations,
      integrations: [
        "ai-tutor",
        "interactive-experience",
        "learning-intelligence",
        "product-codegen",
        "runtime",
        "telemetry",
        "dashboard",
      ],
      risks: [
        "V1 generates textual visual specifications and design tokens only.",
        "Animation output is plan-only; no media or runtime animation bundles are generated.",
        "Generated visual systems still require product-owner review before production branding.",
      ],
      readiness: hasFailures
        ? "Visual UI V1 requires review because one or more project artifacts failed validation."
        : "Visual UI V1 is ready for readonly-safe prototype enrichment.",
      processedProjects,
    };

    report.persistence = this.persist(report);
    return report;
  }

  generateForProject(project) {
    const designSystem = this.designSystemEngine.generate(project);
    const theme = this.themeGenerator.generate(project);
    const componentLibrary = this.componentLibraryGenerator.generate(project);
    const layout = this.uiLayoutEngine.generate(project);
    const gamifiedUi = this.gamifiedUiEngine.generate(project);
    const animationPlan = this.animationPlanningEngine.generate(project);
    const responsiveUi = this.responsiveUiEngine.generate(project);
    const accessibility = this.accessibilityVisualEngine.generate(project);
    const colorPsychology = this.colorPsychologyEngine.generate(project);
    const visualFeedbackUi = this.visualFeedbackUiEngine.generate(project);
    const designTokens = this.designTokenGenerator.generate({ project, theme });
    const visualWireframes = this.visualWireframeGenerator.generate({ project, layout, gamifiedUi });
    const filesCreated = this.writeProjectFiles({
      project,
      designSystem,
      theme,
      componentLibrary,
      layout,
      gamifiedUi,
      animationPlan,
      responsiveUi,
      accessibility,
      colorPsychology,
      visualFeedbackUi,
      designTokens,
      visualWireframes,
    });
    const validation = this.validateProjectFiles(project, {
      designSystem,
      theme,
      componentLibrary,
      layout,
      gamifiedUi,
      animationPlan,
      responsiveUi,
      accessibility,
      designTokens,
      visualWireframes,
      filesCreated,
    });

    return {
      visualUiId: `${project.slug}-visual-ui-v1`,
      project,
      designSystem,
      theme,
      componentLibrary,
      layout,
      gamifiedUi,
      animationPlan,
      responsiveUi,
      accessibility,
      colorPsychology,
      visualFeedbackUi,
      designTokens,
      visualWireframes,
      filesCreated,
      validation,
      readonly: true,
      deployExecuted: false,
      graphicalGeneration: false,
      animationPlanOnly: true,
    };
  }

  writeProjectFiles(payload) {
    const visualDir = path.join(payload.project.projectRoot, "visual-ui");
    ensureDir(visualDir);

    const files = {
      "design-system.md": md(`${payload.project.name} Design System`, {
        Typography: payload.designSystem.typography,
        Spacing: payload.designSystem.spacing,
        Shadows: payload.designSystem.shadows,
        Borders: payload.designSystem.borders,
        Radius: payload.designSystem.radius,
        Elevations: payload.designSystem.elevations,
        "Icon Guidelines": payload.designSystem.iconGuidelines,
        Safety: {
          readonly: payload.designSystem.readonly,
          safetyMode: payload.designSystem.safetyMode,
        },
      }),
      "themes.md": md(`${payload.project.name} Themes`, {
        Selected: payload.theme.selectedTheme,
        Themes: payload.theme.themes,
        "Selection Rationale": payload.theme.selectionRationale,
      }),
      "component-library.md": md(`${payload.project.name} Component Library`, {
        Components: payload.componentLibrary.components,
        "Component Principles": payload.componentLibrary.principles,
      }),
      "responsive-layouts.md": md(`${payload.project.name} Responsive Layouts`, {
        Layouts: payload.layout.layouts,
        Grids: payload.layout.grids,
        Responsiveness: payload.layout.responsiveness,
        "Responsive UI": payload.responsiveUi,
        "Visual Flow": payload.layout.visualFlow,
        "Cognitive Organization": payload.layout.cognitiveOrganization,
      }),
      "gamification-ui.md": md(`${payload.project.name} Gamification UI`, {
        "XP Bars": payload.gamifiedUi.xpBars,
        Streaks: payload.gamifiedUi.streaks,
        Badges: payload.gamifiedUi.badges,
        Achievements: payload.gamifiedUi.achievements,
        "Level Progression Visuals": payload.gamifiedUi.levelProgressionVisuals,
      }),
      "animation-plan.md": md(`${payload.project.name} Animation Plan`, {
        "Plan Only": payload.animationPlan.planOnly,
        "Media Generated": payload.animationPlan.mediaGenerated,
        Microinteractions: payload.animationPlan.microinteractions,
        "Feedback Animations": payload.animationPlan.feedbackAnimations,
        "Reward Animations": payload.animationPlan.rewardAnimations,
        "Onboarding Animations": payload.animationPlan.onboardingAnimations,
      }),
      "accessibility-visual.md": md(`${payload.project.name} Visual Accessibility`, {
        Contrast: payload.accessibility.contrast,
        Reading: payload.accessibility.reading,
        Focus: payload.accessibility.focus,
        "Child Accessibility": payload.accessibility.childAccessibility,
        "Cognitive Accessibility": payload.accessibility.cognitiveAccessibility,
        "Color Psychology": payload.colorPsychology,
        "Visual Feedback": payload.visualFeedbackUi,
      }),
      "design-tokens.json": `${JSON.stringify(payload.designTokens, null, 2)}\n`,
      "visual-wireframes.md": md(`${payload.project.name} Visual Wireframes`, {
        Screens: payload.visualWireframes.screens,
        "Navigation Model": payload.visualWireframes.navigationModel,
        "Accessibility Layer": payload.visualWireframes.accessibilityLayer,
      }),
    };

    return Object.entries(files).map(([fileName, contents]) => {
      const filePath = path.join(visualDir, fileName);
      writeFile(filePath, contents);
      return path.relative(this.rootDir, filePath).replace(/\\/g, "/");
    });
  }

  validateProjectFiles(project, payload) {
    const requiredFiles = [
      "design-system.md",
      "themes.md",
      "component-library.md",
      "responsive-layouts.md",
      "gamification-ui.md",
      "animation-plan.md",
      "accessibility-visual.md",
      "design-tokens.json",
      "visual-wireframes.md",
    ];
    const visualDir = path.join(project.projectRoot, "visual-ui");
    const checks = [
      {
        check: "required visual-ui files",
        status: requiredFiles.every((fileName) => fs.existsSync(path.join(visualDir, fileName))) ? "passed" : "failed",
      },
      {
        check: "design system coverage",
        status: payload.designSystem.typography && payload.designSystem.spacing && payload.designSystem.iconGuidelines ? "passed" : "failed",
      },
      {
        check: "theme registry coverage",
        status: Object.keys(payload.theme.themes || {}).length >= 5 ? "passed" : "failed",
      },
      {
        check: "component library coverage",
        status: payload.componentLibrary.components.length >= 9 ? "passed" : "failed",
      },
      {
        check: "responsive breakpoints",
        status: payload.responsiveUi.desktop && payload.responsiveUi.tablet && payload.responsiveUi.mobile ? "passed" : "failed",
      },
      {
        check: "gamified ui coverage",
        status: payload.gamifiedUi.xpBars.length > 0 && payload.gamifiedUi.achievements.length > 0 ? "passed" : "failed",
      },
      {
        check: "animation plan-only safety",
        status: payload.animationPlan.planOnly === true && payload.animationPlan.mediaGenerated === false ? "passed" : "failed",
      },
      {
        check: "accessibility coverage",
        status: payload.accessibility.contrast && payload.accessibility.focus && payload.accessibility.cognitiveAccessibility ? "passed" : "failed",
      },
      {
        check: "design token coverage",
        status: payload.designTokens.colors && payload.designTokens.fonts && payload.designTokens.spacing ? "passed" : "failed",
      },
      {
        check: "visual wireframe coverage",
        status: payload.visualWireframes.screens.length > 0 ? "passed" : "failed",
      },
    ];

    return {
      project: project.productName,
      status: checks.every((check) => check.status === "passed") ? "passed" : "failed",
      checks,
    };
  }

  persist(report) {
    const fileName = `${timestampForFile()}-${report.visualUiReportId}.json`;
    const runtimePath = path.join(this.runtimeDir, fileName);
    const memoryPath = path.join(this.memoryDir, fileName);
    writeFile(runtimePath, `${JSON.stringify(report, null, 2)}\n`);
    writeFile(memoryPath, `${JSON.stringify({
      visualUiReportId: report.visualUiReportId,
      status: report.status,
      projectsProcessed: report.projectsProcessed,
      readiness: report.readiness,
      risks: report.risks,
    }, null, 2)}\n`);
    return {
      runtime: path.relative(this.rootDir, runtimePath).replace(/\\/g, "/"),
      memory: path.relative(this.rootDir, memoryPath).replace(/\\/g, "/"),
    };
  }
}

function runVisualUiDemo({ rootDir = process.cwd() } = {}) {
  const runtime = new VisualUiRuntime({ rootDir });
  const report = runtime.run({ limit: 4 });
  console.log(JSON.stringify({
    status: report.status,
    visualUiReportId: report.visualUiReportId,
    projectsProcessed: report.projectsProcessed,
    designSystems: report.designSystems,
    themes: report.themes,
    componentLibraries: report.componentLibraries,
    responsiveLayouts: report.responsiveLayouts,
    gamifiedUi: report.gamifiedUi,
    animationPlans: report.animationPlans,
    accessibility: report.accessibility,
    designTokens: report.designTokens,
    visualWireframes: report.visualWireframes,
    filesCreated: report.filesCreated,
    validations: report.validations,
    risks: report.risks,
    readiness: report.readiness,
    persistence: report.persistence,
  }, null, 2));
  return report;
}

if (require.main === module) {
  runVisualUiDemo();
}

module.exports = {
  VisualUiRuntime,
  runVisualUiDemo,
};
