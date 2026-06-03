const fs = require("node:fs");
const path = require("node:path");
const { ProductAssetsPlanner } = require("./product-assets-planner");
const { ProductBacklogGenerator } = require("./product-backlog-generator");
const { ProductCurriculumGenerator } = require("./product-curriculum-generator");
const { ProductDemoGenerator } = require("./product-demo-generator");
const { ProductDocumentationGenerator } = require("./product-documentation-generator");
const { ProductFolderGenerator } = require("./product-folder-generator");
const { ProductProjectGenerator } = require("./product-project-generator");
const { ProductReadinessValidator } = require("./product-readiness-validator");
const { ProductUxGenerator } = require("./product-ux-generator");

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

class ProductBuilderRuntime {
  constructor({ rootDir = process.cwd() } = {}) {
    this.rootDir = rootDir;
    this.runtimeDir = path.join(rootDir, "runtime-data", "product-builder");
    this.memoryDir = path.join(rootDir, "memory", "product-builder");
    this.projectGenerator = new ProductProjectGenerator();
    this.folderGenerator = new ProductFolderGenerator({ rootDir });
    this.uxGenerator = new ProductUxGenerator();
    this.curriculumGenerator = new ProductCurriculumGenerator();
    this.assetsPlanner = new ProductAssetsPlanner();
    this.backlogGenerator = new ProductBacklogGenerator();
    this.documentationGenerator = new ProductDocumentationGenerator();
    this.demoGenerator = new ProductDemoGenerator();
    this.readinessValidator = new ProductReadinessValidator();
  }

  build(productPlan) {
    if (!productPlan?.blueprint) {
      return this.safeFallback("blueprint-required");
    }
    const project = this.projectGenerator.generate({ productPlan });
    const folder = this.folderGenerator.createStructure(project.projectName);
    const ux = this.uxGenerator.generate({ productPlan });
    const curriculum = this.curriculumGenerator.generate({ productPlan });
    const assets = this.assetsPlanner.plan({ productPlan });
    const backlog = this.backlogGenerator.generate({ productPlan, ux, curriculum, assets });
    project.backlog = backlog.epics;
    const documentation = this.documentationGenerator.generate({ project, folder, productPlan, ux, curriculum, backlog, assets });
    const productDemo = this.demoGenerator.generate({ folder, productPlan, ux, backlog, curriculum });
    const readiness = this.readinessValidator.validate({ folder, documentation, ux, curriculum, backlog, productDemo });

    return {
      buildId: `product_build_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      sourceProductPlanId: productPlan.productPlanId,
      project,
      folder,
      documentation,
      ux,
      curriculum,
      assets,
      backlog,
      productDemo,
      readiness,
      readonly: true,
      destructiveActions: false,
      deployExecuted: false,
      generatedOutputRoot: folder.projectRoot,
      safetyMode: "readonly-safe-product-builder-runtime"
    };
  }

  run({ productPlans = [] } = {}) {
    ensureDir(this.runtimeDir);
    ensureDir(this.memoryDir);
    const builds = productPlans.map((plan) => this.build(plan));
    const report = {
      productBuilderReportId: `product_builder_report_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      status: builds.every((build) => build.readiness?.ready) ? "product_builder_execution_runtime_ready" : "product_builder_attention_required",
      readonly: true,
      destructiveActions: false,
      deployExecuted: false,
      generatedProjects: builds.map((build) => ({
        projectName: build.project?.projectName,
        projectSlug: build.project?.projectSlug,
        projectRoot: build.folder?.projectRoot,
        ready: build.readiness?.ready
      })),
      builds,
      fallback: {
        safeMode: true,
        jsonFallback: true,
        behavior: "builder creates prototype folders, markdown and JSON only; no deploy is executed"
      },
      risks: [
        "generated prototypes are documentation-first and not production applications",
        "existing generated project files can be refreshed by rerunning the demo",
        "healthcare and regulated products require human review before implementation",
        "asset plan is descriptive and does not create copyrighted media"
      ],
      readiness: builds.every((build) => build.readiness?.ready)
        ? "product-builder-execution-runtime-v1-ready"
        : "product-builder-execution-runtime-v1-attention-required",
      persistence: null
    };
    report.persistence = this.persist(report);
    return report;
  }

  persist(report) {
    const filename = `product-builder-${timestampForFile()}-${report.productBuilderReportId}.json`;
    const runtimePath = path.join(this.runtimeDir, filename);
    const memoryPath = path.join(this.memoryDir, filename);
    fs.writeFileSync(runtimePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(memoryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    return { runtimePath, memoryPath, safetyMode: "readonly-safe-product-builder-persistence" };
  }

  safeFallback(reason) {
    return {
      buildId: `product_build_fallback_${Date.now()}`,
      ready: false,
      readonly: true,
      destructiveActions: false,
      fallback: { safeMode: true, reason },
      safetyMode: "readonly-safe-product-builder-fallback"
    };
  }
}

module.exports = {
  ProductBuilderRuntime
};
