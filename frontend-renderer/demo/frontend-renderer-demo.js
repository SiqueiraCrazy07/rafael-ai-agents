const { FrontendRendererRuntime } = require("../frontend-renderer-runtime");

function runFrontendRendererDemo({ rootDir = process.cwd() } = {}) {
  const runtime = new FrontendRendererRuntime({ rootDir });
  const report = runtime.run({ limit: 4 });
  console.log(JSON.stringify({
    status: report.status,
    frontendRendererReportId: report.frontendRendererReportId,
    projectsRendered: report.projectsRendered,
    screensCreated: report.screensCreated,
    componentsEnhanced: report.componentsEnhanced,
    gamifiedUi: report.gamifiedUi,
    learningUi: report.learningUi,
    businessUi: report.businessUi,
    tokensApplied: report.tokensApplied,
    validations: report.validations,
    risks: report.risks,
    readiness: report.readiness,
    persistence: report.persistence
  }, null, 2));
  return report;
}

if (require.main === module) {
  runFrontendRendererDemo();
}

module.exports = { runFrontendRendererDemo };
