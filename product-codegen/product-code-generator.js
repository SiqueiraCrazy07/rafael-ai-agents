const fs = require("node:fs");
const path = require("node:path");
const { ApiGenerator } = require("./api-generator");
const { BackendGenerator } = require("./backend-generator");
const { CodeQualityValidator } = require("./code-quality-validator");
const { ComponentGenerator } = require("./component-generator");
const { DatabaseGenerator } = require("./database-generator");
const { FrontendGenerator } = require("./frontend-generator");
const { ProjectBootstrapper } = require("./project-bootstrapper");
const { RouterGenerator } = require("./router-generator");

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

class ProductCodeGenerator {
  constructor({ rootDir = process.cwd() } = {}) {
    this.rootDir = rootDir;
    this.runtimeDir = path.join(rootDir, "runtime-data", "product-codegen");
    this.memoryDir = path.join(rootDir, "memory", "product-codegen");
    this.bootstrapper = new ProjectBootstrapper({ rootDir });
    this.routerGenerator = new RouterGenerator();
    this.componentGenerator = new ComponentGenerator();
    this.frontendGenerator = new FrontendGenerator();
    this.apiGenerator = new ApiGenerator();
    this.backendGenerator = new BackendGenerator();
    this.databaseGenerator = new DatabaseGenerator();
    this.qualityValidator = new CodeQualityValidator();
  }

  run({ limit = 4 } = {}) {
    ensureDir(this.runtimeDir);
    ensureDir(this.memoryDir);
    const projects = this.bootstrapper.discoverProjects().slice(0, limit);
    const processedProjects = projects.map((project) => this.generateForProject(project));
    const report = {
      productCodegenReportId: `product_codegen_report_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      status: processedProjects.every((item) => item.validation.valid) ? "autonomous_product_code_generator_ready" : "autonomous_product_code_generator_attention_required",
      readonly: true,
      deployExecuted: false,
      dependenciesInstalled: false,
      projectsProcessed: processedProjects.map((item) => ({
        projectSlug: item.project.projectSlug,
        projectRoot: item.project.projectRoot,
        valid: item.validation.valid,
        generatedFiles: item.generatedFiles.length
      })),
      processedProjects,
      integrations: {
        productFactory: "uses Product Factory blueprint-derived prototype metadata",
        productBuilder: "reads projects/generated outputs from Product Builder",
        runtime: "codegen report is runtime-data and memory persisted",
        telemetry: "memory/product-codegen is telemetry-readable",
        dashboard: "generated report is dashboard-readable"
      },
      fallback: {
        safeMode: true,
        jsonFallback: true,
        behavior: "generates starter code only; no dependency install, deploy, or external mutation"
      },
      risks: [
        "generated code is starter prototype code and requires human review",
        "dependencies are declared but not installed automatically",
        "database migrations are plans and are not executed",
        "routing is static prototype routing and not production auth"
      ],
      readiness: processedProjects.every((item) => item.validation.valid)
        ? "autonomous-product-code-generator-v1-ready"
        : "autonomous-product-code-generator-v1-attention-required",
      persistence: null
    };
    report.persistence = this.persist(report);
    return report;
  }

  generateForProject(project) {
    const bootstrap = this.bootstrapper.bootstrap(project);
    const router = this.routerGenerator.generate(project);
    const components = this.componentGenerator.generate(project);
    const frontend = this.frontendGenerator.generate({ project, router, components });
    const api = this.apiGenerator.generate(project);
    const backend = this.backendGenerator.generate({ project, api });
    const database = this.databaseGenerator.generate({ project, api });
    const validation = this.qualityValidator.validate({ project, frontend, backend, database, api, router });
    const generatedFiles = [
      ...frontend.files,
      ...backend.files,
      ...database.files
    ];
    return {
      codegenId: `product_codegen_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      project,
      bootstrap,
      frontend,
      backend,
      database,
      api,
      router,
      generatedFiles,
      validation,
      readonly: true,
      deployExecuted: false,
      dependenciesInstalled: false,
      safetyMode: "readonly-safe-autonomous-product-codegen"
    };
  }

  persist(report) {
    const filename = `product-codegen-${timestampForFile()}-${report.productCodegenReportId}.json`;
    const runtimePath = path.join(this.runtimeDir, filename);
    const memoryPath = path.join(this.memoryDir, filename);
    fs.writeFileSync(runtimePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(memoryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    return { runtimePath, memoryPath, safetyMode: "readonly-safe-product-codegen-persistence" };
  }
}

module.exports = {
  ProductCodeGenerator
};
