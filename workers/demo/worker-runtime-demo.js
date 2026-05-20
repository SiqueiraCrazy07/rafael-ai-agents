const { runWorkerRuntimeDemo } = require("../runtime-worker");

async function main() {
  const report = await runWorkerRuntimeDemo();
  console.log(JSON.stringify({
    workerRuntimeReportId: report.workerRuntimeReportId,
    status: report.status,
    readonly: report.readonly,
    safetyMode: report.safetyMode,
    registeredWorkers: report.registeredWorkers.map((worker) => ({
      workerId: worker.workerId,
      capabilities: worker.capabilities,
      concurrencyLimit: worker.concurrencyLimit,
      healthStatus: worker.healthStatus,
      activeExecutions: worker.activeExecutions,
      assignedCount: worker.assignedCount
    })),
    executionLifecycle: report.executionResults.map((result) => ({
      workflowId: result.workflowId,
      executionId: result.executionId,
      workerId: result.workerId,
      status: result.status,
      attempt: result.attempt,
      correlationId: result.correlationId
    })),
    heartbeat: {
      unhealthyWorkers: report.health.unhealthyWorkers.map((worker) => worker.workerId),
      staleWorkersExcluded: report.fallback.unhealthyWorkersAvoided
    },
    leases: report.leases.map((lease) => ({
      leaseId: lease.leaseId,
      workflowId: lease.workflowId,
      workerId: lease.workerId,
      status: lease.status,
      expiresAt: lease.expiresAt
    })),
    retryItems: report.retryItems,
    protectedQueue: report.protectedQueue,
    rebalances: report.rebalances,
    sandbox: {
      enabled: report.sandbox.enabled,
      reports: report.sandbox.reports.map((sandboxReport) => ({
        sandboxReportId: sandboxReport.sandboxReportId,
        workflowId: sandboxReport.workflowId,
        status: sandboxReport.status,
        policyViolations: sandboxReport.policyViolations,
        timedOut: sandboxReport.timedOut
      })),
      policyViolations: report.sandbox.policyViolations.length
    },
    publishedEvents: report.publishedEvents.map((event) => ({
      eventId: event.eventId,
      type: event.type,
      workflowId: event.workflowId,
      correlationId: event.correlationId
    })),
    pluginHooksExecuted: report.plugins.hookExecutions.length,
    invalidPluginsBlocked: report.fallback.invalidPluginsBlocked,
    connectorExecutions: report.connectors.capabilityExecutions.map((execution) => ({
      capability: execution.capability,
      connectorCount: execution.connectorCount,
      fallbackUsed: Boolean(execution.fallback)
    })),
    fallback: report.fallback,
    persistence: report.persistence
  }, null, 2));

  if (report.status !== "worker_runtime_demo_passed") {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(JSON.stringify({
      status: "failed",
      error: error.message,
      fallback: {
        safeMode: true,
        reason: "worker-runtime-demo-error"
      }
    }, null, 2));
    process.exitCode = 1;
  });
}
