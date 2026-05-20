const fs = require("node:fs");
const path = require("node:path");

const { ConcurrencyController } = require("../concurrency/concurrency-controller");
const { CapacityController } = require("../concurrency/capacity-controller");
const { writeEnforcementIntegrationReport } = require("../optimization/enforcement/enforcement-integration-writer");
const { OptimizationEnforcementReader } = require("../optimization/enforcement/optimization-enforcement-reader");
const { RuntimeQueueManager } = require("../queue/queue-manager");
const { QueueTelemetry } = require("../queue/queue-telemetry");
const { WorkerHeartbeatManager } = require("../workers/heartbeat/worker-heartbeat-manager");
const { QueueLockManager } = require("../workers/locks/queue-lock-manager");
const { WorkerLeaseManager } = require("../workers/leases/worker-lease-manager");
const { WorkerExecutionSimulator } = require("../workers/worker-execution-simulator");
const { WorkerRegistry } = require("../workers/worker-registry");

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

function readJsonFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const fullPath = path.join(directory, file);
      return {
        path: fullPath,
        mtimeMs: fs.statSync(fullPath).mtimeMs,
        data: JSON.parse(fs.readFileSync(fullPath, "utf8"))
      };
    });
}

function readLatestPolicy(rootDir) {
  const policies = readJsonFiles(path.join(rootDir, "runtime-data", "policies")).sort(
    (left, right) => right.mtimeMs - left.mtimeMs
  );
  return policies[0]?.data || null;
}

