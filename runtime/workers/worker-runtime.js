const fs = require("node:fs");
const path = require("node:path");
const { createDatabaseContext } = require("../../database/seed/seed-filesystem-db");
const { RuntimeDecisionEngine } = require("../decision-engine/runtime-decision-engine");
const { EVENT_TYPES, RuntimeEventBus } = require("../event-bus/runtime-event-bus");
const { StateTransitionCoordinator } = require("../state-machine/state-transition-coordinator");
const { WorkflowStateMachine, WORKFLOW_STATES } = require("../state-machine/workflow-state-machine");
const { RuntimeQueueManager } = require("../queue/queue-manager");
const { QueueTelemetry } = require("../queue/queue-telemetry");
const { WorkerExecutor } = require("./worker-executor");
const { WorkerHealthMonitor } = require("./worker-health-monitor");
const { WorkerRegistry } = require("./worker-registry");

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

function safeReadLatestJson(directory) {
  if (!fs.existsSync(directory)) {
    return {
      available: false,
      sourcePath: null,
      data: null,
      readErrors: []
    };
  }

  const readErrors = [];
  const files = fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const sourcePath = path.join(directory, file);
      return {
        sourcePath,
        mtimeMs: fs.statSync(sourcePath).mtimeMs
      };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs);

  for (const file of files) {
    try {
      return {
        available: true,
        sourcePath: file.sourcePath,
        data: JSON.parse(fs.readFileSync(file.sourcePath, "utf8")),
        readErrors
      };
    } catch (error) {
      readErrors.push({
        sourcePath: file.sourcePath,
        error: error.message
      });
    }
  }

  return {
    available: false,
    sourcePath: null,
    data: null,
    readErrors
  };
}

function demoQueueItems() {
  return [
    {
      queueId: `worker_queue_${Date.now()}_site`,
      executionId: `worker_exec_${Date.now()}_site`,
      project: "platform",
      workflow: "worker-runtime-site-cache-demo",
      objective: "Simulate readonly cache preparation.",
      priority: "p1",
      criticidade: "medium",
      attempts: 0,
      maxRetries: 1,
      payload: {
        capabilities: ["backend", "cache"],
        maxRetries: 1
      },
      status: "queued"
    },
    {
      queueId: `worker_queue_${Date.now()}_qa`,
      executionId: `worker_exec_${Date.now()}_qa`,
      project: "platform",
      workflow: "worker-runtime-qa-demo",
      objective: "Simulate readonly QA validation with retry.",
      priority: "p2",
      criticidade: "medium",
      attempts: 0,
      maxRetries: 1,
      payload: {
        capabilities: ["qa", "validation"],
        failUntilAttempt: 1,
        maxRetries: 1
      },
      status: "queued"
    },
    {
      queueId: `worker_queue_${Date.now()}_blocked`,
      executionId: `worker_exec_${Date.now()}_blocked`,
      project: "platform",
      workflow: "worker-runtime-unmatched-demo",
      objective: "Simulate missing capability fallback.",
      priority: "p3",
      criticidade: "low",
      attempts: 0,
      maxRetries: 0,
      payload: {
        capabilities: ["nonexistent-capability"],
        maxRetries: 0
      },
      status: "queued"
    }
  ];
}

