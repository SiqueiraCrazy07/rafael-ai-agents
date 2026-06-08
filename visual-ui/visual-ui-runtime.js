const fs = require("node:fs");
const path = require("node:path");
const { ProjectBootstrapper, ensureDir, writeFile } = require("../product-codegen/project-bootstrapper");
const { AccessibilityVisualEngine } = require("./accessibility-visual-engine");
const { AnimationPlanningEngine } = require("./animation-planning-engine");
const { ColorPsychologyEngine } = require("./color-psychology-engine");
const { ComponentLibraryGenerator } = require("./component-library-generator");
const { DesignSystemEngine } = require("./design-system-engine");
const { DesignTokenGenerator } = require("./design-token-generator");
const { GamifiedUiEngine } = require("./gamified-ui-engine");
const { ResponsiveUiEngine } = require("./responsive-ui-engine");
const { ThemeGenerator } = require("./theme-generator");
const { UiLayoutEngine } = require("./ui-layout-engine");
const { VisualFeedbackUiEngine } = require("./visual-feedback-ui-engine");
const { VisualWireframeGenerator } = require("./visual-wireframe-generator");

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

function md(title, sections) {
  const body = Object.entries(sections)
    .map(([key, value]) => {
      const content = Array.isArray(value)
        ? value.map((item) => `- ${typeof item === "string" ? item : JSON.stringify(item)}`).join("\n")
        : typeof value === "object"
          ? `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``
          : String(value);
      return `## ${key}\n\n${content}`;
    })
    .join("\n\n");
  return `# ${title}\n\n${body}`;
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
    const projects = this.projectBootstrapper.discoverProjects().slice(0, limit);
    const processedProjects = projects.map((project) => this.generateForProject(project));
    const allValid = processedProjects.every((item) => item.validation.valid);
    const report = {
      visualUiReportId: `visual_ui_report_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      status: allValid ? "autonomous_visual_ui_design_system_ready" : "autonomous_visual_ui_design_system_attention_required",
      readonly: true,
      deployExecuted: false,
      graphicGenerationExecuted: false,
      animationPlanOnly: true,
      projectsProcessed: processedProjects.map((item) => ({
        projectSlug: item.project.projectSlug,
        theme: item.theme.selectedTheme,
        filesCreated: item.filesCreated.length,
        valid: item.validation.valid
      })),
      processedProjects,
      integrations: {
        aiTutor: "visual surfaces support tutor feedback, guidance and progress coaching",
        interactiveExperience: "visual UI maps HUD, missions, rewards and feedback plans",
        learningIntelligence: "design decisions support retention, motivation and accessibility",
        productCodegen: "design tokens and component specs can guide generated frontend code",
        runtime: "persists report in runtime-data",
        telemetry: "memory report is telemetry-readable",
        dashboard: "summary is dashboard-readable"
      },
      fallback: {
        safeMode: true,
        jsonFallback: true,
        behavior: "visual planning only; no deploy, no graphic generation, no real animation output"
      },
      risks: [
        "visual artifacts are specifications, not rendered final UI",
        "animation plans require implementation and motion accessibility review",
        "color guidance must be reviewed against brand constraints",
        "generated frontend code is not automatically restyled in V1"
      ],
      readiness: allValid
        ? "autonomous-visual-ui-design-system-engine-v1-ready"
        : "autonomous-visual-ui-design-system-engine-v1-attention-required",
      persistence: null
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
    const visualFeedback = this.visualFeedbackUiEngine.generate(project);
    const designTokens = this.designTokenGenerator.generate({ project, theme });
    const visualWireframes = this.visualWireframeGenerator.generate({ project, layout, gamifiedUi });
    const visualPlan = {
      visualPlanId: `visual_ui_${project.projectSlug}_${Date.now()}`,
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
      visualFeedback,
      designTokens,
      visualWireframes,
      readonly: true,
      deployExecuted: false,
      graphicGenerationExecuted: false,
      animationPlanOnly: true,
      safetyMode: "readonly-safe-visual-ui-plan"
    };
    const filesCreated = this.writeProjectFiles({ project, visualPlan });
    const validation = this.validate({ project, visualPlan, filesCreated });
    return {
      visualUiId: `visual_ui_${project.projectSlug}_${Date.now()}`,
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
      visualFeedback,
      designTokens,
      visualWireframes,
      filesCreated,
      validation,
      readonly: true,
      deployExecuted: false,
      graphicGenerationExecuted: false,
      animationPlanOnly: true,
      safetyMode: "readonly-safe-autonomous-visual-ui"
    };
  }

  writeProjectFiles({ project, visualPlan }) {
    const dir = path.join(project.projectRoot, "visual-ui");
    ensureDir(dir);
    return [
      writeFile(path.join(dir, "design-system.md"), md("Design System", visualPlan.designSystem)),
      writeFile(path.join(dir, "themes.md"), md("Themes", visualPlan.theme)),
      writeFile(path.join(dir, "component-library.md"), md("Component Library", { components: visualPlan.componentLibrary.components })),
      writeFile(path.join(dir, "responsive-layouts.md"), md("Responsive Layouts", {
        layouts: visualPlan.layout.layouts,
        grids: visualPlan.layout.grids,
        responsive: visualPlan.responsiveUi
      })),
      writeFile(path.join(dir, "gamification-ui.md"), md("Gamification UI", visualPlan.gamifiedUi)),
      writeFile(path.join(dir, "animation-plan.md"), md("Animation Plan", visualPlan.animationPlan)),
      writeFile(path.join(dir, "accessibility-visual.md"), md("Accessibility Visual", {
        accessibility: visualPlan.accessibility,
        colorPsychology: visualPlan.colorPsychology,
        visualFeedback: visualPlan.visualFeedback
      })),
      writeFile(path.join(dir, "design-tokens.json"), JSON.stringify(visualPlan.designTokens, null, 2)),
      writeFile(path.join(dir, "visual-wireframes.md"), md("Visual Wireframes", { screens: visualPlan.visualWireframes.screens }))
    ];
  }

  validate({ project, visualPlan, filesCreated }) {
    const required = [
      "design-system.md",
      "themes.md",
      "component-library.md",
      "responsive-layouts.md",
      "gamification-ui.md",
      "animation-plan.md",
      "accessibility-visual.md",
      "design-tokens.json",
      "visual-wireframes.md"
    ];
    const checks = [
      ...required.map((file) => ({
        id: `file:${file}`,
        ok: fs.existsSync(path.join(project.projectRoot, "visual-ui", file)),
        reason: "required visual ui artifact"
      })),
      { id: "design-system", ok: Boolean(visualPlan.designSystem.typography && visualPlan.designSystem.spacing) },
      { id: "themes", ok: Object.keys(visualPlan.theme.themes).length >= 5 },
      { id: "component-library", ok: visualPlan.componentLibrary.components.length >= 8 },
      { id: "responsive-ui", ok: Boolean(visualPlan.responsiveUi.desktop && visualPlan.responsiveUi.mobile) },
      { id: "gamified-ui", ok: visualPlan.gamifiedUi.badges.length >= 4 },
      { id: "animation-plan-only", ok: visualPlan.animationPlan.planOnly === true && visualPlan.animationPlan.mediaGenerated === false },
      { id: "accessibility", ok: visualPlan.accessibility.contrast.length >= 3 },
      { id: "design-tokens", ok: Boolean(visualPlan.designTokens.colors.primary && visualPlan.designTokens.spacing.md) },
      { id: "wireframes", ok: visualPlan.visualWireframes.screens.length > 0 },
      { id: "readonly-safe", ok: visualPlan.readonly && visualPlan.deployExecuted === false && visualPlan.graphicGenerationExecuted === false },
      { id: "files-created", ok: filesCreated.length >= required.length }
    ].map((check) => ({ ...check, readonly: true }));
    const failures = checks.filter((check) => !check.ok);
    return {
      valid: failures.length === 0,
      checks,
      failures,
      readonly: true,
      safetyMode: "readonly-safe-visual-ui-validation"
    };
  }

  persist(report) {
    const filename = `visual-ui-${timestampForFile()}-${report.visualUiReportId}.json`;
    const runtimePath = path.join(this.runtimeDir, filename);
    const memoryPath = path.join(this.memoryDir, filename);
    fs.writeFileSync(runtimePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(memoryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    return { runtimePath, memoryPath, safetyMode: "readonly-safe-visual-ui-persistence" };
  }
}

module.exports = { VisualUiRuntime };
