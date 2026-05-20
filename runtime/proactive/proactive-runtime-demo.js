const { ProactiveRuntimeCoordinator } = require("./enforcement/proactive-runtime-coordinator");

function runProactiveRuntimeDemo() {
  const coordinator = new ProactiveRuntimeCoordinator();
  const report = coordinator.run();
  const persistence = coordinator.persist(report);

  console.log(
    JSON.stringify(
      {
        enforcementId: report.enforcementId,
        status: report.status,
        forecastId: report.forecastId,
        policy: report.policy,
        summary: report.summary,
        throttling: report.actions.filter((action) => action.type === "predictive-throttling"),
        blockedWorkflows: report.actions.filter((action) => action.type === "predictive-workflow-block"),
        rerouting: report.actions.filter((action) => action.type === "predictive-rerouting"),
        humanGates: report.actions.filter((action) => action.type === "predictive-human-gate"),
        recoveryTriggers: report.actions.filter((action) => action.type === "predictive-recovery-trigger"),
        persistence
      },
      null,
      2
    )
  );
}

runProactiveRuntimeDemo();
