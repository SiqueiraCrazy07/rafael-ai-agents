const { MultiWorkerOrchestrator } = require("./multi-worker-orchestrator");

function summarize(report, persistence) {
  return {
    orchestrationReportId: report.orchestrationReportId,
    status: report.status,
    workersRegistered: report.workers.map((worker) => ({
      workerId: worker.workerId,
      capabilities: worker.capabilities,
      concurrencyLimit: worker.concurrencyLimit,
      enabled: worker.enabled,
      healthStatus: worker.healthStatus,
      assignedCount: worker.assignedCount
    })),
    distribution: {
      assignments: report.distribution.assignments,
      protectedQueueCount: report.distribution.protectedQueue.length,
      waitingCount: report.distribution.waiting.length
    },
    leases: {
      created: report.leaseEvents.created.map((lease) => ({
        leaseId: lease.leaseId,
        workerId: lease.workerId,
        workflow: lease.workflow,
        status: lease.status,
        expiresAt: lease.expiresAt
      })),
      expired: report.leaseEvents.expired.map((lease) => lease.leaseId),
      orphans: report.leaseEvents.orphans.map((orphan) => ({
        leaseId: orphan.leaseId,
        workflow: orphan.workflow,
        reason: orphan.reason
      }))
    },
    rebalance: {
      overloadedWorkers: report.rebalance.overloadedWorkers,
      rebalances: report.rebalance.rebalances
    },
    events: report.events.map((event) => ({
      eventId: event.eventId,
      type: event.type,
      workflowId: event.workflowId
    })),
    executionResults: report.executionResults.map((result) => ({
      executionId: result.executionId,
      workflow: result.workflow,
      workerId: result.workerId,
      status: result.status,
      attempts: result.attempts
    })),
    health: {
      unhealthyWorkers: report.health.unhealthyWorkers.map((worker) => worker.workerId)
    },
    database: report.database,
    fallback: report.fallback,
    persistence
  };
}

function runOrchestrationDemo() {
  const orchestrator = new MultiWorkerOrchestrator();
  const report = orchestrator.run();
  const persistence = orchestrator.persist(report);
  console.log(JSON.stringify(summarize(report, persistence), null, 2));
}

if (require.main === module) {
  runOrchestrationDemo();
}

module.exports = {
  runOrchestrationDemo,
  summarize
};
