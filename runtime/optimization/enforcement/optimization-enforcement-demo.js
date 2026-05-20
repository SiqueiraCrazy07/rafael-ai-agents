const { OptimizationEnforcer } = require("./optimization-enforcer");
const { OptimizationPolicyReader } = require("./optimization-policy-reader");

function runOptimizationEnforcementDemo() {
  const reader = new OptimizationPolicyReader();
  const readResult = reader.readLatest();
  const enforcer = new OptimizationEnforcer();
  const report = enforcer.enforce(readResult);
  const persistence = enforcer.persist(report);

  console.log(
    JSON.stringify(
      {
        enforcementId: report.enforcementId,
        status: report.status,
        mode: report.mode,
        source: report.source,
        safety: report.safety,
        summary: report.summary,
        concurrency: report.decisions.filter((decision) => decision.type === "concurrency-limit"),
        retry: report.decisions.filter((decision) => decision.type === "retry-strategy"),
        workerBalancing: report.decisions.filter((decision) => decision.type === "worker-avoidance"),
        queuePriority: report.decisions.filter((decision) => decision.type === "queue-priority"),
        throttling: report.decisions.filter((decision) => decision.type === "throttling-mode"),
        optimizationGains: report.optimizationGains,
        persistence
      },
      null,
      2
    )
  );
}

runOptimizationEnforcementDemo();
