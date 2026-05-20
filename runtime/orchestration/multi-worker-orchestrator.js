const fs = require("node:fs");
const path = require("node:path");
const { createDatabaseContext } = require("../../database/seed/seed-filesystem-db");
const { RuntimeDecisionEngine } = require("../decision-engine/runtime-decision-engine");
const { EVENT_TYPES, RuntimeEventBus } = require("../event-bus/runtime-event-bus");
const { WorkflowStateMachine, WORKFLOW_STATES } = require("../state-machine/workflow-state-machine");
const { WorkerExecutor } = require("../workers/worker-executor");
const { WorkerHealthMonitor } = require("../workers/worker-health-monitor");
const { WorkerRegistry } = require("../workers/worker-registry");
const { OrchestrationLeaseManager } = require("./worker-lease-manager");
const { WorkerLoadBalancer } = require("./worker-load-balancer");
const { WorkerRebalanceEngine } = require("./worker-rebalance-engine");

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

function buildDemoQueueItems() {
  return [
    {
      queueId: `orch_queue_${Date.now()}_1`,
      executionId: `orch_exec_${Date.now()}_1`,
      project: "platform",
      workflow: "orchestration-cache-build",
      priority: "p1",
      protectedQueue: false,
      attempts: 0,
      maxRetries: 1,
      payload: {
        capabilities: ["backend", "cache"]
      }
    },
    {
      queueId: `orch_queue_${Date.now()}_2`,
      executionId: `orch_exec_${Date.now()}_2`,
      project: "platform",
      workflow: "orchestration-validation",
      priority: "p1",
      protectedQueue: false,
      attempts: 0,
      maxRetries: 1,
      payload: {
        capabilities: ["qa", "validation"],
        failUntilAttempt: 1
      }
    },
    {
      queueId: `orch_queue_${Date.now()}_3`,
      executionId: `orch_exec_${Date.now()}_3`,
      project: "platform",
      workflow: "orchestration-rebalance-candidate",
      priority: "p2",
      protectedQueue: false,
      attempts: 0,
      maxRetries: 0,
      payload: {
        capabilities: ["backend"]
      }
    },
    {
      queueId: `orch_queue_${Date.now()}_4`,
      executionId: `orch_exec_${Date.now()}_4`,
      project: "platform",
      workflow: "orchestration-protected-demo",
      priority: "p0",
      protectedQueue: true,
      attempts: 0,
      maxRetries: 0,
      gatedReason: "protected queue awareness demo",
      payload: {
        capabilities: ["backend"],
        requiresHumanGate: true
      }
    }
  ];
}

