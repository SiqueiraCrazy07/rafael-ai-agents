const fs = require("node:fs");
const path = require("node:path");
const { RuntimeEventAnalyzer } = require("./runtime-event-analyzer");
const { AgentHealthAnalyzer } = require("../analytics/agent-health-analyzer");
const { FailurePatternDetector } = require("../analytics/failure-pattern-detector");
const { RetryPatternAnalyzer } = require("../analytics/retry-pattern-analyzer");
const { WorkflowStabilityAnalyzer } = require("../analytics/workflow-stability-analyzer");
const { IncidentGenerator } = require("../incidents/incident-generator");
const { HealthScoreEngine } = require("../health/health-score-engine");
const { RecoveryRecommendationEngine } = require("../recovery/recovery-recommendation-engine");
const { OperationalRiskAnalyzer } = require("../analysis/operational-risk-analyzer");
const { SupervisorTelemetry } = require("../analytics/supervisor-telemetry");
const { writeMemoryCollection, writeMemoryJson } = require("../../engine/memory/execution-memory-writer");

function loadExecutions(executionsDir = path.resolve(process.cwd(), "runtime-data", "executions")) {
  if (!fs.existsSync(executionsDir)) {
    return [];
  }

  return fs
    .readdirSync(executionsDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(fs.readFileSync(path.join(executionsDir, file), "utf8")));
}

function writeReport(report) {
  const reportsDir = path.resolve(process.cwd(), "supervisor", "reports", "generated");
  fs.mkdirSync(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, `supervisor-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return reportPath;
}

async function runSupervisorDemo() {
  const runtimeEventAnalyzer = new RuntimeEventAnalyzer();
  const analyzedEvents = runtimeEventAnalyzer.analyze();
  const executions = loadExecutions();

  const workflowStability = new WorkflowStabilityAnalyzer().analyze(executions);
  const agentHealth = new AgentHealthAnalyzer().analyze({
    events: analyzedEvents.events,
    executions
  });
  const failurePatterns = new FailurePatternDetector().detect({
    analyzedEvents,
    executions
  });
  const retryPatterns = new RetryPatternAnalyzer().analyze({
    analyzedEvents,
    executions
  });
  const incidents = new IncidentGenerator().generate({
    failurePatterns,
    retryPatterns
  });
  const healthReport = new HealthScoreEngine().buildHealthReport({
    analyzedEvents,
    agentHealth,
    workflowStability
  });
  const recommendations = new RecoveryRecommendationEngine().recommend({
    incidents,
    retryPatterns
  });
  const risks = new OperationalRiskAnalyzer().analyze({
    incidents,
    healthReport
  });
  const telemetry = new SupervisorTelemetry().summarize({
    analyzedEvents,
    incidents,
    healthReport,
    recommendations,
    risks
  });

  const report = {
    reportId: `supervisor_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    telemetry,
    healthReport,
    workflowStability,
    agentHealth,
    failurePatterns,
    retryPatterns,
    incidents,
    recoveryRecommendations: recommendations,
    operationalRisks: risks
  };

  const reportPath = writeReport(report);
  const memoryPaths = {
    incidents: writeMemoryCollection("memory/incidents/generated", "incident", incidents),
    healthReport: writeMemoryJson("memory/health", "health-report", healthReport),
    workflowStability: writeMemoryJson("memory/workflows", "workflow-stability", {
      generatedAt: report.generatedAt,
      workflows: workflowStability
    }),
    recoveryRecommendations: writeMemoryCollection(
      "memory/recovery",
      "recovery-recommendation",
      recommendations
    )
  };

  console.log(
    JSON.stringify(
      {
        reportPath,
        memoryPaths,
        telemetry,
        unstableAgents: agentHealth.filter((agent) => agent.unstable).map((agent) => ({
          agentId: agent.agentId,
          healthScore: agent.healthScore,
          reasons: [...new Set(agent.reasons)]
        })),
        incidents: incidents.map((incident) => ({
          severity: incident.severity,
          workflow: incident.workflow,
          executionId: incident.executionId,
          humanRequired: incident.humanRequired
        })),
        recoveryRecommendations: recommendations.map((recommendation) => ({
          action: recommendation.action,
          workflow: recommendation.workflow,
          rollbackRecommended: recommendation.rollbackRecommended
        }))
      },
      null,
      2
    )
  );
}

runSupervisorDemo().catch((error) => {
  console.error(`Supervisor demo failed: ${error.message}`);
  process.exitCode = 1;
});
