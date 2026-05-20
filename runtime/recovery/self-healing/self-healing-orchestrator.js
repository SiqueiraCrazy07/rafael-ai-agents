const fs = require("node:fs");
const path = require("node:path");

const { QueueTelemetry } = require("../../queue/queue-telemetry");
const { RuntimeQueueManager } = require("../../queue/queue-manager");
const { WorkerHeartbeatManager } = require("../../workers/heartbeat/worker-heartbeat-manager");
const { QueueLockManager } = require("../../workers/locks/queue-lock-manager");
const { WorkerLeaseManager } = require("../../workers/leases/worker-lease-manager");
const { WorkerExecutionSimulator } = require("../../workers/worker-execution-simulator");
const { WorkerRegistry } = require("../../workers/worker-registry");
const { ExecutionRecoveryEngine } = require("../executions/execution-recovery-engine");
const { LeaseExpirationRecovery } = require("../leases/lease-expiration-recovery");
const { AutomaticRequeueEngine } = require("../queue/automatic-requeue-engine");
const { QueueHealingEngine } = require("../queue/queue-healing-engine");
const { RetryRecoveryCoordinator } = require("../queue/retry-recovery-coordinator");
const { RuntimeRecoveryPolicies } = require("./runtime-recovery-policies");
const { StaleWorkerDetector } = require("../workers/stale-worker-detector");

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

