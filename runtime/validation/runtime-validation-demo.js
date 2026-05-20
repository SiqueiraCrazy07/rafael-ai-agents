const { RuntimeIntegrationValidator } = require("./runtime-integration-validator");

function runRuntimeValidationDemo() {
  const validator = new RuntimeIntegrationValidator();
  const report = validator.validate();
  const persistence = validator.persist(report);

  console.log(
    JSON.stringify(
      {
        validationId: report.validationId,
        status: report.status,
        readiness: report.readiness,
        summary: report.summary,
        modulesValidated: report.modulesValidated,
        failedChecks: report.checks
          .filter((check) => !check.passed)
          .map((check) => ({
            name: check.name,
            severity: check.severity,
            evidence: check.evidence
          })),
        validatedChecks: report.checks
          .filter((check) => check.passed)
          .map((check) => check.name),
        risks: report.risks,
        fallback: report.fallback,
        persistence
      },
      null,
      2
    )
  );

  if (report.status !== "passed") {
    process.exitCode = 1;
  }
}

runRuntimeValidationDemo();