class MultiWorkerOrchestrator {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.registry = options.registry || new WorkerRegistry();
    this.eventBus = options.eventBus || new RuntimeEventBus({ rootDir: this.rootDir });
    this.leaseManager = options.leaseManager || new OrchestrationLeaseManager({ defaultTtlMs: 60000 });
    this.loadBalancer = options.loadBalancer || new WorkerLoadBalancer(options.loadBalancerOptions || {});
    this.rebalanceEngine = options.rebalanceEngine || new WorkerRebalanceEngine({ saturationThreshold: 1 });
    this.executor = options.executor || new WorkerExecutor({ maxRetries: 1, timeoutMs: 1000 });
    this.healthMonitor = options.healthMonitor || new WorkerHealthMonitor();
    this.decisionEngine = options.decisionEngine || new RuntimeDecisionEngine(this.rootDir);
    this.database = options.database || createDatabaseContext();
  }

  registerWorkers() {
    this.registry.register({
      workerId: "orchestrator-backend-1",
      name: "Orchestrator Backend 1",
      capabilities: ["backend", "cache"],
      concurrencyLimit: 1,
      readonly: true,
      enabled: true
    });
    this.registry.register({
      workerId: "orchestrator-backend-2",
      name: "Orchestrator Backend 2",
      capabilities: ["backend", "cache"],
      concurrencyLimit: 2,
      readonly: true,
      enabled: true
    });
    this.registry.register({
      workerId: "orchestrator-qa-1",
      name: "Orchestrator QA 1",
      capabilities: ["qa", "validation"],
      concurrencyLimit: 1,
      readonly: true,
      enabled: true
    });
    this.registry.register({
      workerId: "orchestrator-unhealthy-1",
      name: "Orchestrator Unhealthy",
      capabilities: ["backend", "qa"],
      concurrencyLimit: 2,
      readonly: true,
      enabled: false,
      healthStatus: "unhealthy"
    });
    this.registry.markUnavailable("orchestrator-unhealthy-1", "orchestration-demo-unhealthy");
    return this.registry.list();
  }

  run(options = {}) {
    this.registerWorkers();
    const queueItems = options.queueItems || buildDemoQueueItems();
    const correlationId = `orchestration_${Date.now()}`;
    const workers = this.registry.list().map((worker) => ({
      ...worker,
      assignedCount: worker.workerId === "orchestrator-backend-1" ? 1 : 0
    }));
    const distribution = this.loadBalancer.distribute(queueItems, workers);
    const rebalance = this.rebalanceEngine.rebalance(distribution.assignments, workers);
    const events = [];
    const leases = [];
    const executionResults = [];
    const transitions = [];

    for (const unhealthy of workers.filter((worker) => worker.healthStatus === "unhealthy" || worker.enabled === false)) {
      events.push(this.publish({
        type: EVENT_TYPES.WORKER_UNHEALTHY,
        workflowId: "multi-worker-orchestration",
        correlationId,
        payload: {
          workerId: unhealthy.workerId,
          reason: unhealthy.unavailableReason || "worker-unhealthy"
        }
      }));
    }

    for (const overloaded of rebalance.overloadedWorkers) {
      events.push(this.publish({
        type: EVENT_TYPES.WORKER_OVERLOADED,
        workflowId: "multi-worker-orchestration",
        correlationId,
        payload: overloaded
      }));
    }

    for (const moved of rebalance.rebalances) {
      events.push(this.publish({
        type: EVENT_TYPES.WORKFLOW_REBALANCED,
        workflowId: moved.workflow,
        correlationId,
        payload: moved
      }));
    }

    for (const assignment of distribution.assignments) {
      const leaseResult = this.leaseManager.createLease(assignment.worker, assignment.queueItem);
      if (!leaseResult.created) {
        continue;
      }

      leases.push(leaseResult.lease);
      events.push(this.publish({
        type: EVENT_TYPES.WORKER_LEASE_CREATED,
        workflowId: assignment.queueItem.workflow,
        correlationId,
        payload: {
          leaseId: leaseResult.lease.leaseId,
          workerId: assignment.worker.workerId,
          queueId: assignment.queueItem.queueId
        }
      }));

      const result = this.executor.execute(assignment.worker, assignment.queueItem, { correlationId });
      executionResults.push(result);
      this.leaseManager.releaseLease(leaseResult.lease.leaseId, result.status);

      const machine = new WorkflowStateMachine({
        workflow: assignment.queueItem.workflow,
        project: assignment.queueItem.project
      });
      machine.transition(WORKFLOW_STATES.QUEUED, {
        reason: "orchestrator assigned workflow to worker lease",
        safetyMode: "orchestration-readonly",
        source: "multi-worker-orchestrator",
        evidence: {
          leaseId: leaseResult.lease.leaseId,
          workerId: assignment.worker.workerId
        }
      });
      const finalTransition = machine.transition(
        result.status === "completed" ? WORKFLOW_STATES.COMPLETED : WORKFLOW_STATES.FAILED,
        {
          reason: result.status === "completed" ? "orchestrated worker completed" : "orchestrated worker failed",
          safetyMode: "orchestration-readonly",
          source: "multi-worker-orchestrator",
          evidence: result
        }
      );
      transitions.push(finalTransition.event);
    }

    const expiredLease = this.leaseManager.createLease(
      { workerId: "orchestrator-expired-worker" },
      {
        queueId: "orch_queue_expired",
        executionId: "orch_exec_expired",
        workflow: "orchestration-expired-lease-demo",
        project: "platform"
      },
      {
        now: new Date(Date.now() - 120000),
        ttlMs: 1000
      }
    );
    if (expiredLease.created) {
      leases.push(expiredLease.lease);
    }
    const expiredLeases = this.leaseManager.expireLeases(new Date());
    for (const expired of expiredLeases) {
      events.push(this.publish({
        type: EVENT_TYPES.WORKER_LEASE_EXPIRED,
        workflowId: expired.workflow,
        correlationId,
        payload: expired
      }));
    }
    const orphanLease = this.leaseManager.createLease(
      { workerId: "orchestrator-orphan-worker" },
      {
        queueId: "orch_queue_orphan",
        executionId: "orch_exec_orphan",
        workflow: "orchestration-orphan-demo",
        project: "platform"
      }
    );
    if (orphanLease.created) {
      leases.push(orphanLease.lease);
    }
    const orphanExecutions = this.leaseManager.detectOrphans(executionResults);
    const health = this.healthMonitor.evaluate(workers, executionResults);
    const decisionReport = this.decisionEngine.evaluate();
    const report = {
      orchestrationReportId: `orchestration_report_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      status: "multi_worker_orchestration_executed",
      workers,
      queueItems,
      distribution: {
        assignments: distribution.assignments.map((assignment) => ({
          workflow: assignment.queueItem.workflow,
          queueId: assignment.queueItem.queueId,
          workerId: assignment.worker.workerId
        })),
        protectedQueue: distribution.protectedQueue,
        waiting: distribution.waiting
      },
      rebalance,
      leases: this.leaseManager.list(),
      leaseEvents: {
        created: leases,
        expired: expiredLeases,
        orphans: orphanExecutions
      },
      executionResults,
      transitions,
      events: events.map((publication) => ({
        eventId: publication.event.eventId,
        type: publication.event.type,
        workflowId: publication.event.workflowId,
        persistence: publication.persistence
      })),
      decisions: {
        decisionReportId: decisionReport.decisionReportId,
        generated: decisionReport.decisions.length
      },
      health,
      database: this.persistDatabaseMirror({ leases, executionResults, rebalance }),
      fallback: {
        safeMode: true,
        simulatedExecutionOnly: true,
        destructiveActions: false,
        protectedQueueNotMoved: distribution.protectedQueue.length > 0,
        unhealthyWorkersAvoided: workers.filter((worker) => worker.healthStatus === "unhealthy" || worker.enabled === false).map((worker) => worker.workerId)
      }
    };
    return report;
  }

  publish(eventInput) {
    return this.eventBus.publish({
      source: "multi-worker-orchestrator",
      project: "platform",
      safetyMode: "orchestration-readonly",
      ...eventInput
    });
  }

  persistDatabaseMirror({ leases, executionResults, rebalance }) {
    const adapter = this.database.adapter;
    const writes = [];
    for (const lease of leases) {
      const result = adapter.upsert("worker_leases", {
        leaseId: lease.leaseId,
        workerId: lease.workerId,
        workflowId: lease.workflow,
        status: lease.status,
        timestamp: lease.createdAt,
        payload: lease
      });
      writes.push({ collection: "worker_leases", operation: result.operation, idempotencyKey: result.idempotencyKey });
    }
    for (const execution of executionResults) {
      const result = adapter.upsert("worker_executions", {
        executionId: execution.executionId,
        workerId: execution.workerId,
        workflowId: execution.workflow,
        status: execution.status,
        timestamp: execution.completedAt,
        payload: execution
      });
      writes.push({ collection: "worker_executions", operation: result.operation, idempotencyKey: result.idempotencyKey });
    }
    for (const moved of rebalance.rebalances) {
      const result = adapter.upsert("worker_rebalances", {
        rebalanceId: `${moved.queueId}:${moved.fromWorkerId}:${moved.toWorkerId}`,
        workflowId: moved.workflow,
        timestamp: new Date().toISOString(),
        payload: moved
      });
      writes.push({ collection: "worker_rebalances", operation: result.operation, idempotencyKey: result.idempotencyKey });
    }
    return {
      adapter: adapter.health(),
      writes
    };
  }

  persist(report) {
    const runtimeDir = path.join(this.rootDir, "runtime-data", "orchestration");
    const memoryDir = path.join(this.rootDir, "memory", "orchestration");
    ensureDirectory(runtimeDir);
    ensureDirectory(memoryDir);
    const filename = `orchestration-${timestampForFile(new Date(report.generatedAt))}.json`;
    const runtimePath = path.join(runtimeDir, filename);
    const memoryPath = path.join(memoryDir, filename);
    fs.writeFileSync(runtimePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(memoryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    return { runtimePath, memoryPath };
  }
}

module.exports = {
  MultiWorkerOrchestrator,
  buildDemoQueueItems
};