class WorkerRuntime {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.telemetry = options.telemetry || new QueueTelemetry();
    this.queueManager = options.queueManager || new RuntimeQueueManager({ telemetry: this.telemetry });
    this.workerRegistry = options.workerRegistry || new WorkerRegistry();
    this.eventBus = options.eventBus || new RuntimeEventBus({ rootDir: this.rootDir });
    this.executor = options.executor || new WorkerExecutor(options.executorOptions || {});
    this.healthMonitor = options.healthMonitor || new WorkerHealthMonitor();
    this.decisionEngine = options.decisionEngine || new RuntimeDecisionEngine(this.rootDir);
    this.transitionCoordinator = options.transitionCoordinator || new StateTransitionCoordinator(this.rootDir, {
      eventBus: this.eventBus
    });
    this.database = options.database || createDatabaseContext();
  }

  registerDefaultWorkers() {
    const workers = [
      this.workerRegistry.register({
        workerId: "worker-runtime-backend-1",
        name: "Worker Runtime Backend",
        capabilities: ["backend", "cache", "automation"],
        concurrencyLimit: 1,
        readonly: true,
        enabled: true,
        healthStatus: "healthy"
      }),
      this.workerRegistry.register({
        workerId: "worker-runtime-qa-1",
        name: "Worker Runtime QA",
        capabilities: ["qa", "validation"],
        concurrencyLimit: 1,
        readonly: true,
        enabled: true,
        healthStatus: "healthy"
      }),
      this.workerRegistry.register({
        workerId: "worker-runtime-unhealthy-demo",
        name: "Worker Runtime Unhealthy Demo",
        capabilities: ["backend"],
        concurrencyLimit: 1,
        readonly: true,
        enabled: false,
        healthStatus: "unhealthy"
      })
    ];
    this.workerRegistry.markUnavailable("worker-runtime-unhealthy-demo", "disabled-for-unhealthy-demo");
    return workers;
  }

  loadQueueItems() {
    const source = safeReadLatestJson(path.join(this.rootDir, "memory", "queue"));
    const items = Array.isArray(source.data?.queueItems) ? source.data.queueItems : [];
  const runnable = items
      .filter((item) => item && item.workflow && item.status !== "completed")
      .slice(0, 2)
      .map((item, index) => ({
        ...item,
        queueId: `worker_source_clone_${Date.now()}_${index}`,
        executionId: `worker_source_exec_${Date.now()}_${index}`,
        project: "platform",
        objective: `Readonly worker runtime simulation cloned from queue report workflow ${item.workflow}.`,
        attempts: 0,
        maxRetries: index === 1 ? 1 : item.maxRetries ?? item.payload?.maxRetries ?? 1,
        payload: {
          ...(item.payload || {}),
          capabilities: index === 1 ? ["qa", "validation"] : item.payload?.capabilities || ["backend", "cache"],
          failUntilAttempt: index === 1 ? 1 : item.payload?.failUntilAttempt
        },
        status: "queued"
      }));

    if (runnable.length > 0) {
      return {
        source,
        items: [
          ...runnable,
          demoQueueItems()[2]
        ]
      };
    }

    return {
      source,
      items: demoQueueItems(),
      fallback: {
        safeMode: true,
        reason: source.available ? "latest-queue-report-has-no-runnable-items" : "memory-queue-unavailable"
      }
    };
  }

  seedQueue(items) {
    return items.map((item) =>
      this.queueManager.enqueue({
        project: item.project || "platform",
        workflow: item.workflow,
        objective: item.objective || "Worker Runtime V1 simulated workflow.",
        priority: item.priority || "p2",
        criticidade: item.criticidade || "medium",
        payload: item.payload || {}
      })
    );
  }

  run(options = {}) {
    const registeredWorkers = this.registerDefaultWorkers();
    const queueSource = this.loadQueueItems();
    const seededItems = this.seedQueue(options.queueItems || queueSource.items);
    const executionResults = [];
    const transitions = [];
    const blockedTransitions = [];
    const publishedEvents = [];
    const relatedDecisions = [];
    const correlationId = `worker_runtime_${Date.now()}`;

    this.publish(publishedEvents, {
      type: EVENT_TYPES.WORKFLOW_CREATED,
      workflowId: "worker-runtime-batch",
      correlationId,
      payload: {
        queuedItems: seededItems.length
      }
    });

    let guard = 0;
    while (guard < 20) {
      guard += 1;
      const item = this.queueManager.dequeue() || this.queueManager.dequeueRetry();
      if (!item) {
        break;
      }

      this.publish(publishedEvents, {
        type: EVENT_TYPES.WORKFLOW_QUEUED,
        workflowId: item.workflow,
        project: item.project,
        correlationId,
        payload: {
          queueId: item.queueId,
          priority: item.priority
        }
      });

      const worker = this.workerRegistry.findAvailable(item);
      const machine = new WorkflowStateMachine({
        workflow: item.workflow,
        project: item.project || "platform"
      });
      machine.transition(WORKFLOW_STATES.QUEUED, {
        reason: "worker runtime dequeued workflow for simulated execution",
        safetyMode: "worker-runtime-readonly",
        source: "worker-runtime",
        evidence: {
          queueId: item.queueId,
          correlationId
        }
      });

      if (!worker) {
        const result = this.executor.execute(null, item, { correlationId });
        executionResults.push(result);
        const blocked = machine.transition(WORKFLOW_STATES.BLOCKED, {
          reason: "no compatible worker available",
          safetyMode: "worker-runtime-fallback",
          source: "worker-runtime",
          evidence: result
        });
        blocked.accepted ? transitions.push(blocked.event) : blockedTransitions.push(blocked.event);
        relatedDecisions.push(this.createRelatedDecision("human-gate", "medium", item, result));
        continue;
      }

      const result = this.executor.execute(worker, item, { correlationId });
      executionResults.push(result);

      if (result.status === "failed" && item.attempts < (item.maxRetries || 0)) {
        this.queueManager.enqueueRetry(item, result.error);
        const retrying = machine.transition(WORKFLOW_STATES.RETRYING, {
          reason: "worker execution failed and retry is available",
          safetyMode: "controlled-retry",
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          source: "worker-runtime",
          evidence: result
        });
        retrying.accepted ? transitions.push(retrying.event) : blockedTransitions.push(retrying.event);
        relatedDecisions.push(this.createRelatedDecision("retry-strategy", "medium", item, result));
        this.publish(publishedEvents, {
          type: EVENT_TYPES.ENFORCEMENT_APPLIED,
          workflowId: item.workflow,
          project: item.project,
          correlationId,
          safetyMode: "controlled-retry",
          payload: {
            executionId: result.executionId,
            retryQueued: true,
            reason: result.error
          }
        });
        continue;
      }

      const targetState = result.status === "completed" ? WORKFLOW_STATES.COMPLETED : WORKFLOW_STATES.FAILED;
      const finalTransition = machine.transition(targetState, {
        reason: result.status === "completed" ? "worker execution completed" : "worker execution failed",
        safetyMode: "worker-runtime-readonly",
        source: "worker-runtime",
        evidence: result
      });
      finalTransition.accepted ? transitions.push(finalTransition.event) : blockedTransitions.push(finalTransition.event);

      this.publish(publishedEvents, {
        type: result.status === "completed" ? EVENT_TYPES.WORKFLOW_COMPLETED : EVENT_TYPES.WORKFLOW_FAILED,
        workflowId: item.workflow,
        project: item.project,
        correlationId,
        safetyMode: "worker-runtime-readonly",
        payload: {
          executionId: result.executionId,
          workerId: result.workerId,
          status: result.status,
          error: result.error
        }
      });
    }

    const decisionReport = this.decisionEngine.evaluate();
    const health = this.healthMonitor.evaluate(this.workerRegistry.list(), executionResults);
    for (const unhealthy of health.unhealthyWorkers) {
      this.workerRegistry.markHealth(unhealthy.workerId, "unhealthy", unhealthy.reason);
      relatedDecisions.push({
        decisionId: `decision_worker_unhealthy_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
        type: "preventive-recovery",
        severity: "high",
        source: ["runtime/workers"],
        evidence: unhealthy,
        action: `avoid ${unhealthy.workerId} until health recovers`,
        reason: unhealthy.reason,
        safetyMode: "preventive-worker-recovery",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      });
    }

    const workerDecisionReport = {
      decisionReportId: `worker_decision_report_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      status: relatedDecisions.length > 0 ? "worker_decisions_registered" : "no_worker_decisions",
      source: "worker-runtime",
      decisions: relatedDecisions,
      coordination: {
        queue: relatedDecisions.filter((decision) => decision.type === "retry-strategy").map((decision) => decision.action),
        recovery: relatedDecisions.filter((decision) => decision.type === "preventive-recovery").map((decision) => decision.action),
        supervisor: relatedDecisions.filter((decision) => decision.type === "human-gate").map((decision) => decision.action)
      },
      fallback: {
        safeMode: true,
        sourceDecisionReportId: decisionReport.decisionReportId
      }
    };
    const transitionReport = this.transitionCoordinator.coordinate({
      decisionSource: {
        available: true,
        sourcePath: "runtime/workers/worker-runtime.js",
        data: workerDecisionReport,
        readErrors: []
      }
    });

    const report = {
      workerRuntimeReportId: `worker_runtime_report_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      status: "worker_runtime_executed",
      registeredWorkers: this.workerRegistry.list(),
      queueSource: {
        available: queueSource.source.available,
        sourcePath: queueSource.source.sourcePath,
        fallback: queueSource.fallback || null,
        readErrors: queueSource.source.readErrors
      },
      executionLifecycle: {
        queued: seededItems.length,
        executed: executionResults.length,
        completed: executionResults.filter((result) => result.status === "completed").length,
        failed: executionResults.filter((result) => result.status === "failed").length,
        waitingWorker: executionResults.filter((result) => result.status === "waiting_worker").length
      },
      executionResults,
      transitions: {
        generated: transitions,
        blocked: blockedTransitions,
        coordinator: transitionReport
      },
      events: {
        published: publishedEvents
      },
      decisions: {
        engineReportId: decisionReport.decisionReportId,
        registered: workerDecisionReport
      },
      health,
      database: this.persistDatabaseMirror({
        executionResults,
        workerDecisionReport,
        transitionReport
      }),
      fallback: {
        safeMode: true,
        simulatedExecutionOnly: true,
        destructiveActions: false,
        noExternalSideEffects: true,
        queueFallbackUsed: Boolean(queueSource.fallback)
      }
    };

    return report;
  }

  createRelatedDecision(type, severity, item, result) {
    return {
      decisionId: `decision_worker_${type}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      type,
      severity,
      source: ["runtime/workers"],
      evidence: {
        workflow: item.workflow,
        queueId: item.queueId,
        executionId: result.executionId,
        status: result.status,
        error: result.error
      },
      action: type === "human-gate" ? `require human gate for ${item.workflow}` : `retry ${item.workflow}`,
      reason: result.error || "worker runtime generated related decision",
      safetyMode: type === "human-gate" ? "human-approval-required" : "declarative-retry-policy",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    };
  }

  publish(publishedEvents, input) {
    const publication = this.eventBus.publish({
      source: "worker-runtime",
      project: "platform",
      safetyMode: "worker-runtime-readonly",
      ...input
    });
    publishedEvents.push({
      eventId: publication.event.eventId,
      type: publication.event.type,
      workflowId: publication.event.workflowId,
      correlationId: publication.event.correlationId,
      persistence: publication.persistence
    });
    return publication;
  }

  persistDatabaseMirror({ executionResults, workerDecisionReport, transitionReport }) {
    const adapter = this.database.adapter;
    const inserted = [];
    for (const result of executionResults) {
      const write = adapter.upsert("worker_executions", {
        executionId: result.executionId,
        workflowId: result.workflow,
        project: result.project,
        workerId: result.workerId,
        status: result.status,
        timestamp: result.completedAt,
        payload: result
      });
      inserted.push({
        collection: "worker_executions",
        operation: write.operation,
        idempotencyKey: write.idempotencyKey
      });
    }
    adapter.upsert("decisions", workerDecisionReport);
    adapter.upsert("transitions", transitionReport);
    return {
      adapter: adapter.health(),
      workerExecutions: inserted
    };
  }

  persist(report) {
    const runtimeDir = path.join(this.rootDir, "runtime-data", "workers");
    const memoryDir = path.join(this.rootDir, "memory", "workers");
    ensureDirectory(runtimeDir);
    ensureDirectory(memoryDir);

    const filename = `worker-runtime-${timestampForFile(new Date(report.generatedAt))}.json`;
    const runtimePath = path.join(runtimeDir, filename);
    const memoryPath = path.join(memoryDir, filename);
    fs.writeFileSync(runtimePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(memoryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

    this.persistWorkerDecisions(report.decisions.registered);
    this.transitionCoordinator.persist(report.transitions.coordinator);

    return {
      runtimePath,
      memoryPath
    };
  }

  persistWorkerDecisions(report) {
    const runtimeDir = path.join(this.rootDir, "runtime-data", "decisions");
    const memoryDir = path.join(this.rootDir, "memory", "decisions");
    ensureDirectory(runtimeDir);
    ensureDirectory(memoryDir);
    const filename = `worker-decisions-${timestampForFile(new Date(report.generatedAt))}.json`;
    fs.writeFileSync(path.join(runtimeDir, filename), `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(path.join(memoryDir, filename), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
}

module.exports = {
  WorkerRuntime,
  demoQueueItems,
  safeReadLatestJson
};
