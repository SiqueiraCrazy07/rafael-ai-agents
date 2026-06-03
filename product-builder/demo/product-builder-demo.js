const { buildProductPlan } = require("../../product-factory/demo/product-factory-demo");
const { ProductAgentOrchestrator } = require("../../product-factory/product-agent-orchestrator");
const { ProductArchitectureGenerator } = require("../../product-factory/product-architecture-generator");
const { ProductBlueprintGenerator } = require("../../product-factory/product-blueprint-generator");
const { ProductClassifier } = require("../../product-factory/product-classifier");
const { ProductLearningFramework } = require("../../product-factory/product-learning-framework");
const { ProductRequestParser } = require("../../product-factory/product-request-parser");
const { ProductRoadmapGenerator } = require("../../product-factory/product-roadmap-generator");
const { ProductTemplateRegistry } = require("../../product-factory/product-template-registry");
const { ProductValidationEngine } = require("../../product-factory/product-validation-engine");
const { ProductBuilderRuntime } = require("../product-builder-runtime");

function createFactoryServices() {
  return {
    parser: new ProductRequestParser(),
    classifier: new ProductClassifier(),
    registry: new ProductTemplateRegistry(),
    learning: new ProductLearningFramework(),
    blueprint: new ProductBlueprintGenerator(),
    architecture: new ProductArchitectureGenerator(),
    agents: new ProductAgentOrchestrator(),
    roadmap: new ProductRoadmapGenerator(),
    validation: new ProductValidationEngine()
  };
}

function runProductBuilderDemo({ rootDir = process.cwd() } = {}) {
  const requests = [
    "criar plataforma de ingles",
    "criar jogo educativo",
    "criar CRM",
    "criar chatbot"
  ];
  const services = createFactoryServices();
  const productPlans = requests.map((request) => buildProductPlan(request, services));
  const runtime = new ProductBuilderRuntime({ rootDir });
  const report = runtime.run({ productPlans });

  console.log(JSON.stringify({
    productBuilderReportId: report.productBuilderReportId,
    status: report.status,
    projectsGenerated: report.generatedProjects,
    structureCreated: report.builds.map((build) => ({
      project: build.project.projectName,
      folders: build.folder.folders.map((folder) => folder.name)
    })),
    documentationCreated: report.builds.map((build) => ({
      project: build.project.projectName,
      files: build.documentation.files
    })),
    uxGenerated: report.builds.map((build) => ({
      project: build.project.projectName,
      screens: build.ux.screens,
      wireframes: build.ux.wireframes.length
    })),
    curriculumGenerated: report.builds.map((build) => ({
      project: build.project.projectName,
      generated: build.curriculum.generated,
      modules: build.curriculum.modules.length
    })),
    backlogGenerated: report.builds.map((build) => ({
      project: build.project.projectName,
      epics: build.backlog.epics.length,
      tasks: build.backlog.tasks.length
    })),
    readiness: report.readiness,
    risks: report.risks,
    persistence: report.persistence
  }, null, 2));
  return report;
}

if (require.main === module) {
  try {
    runProductBuilderDemo();
  } catch (error) {
    console.error(JSON.stringify({
      status: "product_builder_demo_failed",
      error: error.message,
      fallback: {
        safeMode: true,
        reason: "product-builder-demo-error"
      }
    }, null, 2));
    process.exitCode = 1;
  }
}

module.exports = {
  runProductBuilderDemo
};
