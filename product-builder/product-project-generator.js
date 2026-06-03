const { slugify } = require("./product-folder-generator");

class ProductProjectGenerator {
  generate({ productPlan }) {
    const blueprint = productPlan.blueprint;
    const architecture = productPlan.architecture;
    const roadmap = productPlan.roadmap;
    const projectName = blueprint.productName || productPlan.template?.templateId || "Generated Product";
    const modules = [
      { name: "frontend", purpose: "responsive user interface and prototype screens" },
      { name: "backend", purpose: "readonly API contracts and service boundaries" },
      { name: "database", purpose: "schema plan and JSON fallback model" },
      { name: "docs", purpose: "product, architecture and implementation documentation" },
      { name: "ux", purpose: "personas, journeys, wireframes and navigation flows" },
      { name: "curriculum", purpose: "learning design for educational products" },
      { name: "assets", purpose: "visual, audio and animation planning" },
      { name: "tests", purpose: "validation checklist and QA scenarios" },
      { name: "roadmap", purpose: "milestones and delivery plan" }
    ];

    return {
      projectId: `product_project_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      projectName,
      projectSlug: slugify(projectName),
      sourceBlueprintId: blueprint.blueprintId,
      category: productPlan.classification.primaryCategory,
      templateId: productPlan.template.templateId,
      structure: modules.map((module) => module.name),
      modules,
      roadmap: roadmap.phases,
      backlog: [],
      architectureSummary: {
        frontend: architecture.frontend.appType,
        backend: architecture.backend.style,
        database: architecture.database.primary,
        dashboards: architecture.dashboards
      },
      readonly: true,
      destructiveActions: false,
      deployExecuted: false,
      safetyMode: "readonly-safe-product-project-generator"
    };
  }
}

module.exports = {
  ProductProjectGenerator
};
