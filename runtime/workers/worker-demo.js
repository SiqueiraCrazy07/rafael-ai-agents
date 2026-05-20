const { WorkerRuntime } = require("./worker-runtime");

function summarizeReport(report, persistence) {
  return {
    workerRuntimeReportId: report.workerRuntimeReportId,
    status: report.status,
    workersRegistered: report.registeredWorkers.map((worker) => ({
      workerId: worker.workerId,
      capabilities: worker.capabilities,
      concurrencyLimit: worker.concurrencyLimit,
      readonly: worker.readonly,
      enabled: worker.enabled,
      status: worker.status,
      healthStatus: worker.healthStatus
    })),
    executionLifecycle: report.executionLifecycle,
    executions: report.executionResults.map((result) => ({
      executionId: result.executionId,
      workflow: result.workflow,
      project: result.project,
      workerId: result.workerId,
      status: result.status,
      attempts: result.attempts,
      error: result.error
    })),
    transitions: {
      generated: report.transitions.generated.map((transition) => ({
        transitionId: transition.transitionId,
        from: transition.from,
        to: transition.to,
        accepted: transition.accepted,
        source: transition.source,
        reason: transition.reason
      })),
      coordinatorApplied: report.transitions.coordinator.appliedTransitions.map((transition) => ({
        workflow: transition.workflow,
        from: transition.from,
        to: transition.to,
        decisionType: transition.decisionType
      })),
      blocked: report.transitions.blocked
    },
    events: {
      published: report.events.published.map((event) => ({
        eventId: event.eventId,
        type: event.type,
        workflowId: event.workflowId,
        correlationId: event.correlationId
      }))
    },
    decisions: {
      engineReportId: report.decisions.engineReportId,
      registered: report.decisions.registered.decisions.map((decision) => ({
        decisionId: decision.decisionId,
        type: decision.type,
        severity: decision.severity,
        action: decision.action
      }))
    },
    health: {
      unhealthyWorkers: report.health.unhealthyWorkers.map((worker) => ({
        workerId: worker.workerId,
        successRate: worker.successRate,
        reason: worker.reason
      }))
    },
    database: {
      adapter: report.database.adapter.adapter,
      workerExecutionWrites: report.database.workerExecutions
    },
    fallback: report.fallback,
    persistence
  };
}

function runWorkerDemo() {
  const runtime = new WorkerRuntime();
  const report = runtime.run();
  const persistence = runtime.persist(report);

  console.log(JSON.stringify(summarizeReport(report, persistence), null, 2));
}

if (require.main === module) {
  runWorkerDemo();
}

module.exports = {
  runWorkerDemo,
  summarizeReport
};
