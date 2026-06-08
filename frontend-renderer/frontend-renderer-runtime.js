const fs = require("node:fs");
const path = require("node:path");

const { ProjectBootstrapper, ensureDir, writeFile, readJson } = require("../product-codegen/project-bootstrapper");
const { DesignTokenApplier } = require("./design-token-applier");
const { NavigationRenderer } = require("./navigation-renderer");
const { ReactComponentEnhancer } = require("./react-component-enhancer");
const { ReactScreenGenerator } = require("./react-screen-generator");
const { GamifiedUiRenderer } = require("./gamified-ui-renderer");
const { LearningUiRenderer } = require("./learning-ui-renderer");
const { BusinessUiRenderer } = require("./business-ui-renderer");
const { FrontendQualityValidator } = require("./frontend-quality-validator");

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

class FrontendRendererRuntime {
  constructor({ rootDir = process.cwd() } = {}) {
    this.rootDir = rootDir;
    this.runtimeDir = path.join(rootDir, "runtime-data", "frontend-renderer");
    this.memoryDir = path.join(rootDir, "memory", "frontend-renderer");
    this.projectBootstrapper = new ProjectBootstrapper({ rootDir });
    this.designTokenApplier = new DesignTokenApplier();
    this.navigationRenderer = new NavigationRenderer();
    this.componentEnhancer = new ReactComponentEnhancer();
    this.screenGenerator = new ReactScreenGenerator();
    this.gamifiedUiRenderer = new GamifiedUiRenderer();
    this.learningUiRenderer = new LearningUiRenderer();
    this.businessUiRenderer = new BusinessUiRenderer();
    this.validator = new FrontendQualityValidator();
  }

  run({ limit = 4 } = {}) {
    ensureDir(this.runtimeDir);
    ensureDir(this.memoryDir);
    const projects = this.projectBootstrapper.discoverProjects().slice(0, limit);
    const renderedProjects = projects.map((project) => this.renderProject(project));
    const allValid = renderedProjects.every((project) => project.validation.valid);
    const report = {
      frontendRendererReportId: `frontend_renderer_${Date.now()}`,
      status: allValid ? "frontend_prototype_renderer_ready" : "attention_required",
      readonly: true,
      deployExecuted: false,
      dependenciesInstalled: false,
      externalAiUsed: false,
      projectsRendered: renderedProjects.map((project) => ({
        projectSlug: project.project.projectSlug,
        productName: project.project.productName,
        routes: project.routes.map((route) => route.path),
        filesCreated: project.filesCreated.length,
        valid: project.validation.valid
      })),
      screensCreated: renderedProjects.map((project) => ({
        project: project.project.projectSlug,
        screens: project.routes.map((route) => route.component)
      })),
      componentsEnhanced: renderedProjects.map((project) => ({
        project: project.project.projectSlug,
        components: project.componentsEnhanced
      })),
      gamifiedUi: renderedProjects.map((project) => ({
        project: project.project.projectSlug,
        applied: true,
        elements: ["XP bar", "streak", "badges", "mission progress", "rewards", "level indicator"]
      })),
      learningUi: renderedProjects.map((project) => ({
        project: project.project.projectSlug,
        applied: project.learningUiApplied,
        screens: project.learningUiApplied ? ["LessonPage", "ReviewPage", "QuizPage", "TutorPage", "AdaptiveProgressPage"] : []
      })),
      businessUi: renderedProjects.map((project) => ({
        project: project.project.projectSlug,
        applied: project.businessUiApplied,
        screens: project.businessScreens
      })),
      tokensApplied: renderedProjects.map((project) => ({
        project: project.project.projectSlug,
        source: project.tokenSource,
        colors: Object.keys(project.tokens.colors || {})
      })),
      validations: renderedProjects.map((project) => project.validation),
      integrations: ["visual-ui", "interactive-experience", "ai-tutor", "product-codegen", "telemetry", "dashboard"],
      risks: [
        "V1 renders frontend prototypes only and does not install dependencies.",
        "Tutor and speaking flows remain placeholder UI without external AI or speech processing.",
        "Generated React should receive human design QA before production branding."
      ],
      readiness: allValid ? "frontend-prototype-renderer-v1-ready" : "frontend renderer requires review",
      renderedProjects
    };
    report.persistence = this.persist(report);
    return report;
  }