class DistributedExecutionSimulator {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.policyDecision = options.policyDecision || readLatestPolicy(this.rootDir);
    this.optimizationEnforcement =
      options.optimizationEnforcement || new OptimizationEnforcementReader(this.rootDir).readLatest();
    this.telemetry = new QueueTelemetry();
    this.queueManager = new RuntimeQueueManager({ telemetry: this.telemetry });
    this.workerRegistry = new WorkerRegistry();
    this.heartbeatManager = new WorkerHeartbeatManager({ rootDir: this.rootDir });
    this.leaseManager = new WorkerLeaseManager({ rootDir: this.rootDir });
    this.lockManager = new QueueLockManager({ rootDir: this.rootDir });
    this.workerSimulator = new WorkerExecutionSimulator();
    this.capacity = new CapacityController({
      baseCapacity: options.baseCapacity || 3,
      policyDecision: this.policyDecision
    }).calculate();
    if (this.optimizationEnforcement.available && this.optimizationEnforcement.maxConcurrentExecutions) {
      this.capacity = {
        ...this.capacity,
        maxConcurrentExecutions: this.optimizationEnforcement.maxConcurrentExecutions,
        mode: this.optimizationEnforcement.throttlingMode || this.capacity.mode,
        reason: `optimization-enforcement:${this.optimizationEnforcement.enforcementId}`
      };
    }
    this.concurrency = new ConcurrencyController({
      maxConcurrentExecutions: this.capacity.maxConcurrentExecutions
    });
  }

  registerDefaultWorkers() {
    this.workerRegistry.register({
      workerId: "worker-site-frontend-1",
      name: "Site Frontend Worker",
      capabilities: ["frontend", "cache", "qa"],
      capacity: 1
    });
    this.workerRegistry.register({
      workerId: "worker-site-backend-1",
      name: "Site Backend Worker",
      capabilities: ["backend", "automation", "cache", "ofertas"],
      capacity: 1
    });
    this.workerRegistry.register({
      workerId: "worker-qa-1",
      name: "QA Worker",
      capabilities: ["qa", "validation"],
      capacity: 1
    });

    for (const workerId of this.optimizationEnforcement.workersToAvoid || []) {
      this.workerRegistry.markUnavailable(workerId, "optimization-enforcement-worker-avoidance");
    }

    for (const worker of this.workerRegistry.list()) {
      this.heartbeatManager.record(worker);
    }
  }

  applyOptimizationToRequest(item) {
    const retryOverride = this.optimizationEnforcement.retryStrategy?.workflows?.[item.workflow];
    const defaultRetry = this.optimizationEnforcement.retryStrategy?.defaultStrategy;
    const gatedPriority = (this.optimizationEnforcement.gatedPriorities || []).find(
      (priority) => priority.workflow === item.workflow
    );
    const next = {
      ...item,
      payload: { ...item.payload }
    };

    if (retryOverride) {
      next.payload.maxRetries = retryOverride.recommendedMaxRetries;
      next.payload.retryBackoff = retryOverride.backoff;
      next.payload.retryOptimizationReason = retryOverride.reason;
    } else if (defaultRetry) {
      next.payload.maxRetries = defaultRetry.maxRetries;
      next.payload.retryBackoff = defaultRetry.backoff;
    }

    if (gatedPriority) {
      next.priority = "p0";
      next.protectedQueue = true;
      next.gatedPriority = gatedPriority.recommendedPriority;
      next.gatedReason = gatedPriority.reason;
      next.payload.requiresHumanGate = true;
    }

    return next;
  }

  seedDemoExecutions() {
    const items = [
      {
        project: "promoclub007",
        workflow: "offers-publish",
        objective: "Publish normalized offers cache.",
        priority: "p0",
        criticidade: "high",
        payload: {
          capabilities: ["backend", "cache", "ofertas"],
          maxRetries: 2
        }
      },
      {
        project: "promoclub007",
        workflow: "site-qa-validation",
        objective: "Validate storefront output before deploy.",
        priority: "p1",
        criticidade: "medium",
        payload: {
          capabilities: ["qa", "validation"],
          maxRetries: 2,
          failUntilAttempt: 1
        }
      },
      {
        project: "promoclub007",
        workflow: "runtime-v1-demo",
        objective: "Runtime demo execution subject to policy controls.",
        priority: "p2",
        criticidade: "medium",
        payload: {
          capabilities: ["backend", "qa"],
          maxRetries: 1
        }
      },
      {
        project: "promoclub007",
        workflow: "runtime-v1-rollback-demo",
        objective: "Rollback demo execution subject to policy controls.",
        priority: "p1",
        criticidade: "high",
        payload: {
          capabilities: ["backend", "qa"],
          maxRetries: 0
        }
      },
      {
        project: "promoclub007",
        workflow: "frontend-cache-sync",
        objective: "Prepare frontend cache sync.",
        priority: "p3",
        criticidade: "low",
        payload: {
          capabilities: ["frontend", "cache"],
          maxRetries: 2
        }
      }
    ];

    return items.map((item) => this.queueManager.enqueue(this.applyOptimizationToRequest(item)));
  }

  run() {
    this.registerDefaultWorkers();
    this.seedDemoExecutions();

    const results = [];
    const leaseEvents = [];
    const lockEvents = [];
    const duplicateAttempts = [];
    const protectedQueue = [];
    const blockedWorkflows = new Set(this.policyDecision?.blockedWorkflows || []);
    const throttledWorkflows = new Set(
      (this.policyDecision?.throttlingApplied || [])
        .filter((item) => item.target !== "platform")
        .map((item) => item.target)
    );

    let guard = 0;
    while (guard < 20) {
      guard += 1;
      const item = this.queueManager.dequeue() || this.queueManager.dequeueRetry();
      if (!item) {
        break;
      }

      if (item.protectedQueue) {
        const protectedItem = {
          executionId: item.executionId,
          queueId: item.queueId,
          workflow: item.workflow,
          project: item.project,
          status: "protected_gated",
          priority: item.priority,
          gatedPriority: item.gatedPriority,
          reason: item.gatedReason,
          completedAt: new Date().toISOString()
        };
        protectedQueue.push(protectedItem);
        this.telemetry.record("queue_item_protected_gated", protectedItem);
        results.push(protectedItem);
        continue;
      }

      if (blockedWorkflows.has(item.workflow)) {
        const blocked = {
          executionId: item.executionId,
          queueId: item.queueId,
          workflow: item.workflow,
          project: item.project,
          status: "blocked",
          reason: "runtime policy blocked workflow",
          completedAt: new Date().toISOString()
        };
        this.telemetry.record("queue_item_blocked", blocked);
        results.push(blocked);
        continue;
      }

      if (!this.concurrency.start()) {
        const throttled = {
          executionId: item.executionId,
          queueId: item.queueId,
          workflow: item.workflow,
          project: item.project,
          status: "throttled",
          reason: "concurrency limit reached",
          completedAt: new Date().toISOString()
        };
        this.telemetry.record("queue_item_throttled", throttled);
        results.push(throttled);
        continue;
      }

      const worker = this.workerRegistry.findAvailable(item);
      if (!worker) {
        this.concurrency.finish();
        const waiting = {
          executionId: item.executionId,
          queueId: item.queueId,
          workflow: item.workflow,
          project: item.project,
          status: "waiting_worker",
          reason: "no compatible worker available",
          completedAt: new Date().toISOString()
        };
        this.telemetry.record("queue_item_waiting_worker", waiting);
        results.push(waiting);
        continue;
      }

      const lease = this.leaseManager.reserve(item, worker);
      leaseEvents.push({
        type: "lease_reserved",
        queueId: item.queueId,
        leaseId: lease.leaseId,
        workerId: worker.workerId,
        expiresAt: lease.expiresAt
      });
      this.telemetry.record("queue_item_lease_reserved", {
        queueId: item.queueId,
        leaseId: lease.leaseId,
        workerId: worker.workerId
      });

      const lockResult = this.lockManager.acquire(item, worker);
      if (!lockResult.acquired) {
        this.concurrency.finish();
        const duplicateBlocked = {
          executionId: item.executionId,
          queueId: item.queueId,
          workflow: item.workflow,
          project: item.project,
          status: "duplicate_blocked",
          reason: "queue item already locked",
          blockedBy: lockResult.blockedBy.lockId,
          completedAt: new Date().toISOString()
        };
        duplicateAttempts.push(duplicateBlocked);
        this.telemetry.record("queue_item_duplicate_blocked", duplicateBlocked);
        results.push(duplicateBlocked);
        continue;
      }

      lockEvents.push({
        type: "lock_acquired",
        queueId: item.queueId,
        lockId: lockResult.lock.lockId,
        workerId: worker.workerId
      });
      this.telemetry.record("queue_item_lock_acquired", {
        queueId: item.queueId,
        lockId: lockResult.lock.lockId,
        workerId: worker.workerId
      });

      const duplicateLockAttempt = this.lockManager.acquire(item, {
        workerId: "worker-duplicate-attempt"
      });
      if (!duplicateLockAttempt.acquired) {
        const duplicateBlocked = {
          queueId: item.queueId,
          workflow: item.workflow,
          status: "duplicate_blocked",
          blockedBy: duplicateLockAttempt.blockedBy.lockId,
          reason: "lock already held by active worker"
        };
        duplicateAttempts.push(duplicateBlocked);
        this.telemetry.record("queue_item_duplicate_blocked", duplicateBlocked);
      }

      const result = this.workerSimulator.run(worker, item);
      this.concurrency.finish();
      this.heartbeatManager.record(worker);

      if (throttledWorkflows.has(item.workflow)) {
        result.policyThrottle = true;
      }

      if (result.status === "failed" && item.attempts < item.maxRetries) {
        this.leaseManager.release(item.queueId, "failed_retry_queued");
        this.lockManager.release(item, "failed_retry_queued");
        this.queueManager.enqueueRetry(item, result.error);
        results.push(result);
        continue;
      }

      this.leaseManager.release(item.queueId, result.status);
      this.lockManager.release(item, result.status);
      this.telemetry.record("queue_item_executed", {
        executionId: result.executionId,
        workflow: result.workflow,
        workerId: result.workerId,
        status: result.status
      });
      results.push(result);
    }

    const staleLeaseItem = {
      queueId: "queue_expired_lease_demo",
      executionId: "dist_exec_expired_lease_demo",
      workflow: "expired-lease-demo",
      project: "promoclub007"
    };
    const staleWorker = { workerId: "worker-stale-demo" };
    const staleLease = this.leaseManager.reserve(staleLeaseItem, staleWorker, {
      now: new Date(Date.now() - 120000),
      ttlMs: 1000
    });
    leaseEvents.push({
      type: "lease_reserved_for_expiration_demo",
      queueId: staleLease.queueId,
      leaseId: staleLease.leaseId,
      workerId: staleLease.workerId,
      expiresAt: staleLease.expiresAt
    });
    const expiredLeases = this.leaseManager.detectExpired(new Date());
    for (const expiredLease of expiredLeases) {
      this.telemetry.record("queue_item_lease_expired", {
        queueId: expiredLease.queueId,
        leaseId: expiredLease.leaseId,
        workerId: expiredLease.workerId
      });
    }

    const queueItems = this.queueManager.list();
    const retryItems = this.queueManager.listRetries();
    const workers = this.workerRegistry.list();
    const metrics = this.telemetry.metrics({
      queueItems,
      retryItems,
      results,
      workers,
      throttling: this.capacity
    });

    return {
      simulationId: `queue_sim_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      policySource: this.policyDecision?.decisionId || null,
      optimizationEnforcement: {
        available: this.optimizationEnforcement.available,
        enforcementId: this.optimizationEnforcement.enforcementId,
        workersToAvoid: this.optimizationEnforcement.workersToAvoid,
        maxConcurrentExecutions: this.optimizationEnforcement.maxConcurrentExecutions,
        throttlingMode: this.optimizationEnforcement.throttlingMode,
        gatedPriorities: this.optimizationEnforcement.gatedPriorities,
        retryStrategy: this.optimizationEnforcement.retryStrategy
      },
      queueItems,
      retryItems,
      protectedQueue,
      workers,
      heartbeats: this.heartbeatManager.list(),
      leases: this.leaseManager.list(),
      locks: this.lockManager.list(),
      leaseEvents,
      lockEvents,
      duplicateAttempts,
      expiredLeases,
      results,
      metrics,
      telemetryEvents: this.telemetry.events
    };
  }

  persist(report) {
    const runtimeDir = path.join(this.rootDir, "runtime-data", "queue");
    const memoryDir = path.join(this.rootDir, "memory", "queue");
    ensureDirectory(runtimeDir);
    ensureDirectory(memoryDir);

    const filename = `queue-simulation-${timestampForFile()}.json`;
    const runtimePath = path.join(runtimeDir, filename);
    const memoryPath = path.join(memoryDir, filename);

    fs.writeFileSync(runtimePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(memoryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    const integrationPaths = writeEnforcementIntegrationReport("queue", {
      integrationId: `queue_enforcement_integration_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      source: report.optimizationEnforcement,
      effects: {
        maxConcurrentExecutions: report.metrics.throttling.maxConcurrentExecutions,
        throttlingMode: report.metrics.throttling.mode,
        avoidedWorkers: report.workers
          .filter((worker) => worker.status === "unavailable")
          .map((worker) => ({
            workerId: worker.workerId,
            reason: worker.unavailableReason
          })),
        protectedQueue: report.protectedQueue,
        retryStrategy: report.optimizationEnforcement.retryStrategy
      }
    }, this.rootDir);

    return {
      runtimePath,
      memoryPath,
      integrationPaths
    };
  }
}

module.exports = {
  DistributedExecutionSimulator
};
