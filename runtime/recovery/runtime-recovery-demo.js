const { SelfHealingOrchestrator } = require("./self-healing/self-healing-orchestrator");

function runRuntimeRecoveryDemo() {
  const orchestrator = new SelfHealingOrchestrator();
  const report = orchestrator.run();
  const persistence = orchestrator.persist(report);

  console.log(
    JSON.stringify(
      {
        recoveryId: report.recoveryId,
        scenario: report.scenario,
        staleWorkersDetected: report.staleWorkers.map((worker) => ({
          workerId: worker.workerId,
          lastSeenAt: worker.lastSeenAt,
          staleForMs: worker.staleForMs,
          reason: worker.reason
        })),
        expiredLeases: report.expiredLeases.map((lease) => ({
          leaseId: lease.leaseId,
          queueId: lease.queueId,
          workerId: lease.workerId,
          status: lease.status
        })),
        leaseRecoveries: report.leaseRecoveries.map((recovery) => ({
          queueId: recovery.queueId,
          workflow: recovery.workflow,
          status: recovery.status,
          lockReleased: recovery.lockReleased
        })),
        requeueResults: report.requeueResults.map((result) => ({
          originalQueueId: result.originalQueueId,
          requeuedQueueId: result.requeuedQueueId,
          workflow: result.workflow,
          status: result.status
        })),
        executionResults: report.executionResults.map((result) => ({
          queueId: result.queueId,
          workflow: result.workflow,
          workerId: result.workerId,
          status: result.status,
          duplicateBlocked: result.duplicateBlocked
        })),
        metrics: report.metrics,
        persistence
      },
      null,
      2
    )
  );
}

runRuntimeRecoveryDemo();
