const { DistributedExecutionSimulator } = require("../distribution/distributed-execution-simulator");

function runRuntimeQueueDemo() {
  const simulator = new DistributedExecutionSimulator();
  const report = simulator.run();
  const persistence = simulator.persist(report);

  console.log(
    JSON.stringify(
      {
        simulationId: report.simulationId,
        policySource: report.policySource,
        metrics: report.metrics,
        optimizationEnforcement: report.optimizationEnforcement,
        distribution: report.results.map((result) => ({
          workflow: result.workflow,
          status: result.status,
          workerId: result.workerId || null,
          attempts: result.attempts ?? null,
          reason: result.reason || result.error || null,
          policyThrottle: result.policyThrottle || false
        })),
        retryQueue: report.retryItems.map((item) => ({
          workflow: item.workflow,
          attempts: item.attempts,
          status: item.status,
          lastError: item.lastError
        })),
        protectedQueue: report.protectedQueue,
        workers: report.workers.map((worker) => ({
          workerId: worker.workerId,
          capabilities: worker.capabilities,
          capacity: worker.capacity,
          status: worker.status,
          unavailableReason: worker.unavailableReason || null
        })),
        heartbeat: {
          activeWorkers: report.heartbeats.filter((heartbeat) => heartbeat.status === "active").length,
          registered: report.heartbeats.map((heartbeat) => ({
            workerId: heartbeat.workerId,
            status: heartbeat.status,
            lastSeenAt: heartbeat.lastSeenAt,
            running: heartbeat.running,
            capacity: heartbeat.capacity,
            capabilities: heartbeat.capabilities
          }))
        },
        leases: {
          reserved: report.leaseEvents.filter((event) => event.type === "lease_reserved").length,
          expiredDetected: report.expiredLeases.map((lease) => ({
            leaseId: lease.leaseId,
            queueId: lease.queueId,
            workerId: lease.workerId,
            status: lease.status
          }))
        },
        locks: {
          acquired: report.lockEvents.length,
          duplicateAttemptsBlocked: report.duplicateAttempts.length,
          released: report.locks.filter((lock) => lock.status === "released").length
        },
        persistence
      },
      null,
      2
    )
  );
}

runRuntimeQueueDemo();
