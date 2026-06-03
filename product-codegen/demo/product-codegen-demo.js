const { ProductCodeGenerator } = require("../product-code-generator");

function runProductCodegenDemo({ rootDir = process.cwd() } = {}) {
  const generator = new ProductCodeGenerator({ rootDir });
  const report = generator.run({ limit: 4 });
  console.log(JSON.stringify({
    productCodegenReportId: report.productCodegenReportId,
    status: report.status,
    projectsProcessed: report.projectsProcessed,
    filesGenerated: report.processedProjects.map((item) => ({
      project: item.project.projectSlug,
      files: item.generatedFiles
    })),
    frontendGenerated: report.processedProjects.map((item) => ({
      project: item.project.projectSlug,
      pages: item.frontend.pages,
      components: item.frontend.components,
      routes: item.frontend.routes.map((route) => route.path)
    })),
    backendGenerated: report.processedProjects.map((item) => ({
      project: item.project.projectSlug,
      controllers: item.backend.controllers,
      middleware: item.backend.middleware,
      routes: item.backend.routes.map((route) => `${route.method} ${route.path}`)
    })),
    databaseGenerated: report.processedProjects.map((item) => ({
      project: item.project.projectSlug,
      entities: item.database.entities,
      migrationsPlan: item.database.migrationsPlan,
      seedPlan: item.database.seedPlan
    })),
    apisGenerated: report.processedProjects.map((item) => ({
      project: item.project.projectSlug,
      endpoints: item.api.endpoints.map((endpoint) => `${endpoint.method} ${endpoint.path}`)
    })),
    validations: report.processedProjects.map((item) => ({
      project: item.project.projectSlug,
      valid: item.validation.valid,
      failures: item.validation.failures
    })),
    risks: report.risks,
    readiness: report.readiness,
    persistence: report.persistence
  }, null, 2));
  return report;
}

if (require.main === module) {
  try {
    runProductCodegenDemo();
  } catch (error) {
    console.error(JSON.stringify({
      status: "product_codegen_demo_failed",
      error: error.message,
      fallback: {
        safeMode: true,
        reason: "product-codegen-demo-error"
      }
    }, null, 2));
    process.exitCode = 1;
  }
}

module.exports = {
  runProductCodegenDemo
};
