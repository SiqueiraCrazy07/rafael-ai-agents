const fs = require("node:fs");
const path = require("node:path");
const { ProductAgentOrchestrator } = require("../product-agent-orchestrator");
const { ProductArchitectureGenerator } = require("../product-architecture-generator");
const { ProductBlueprintGenerator } = require("../product-blueprint-generator");
const { ProductClassifier } = require("../product-classifier");
const { ProductLearningFramework } = require("../product-learning-framework");
const { ProductRequestParser } = require("../product-request-parser");
const { ProductRoadmapGenerator } = require("../product-roadmap-generator");
const { ProductTemplateRegistry } = require("../product-template-registry");
const { ProductValidationEngine } = require("../product-validation-engine");

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

function persistReport(rootDir, report) {
  const runtimeDir = path.join(rootDir, "runtime-data", "product-factory");
  const memoryDir = path.join(rootDir, "memory", "product-factory");
  ensureDir(runtimeDir);
  ensureDir(memoryDir);
  const filename = `product-factory-${timestampForFile()}-${report.productFactoryDemoId}.json`;
  const runtimePath = path.join(runtimeDir, filename);
  const memoryPath = path.join(memoryDir, filename);
  fs.writeFileSync(runtimePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(memoryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return { runtimePath, memoryPath, safetyMode: "readonly-safe-product-factory-persistence" };
}

function buildProductPlan(request, services) {
  const parsedRequest = services.parser.parse(request);
  const classification = services.classifier.classify(parsedRequest);
  const template = services.registry.findBestMatch({
    normalizedText: parsedRequest.normalizedText,
    categories: classification.categories
  });
  const learningFramework = services.learning.apply({ classification, template });
  const blueprint = services.blueprint.generate({ parsedRequest, classification, template, learningFramework });
  const architecture = services.architecture.generate({ blueprint, classification });
  const agents = services.agents.selectAgents({ classification, blueprint, architecture });
  const roadmap = services.roadmap.generate({ blueprint, architecture, classification });
  blueprint.roadmap = roadmap.phases.map((phase) => phase.phase);
  const validation = services.validation.validate({
    parsedRequest,
    classification,
    template,
    blueprint,
    architecture,
    agents,
    roadmap
  });

  return {
    productPlanId: `product_plan_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    request,
    parsedRequest,
    classification,
    template: {
      templateId: template.templateId,
      categories: template.categories,
      matchScore: template.matchScore
    },
    blueprint,
    architecture,
    agents,
    roadmap,
    validation,
    readonly: true,
    destructiveActions: false,
    safetyMode: "readonly-safe-product-plan"
  };
}

function runProductFactoryDemo({ rootDir = process.cwd(), requests = null } = {}) {
  const services = {
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
  const demoRequests = requests || [
    "criar plataforma de ingles",
    "criar jogo educativo",
    "criar CRM",
    "criar chatbot",
    "criar sistema de clinica",
    "criar sistema de agendamento"
  ];
  const productPlans = demoRequests.map((request) => buildProductPlan(request, services));
  const primaryPlan = productPlans[0];

  const report = {
    productFactoryDemoId: `product_factory_demo_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    status: "product_factory_prototype_generator_ready",
    readonly: true,
    destructiveActions: false,
    codeGenerated: false,
    templates: services.registry.listTemplates().map((template) => ({
      templateId: template.templateId,
      categories: template.categories,
      coreFeatures: template.coreFeatures
    })),
    productPlans,
    primaryPlan,
    integrations: {
      runtimeGateway: "product-factory reports are gateway-readable through memory/product-factory",
      dockerRuntime: "product plans include docker/cloud readiness metadata without deployment",
      streaming: "memory/product-factory is streaming-readable",
      telemetry: "product factory validation and generation metadata are telemetry-readable",
      dashboard: "product plans are dashboard-readable",
      governance: "runtime quality gates preserved"
    },
    fallback: {
      safeMode: true,
      jsonFallback: true,
      behavior: "factory produces blueprint and implementation metadata only; no destructive code or deployment is executed"
    },
    risks: [
      "generated product plans are strategic prototypes, not production specifications",
      "domain compliance requires future human review for healthcare and regulated products",
      "agent execution is plan-only in V1",
      "market validation is inferred from request text and templates"
    ],
    readiness: "product-factory-prototype-generator-v1-ready",
    persistence: null
  };
  report.persistence = persistReport(rootDir, report);

  console.log(JSON.stringify({
    productFactoryDemoId: report.productFactoryDemoId,
    status: report.status,
    templates: report.templates.map((template) => template.templateId),
    blueprint: {
      productName: primaryPlan.blueprint.productName,
      objective: primaryPlan.blueprint.objective,
      targetAudience: primaryPlan.blueprint.targetAudience,
      mvp: primaryPlan.blueprint.mvp
    },
    architecture: primaryPlan.architecture,
    agents: primaryPlan.agents.selectedAgents.map((agent) => agent.agent),
    learningFramework: primaryPlan.learningFramework || primaryPlan.blueprint.learningFramework,
    roadmap: primaryPlan.roadmap.phases,
    validation: {
      valid: primaryPlan.validation.valid,
      failures: primaryPlan.validation.failures
    },
    generatedPlans: report.productPlans.map((plan) => ({
      request: plan.request,
      templateId: plan.template.templateId,
      category: plan.classification.primaryCategory,
      valid: plan.validation.valid
    })),
    risks: report.risks,
    readiness: report.readiness,
    persistence: report.persistence
  }, null, 2));
  return report;
}

if (require.main === module) {
  try {
    runProductFactoryDemo();
  } catch (error) {
    console.error(JSON.stringify({
      status: "product_factory_demo_failed",
      error: error.message,
      fallback: {
        safeMode: true,
        reason: "product-factory-demo-error"
      }
    }, null, 2));
    process.exitCode = 1;
  }
}

module.exports = {
  runProductFactoryDemo,
  buildProductPlan
};