  renderProject(project) {
    const srcDir = path.join(project.projectRoot, "frontend", "src");
    ensureDir(srcDir);
    ensureDir(path.join(srcDir, "components"));
    ensureDir(path.join(srcDir, "pages"));
    ensureDir(path.join(srcDir, "routes"));

    const context = this.readProjectContext(project);
    const tokens = this.designTokenApplier.load(project);
    const routes = this.navigationRenderer.routesFor(project);
    const componentFiles = this.componentEnhancer.files(project);
    const screenFiles = this.screenGenerator.files(project, routes);
    const learningFiles = this.isEducational(project) ? this.learningUiRenderer.files(project.productName) : {};
    const businessFiles = this.businessUiRenderer.files(project.productName, project.projectSlug);
    const missionFile = routes.some((route) => route.component === "MissionsPage")
      ? { "MissionsPage.jsx": this.gamifiedUiRenderer.missionsPage(project.productName) }
      : {};

    const filesCreated = [];
    const writeSrc = (relativePath, content) => {
      const filePath = path.join(srcDir, relativePath);
      writeFile(filePath, content);
      filesCreated.push(path.relative(this.rootDir, filePath).replace(/\\/g, "/"));
    };

    Object.entries(componentFiles).forEach(([file, content]) => writeSrc(path.join("components", file), content));
    Object.entries({ ...screenFiles, ...learningFiles, ...businessFiles, ...missionFile }).forEach(([file, content]) => writeSrc(path.join("pages", file), content));
    writeSrc(path.join("routes", "routes.js"), this.navigationRenderer.file(routes));
    writeSrc("App.jsx", this.appFile(project.productName));
    writeSrc("styles.css", this.designTokenApplier.css(tokens));
    writeSrc("frontend-renderer-manifest.json", `${JSON.stringify({
      projectSlug: project.projectSlug,
      readonly: true,
      deployExecuted: false,
      dependenciesInstalled: false,
      externalAiUsed: false,
      sources: context.sources,
      generatedAt: new Date().toISOString()
    }, null, 2)}\n`);

    const validation = this.validator.validate(project, routes, filesCreated);
    return {
      project,
      routes,
      tokens,
      tokenSource: context.sources.visualUi ? "visual-ui/design-tokens.json" : "default-fallback",
      filesCreated,
      componentsEnhanced: Object.keys(componentFiles).map((file) => file.replace(".jsx", "")),
      learningUiApplied: this.isEducational(project),
      businessUiApplied: Object.keys(businessFiles).length > 0,
      businessScreens: Object.keys(businessFiles).map((file) => file.replace(".jsx", "")),
      context,
      validation,
      readonly: true
    };
  }

  readProjectContext(project) {
    const visualTokensPath = path.join(project.projectRoot, "visual-ui", "design-tokens.json");
    const interactivePlanPath = path.join(project.projectRoot, "interactive", "experience-plan.json");
    const tutorPlanPath = path.join(project.projectRoot, "ai-tutor", "tutor-plan.json");
    return {
      visualTokens: readJson(visualTokensPath),
      interactivePlan: readJson(interactivePlanPath),
      tutorPlan: readJson(tutorPlanPath),
      sources: {
        visualUi: fs.existsSync(visualTokensPath),
        interactive: fs.existsSync(interactivePlanPath),
        aiTutor: fs.existsSync(tutorPlanPath)
      }
    };
  }

  isEducational(project) {
    return project.category === "education" || project.category === "game" || project.curriculumGenerated;
  }

  appFile(productName) {
    return `import { useEffect, useMemo, useState } from "react";
import { PrototypeShell } from "./components/PrototypeShell.jsx";
import { findRoute, navigation } from "./routes/routes.js";

function currentHashPath() {
  const hash = window.location.hash.replace("#", "");
  return hash || "/";
}

export default function App() {
  const [path, setPath] = useState(currentHashPath());
  useEffect(() => {
    const onHashChange = () => setPath(currentHashPath());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  const route = useMemo(() => findRoute(path), [path]);
  const Page = route.component;
  const onNavigate = (nextPath) => {
    window.location.hash = nextPath;
    setPath(nextPath);
  };
  return (
    <PrototypeShell productName="${productName}" navigation={navigation} currentPath={route.path} onNavigate={onNavigate}>
      <Page />
    </PrototypeShell>
  );
}
`;
  }

  persist(report) {
    const fileName = `${timestampForFile()}-${report.frontendRendererReportId}.json`;
    const runtimePath = path.join(this.runtimeDir, fileName);
    const memoryPath = path.join(this.memoryDir, fileName);
    writeFile(runtimePath, `${JSON.stringify(report, null, 2)}\n`);
    writeFile(memoryPath, `${JSON.stringify({
      frontendRendererReportId: report.frontendRendererReportId,
      status: report.status,
      projectsRendered: report.projectsRendered,
      readiness: report.readiness,
      risks: report.risks
    }, null, 2)}\n`);
    return {
      runtimePath: path.relative(this.rootDir, runtimePath).replace(/\\/g, "/"),
      memoryPath: path.relative(this.rootDir, memoryPath).replace(/\\/g, "/")
    };
  }
}

module.exports = { FrontendRendererRuntime };