class SelfHealingOrchestrator {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.telemetry = new QueueTelemetry();
    this.queueManager = new RuntimeQueueManager({ telemetry: this.telemetry });
    this.workerRegistry = new WorkerRegistry();
    this.heartbeatManager = new WorkerHeartbeatManager({ rootDir: this.rootDir });
    this.leaseManager = new WorkerLeaseManager({ rootDir: this.rootDir, leaseTtlMs: 5000 });
    this.lockManager = new QueueLockManager({ rootDir: this.rootDir });
    this.workerSimulator = new WorkerExecutionSimulator();
    this.staleDetector = new StaleWorkerDetector({ staleAfterMs: 30000 });
    this.policies = new RuntimeRecoveryPolicies();
    this.queueItemsByQueueId = new Map();
  }

  seedScenario() {
    const staleWorker = this.workerRegistry.register({
      workerId: "worker-stale-runtime-1",
      name: "Stale Runtime Worker",
      capabilities: ["backend", "cache", "ofertas"],
      capacity: 1,
      status: "active"
    });
    const healthyWorker = this.workerRegistry.register({
      workerId: "worker-recovery-backend-1",
      name: "Recovery Backend Worker",
      capabilities: ["backend", "cache", "ofertas"],
      capacity: 1,
      status: "active"
    });

    this.heartbeatManager.record(staleWorker, { now: new Date(Date.now() - 120000) });
    this.heartbeatManager.record(healthyWorker);

    const stuckItem = this.queueManager.enqueue({
      project: "promoclub007",
      workflow: "offers-publish",
      objective: "Recover a stuck distributed publish execution.",
      priority: "p0",
      criticidade: "high",
      payload: {
        capabilities: ["backend", "cache", "ofertas"],
        maxRetries: 2
      }
    });
    this.queueItemsByQueueId.set(stuckItem.queueId, stuckItem);

    const dequeued = this.queueManager.dequeue();
    const lease = this.leaseManager.reserve(dequeued, staleWorker, {
      now: new Date(Date.now() - 120000),
      ttlMs: 1000
    });
    const lock = this.lockManager.acquire(dequeued, staleWorker);
    const duplicateAttempt = this.lockManager.acquire(dequeued, {
      workerId: "duplicate-before-recovery"
    });

    return {
      staleWorker,
      healthyWorker,
      stuckItem: dequeued,
      lease,
      lock: lock.lock,
      duplicateAttemptBlocked: !duplicateAttempt.acquired
    };
  }

  run() {
    const scenario = this.seedScenario();
    const now = new Date();
    const staleWorkers = this.staleDetector.detect(this.heartbeatManager.list(), now);
    for (const worker of staleWorkers) {
      this.workerRegistry.markUnavailable(worker.workerId, worker.reason);
    }
    const expiredLeases = this.leaseManager.detectExpired(now);

    const recoverableLeases = expiredLeases.filter((lease) => {
      const staleWorker = staleWorkers.find((worker) => worker.workerId === lease.workerId);
      return this.policies.canRecoverLease({ staleWorker, expiredLease: lease }).allowed;
    });

    const leaseRecovery = new LeaseExpirationRecovery({
      leaseManager: this.leaseManager,
      lockManager: this.lockManager
    });
    const leaseRecoveries = leaseRecovery.recover({
      expiredLeases: recoverableLeases,
      queueItemsByQueueId: this.queueItemsByQueueId
    });

    const requeueEngine = new AutomaticRequeueEngine({ queueManager: this.queueManager });
    const queueHealing = new QueueHealingEngine({ requeueEngine });
    const requeueResults = queueHealing.heal({
      leaseRecoveries,
      queueItemsByQueueId: this.queueItemsByQueueId
    });

    for (const result of requeueResults) {
      const original = this.queueItemsByQueueId.get(result.originalQueueId);
      const requeued = this.queueManager.list().find((item) => item.queueId === result.requeuedQueueId);
      if (original && requeued) {
        this.queueItemsByQueueId.set(requeued.queueId, requeued);
      }
    }

    const executionRecovery = new ExecutionRecoveryEngine({
      workerRegistry: this.workerRegistry,
      workerSimulator: this.workerSimulator,
      lockManager: this.lockManager,
      leaseManager: this.leaseManager,
      heartbeatManager: this.heartbeatManager
    });
    const executionResults = requeueResults.map(() => executionRecovery.execute(this.queueManager));

    const coordinator = new RetryRecoveryCoordinator();
    const coordination = coordinator.coordinate({ requeueResults, executionResults });
    const metrics = {
      generatedAt: new Date().toISOString(),
      staleWorkersDetected: staleWorkers.length,
      expiredLeasesDetected: expiredLeases.length,
      leasesRecovered: leaseRecoveries.length,
      itemsRequeued: requeueResults.length,
      workflowsReexecuted: executionResults.filter(Boolean).length,
      workflowsCompleted: executionResults.filter((result) => result?.status === "completed").length,
      duplicateAttemptsBlocked:
        Number(scenario.duplicateAttemptBlocked) +
        executionResults.filter((result) => result?.duplicateBlocked).length,
      locksReleased: this.lockManager.list().filter((lock) => lock.status === "released").length,
      heartbeatsRegistered: this.heartbeatManager.list().length
    };

    return {
      recoveryId: `runtime_recovery_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      scenario: {
        stuckQueueId: scenario.stuckItem.queueId,
        staleWorkerId: scenario.staleWorker.workerId,
        healthyWorkerId: scenario.healthyWorker.workerId,
        duplicateAttemptBlockedBeforeRecovery: scenario.duplicateAttemptBlocked
      },
      staleWorkers,
      expiredLeases,
      leaseRecoveries,
      requeueResults,
      executionResults,
      coordination,
      metrics,
      heartbeats: this.heartbeatManager.list(),
      leases: this.leaseManager.list(),
      locks: this.lockManager.list(),
      telemetryEvents: this.telemetry.events
    };
  }

  persist(report) {
    const runtimeDir = path.join(this.rootDir, "runtime-data", "recovery");
    const memoryDir = path.join(this.rootDir, "memory", "recovery");
    ensureDirectory(runtimeDir);
    ensureDirectory(memoryDir);

    const filename = `runtime-recovery-${timestampForFile()}.json`;
    const runtimePath = path.join(runtimeDir, filename);
    const memoryPath = path.join(memoryDir, filename);

    fs.writeFileSync(runtimePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(memoryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

    return {
      runtimePath,
      memoryPath
    };
  }
}

module.exports = {
  SelfHealingOrchestrator
};
