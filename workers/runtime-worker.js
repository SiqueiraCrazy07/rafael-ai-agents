const fs = require("node:fs");
const path = require("node:path");

const { RuntimeConnectorManager } = require("../connectors/runtime-connector-manager");
const { RuntimePluginManager } = require("../plugins/runtime-plugin-manager");
const { EVENT_TYPES, RuntimeEventBus } = require("../runtime/event-bus/runtime-event-bus");
const { WORKFLOW_STATES, WorkflowStateMachine } = require("../runtime/state-machine/workflow-state-machine");
const { WorkerFailureRecovery } = require("./worker-failure-recovery");
const { WorkerHeartbeat } = require("./worker-heartbeat");
const { WorkerLeaseManager } = require("./worker-lease-manager");
const { WorkerLoadBalancer } = require("./worker-load-balancer");
const { WorkerPool } = require("./worker-pool");
const { WorkerSupervisor } = require("./worker-supervisor");
const { createExecutionContext, stableId } = require("./worker-execution-context");
const { WorkerSandbox } = require("./sandbox/worker-sandbox");

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function safeReadJson(filePath) {
  try {
    return {
      ok: true,
      data: JSON.parse(fs.readFileSync(filePath, "utf8"))
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message
    };
  }
}

function readLatestJson(rootDir, relativeDir) {
  const directory = path.join(rootDir, relativeDir);
  if (!fs.existsSync(directory)) {
    return {
      available: false,
      sourcePath: null,
      data: null,
      readErrors: [],
      fallback: {
        safeMode: true,
        reason: "directory-unavailable"
      }
    };
  }

  const readErrors = [];
  const files = fs.readdirSync(directory)
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
    const read = safeReadJson(file.sourcePath);
    if (read.ok) {
      return {
        available: true,
        sourcePath: file.sourcePath,
        data: read.data,
        readErrors,
        fallback: null
      };
    }
    readErrors.push({
      sourcePath: file.sourcePath,
      error: read.error
    });
  }

  return {
    available: false,
    sourcePath: null,
    data: null,
    readErrors,
    fallback: {
      safeMode: true,
      reason: "no-readable-json-files"
    }
  };
}

function normalizeQueueItems(queueSource) {
  const sourceItems = Array.isArray(queueSource.data?.queueItems) ? queueSource.data.queueItems : [];
  const normalized = sourceItems.map((item, index) => ({
    jobId: item.queueItemId || item.jobId || item.workflowId || `queue_item_${index + 1}`,
    workflowId: item.workflow || item.workflowId || item.id || `queued-workflow-${index + 1}`,
    project: item.project || "platform",
    priority: item.priority || "normal",
    requiredCapability: item.requiredCapability || item.capability || "runtime-read",
    maxRetries: Number(item.maxRetries ?? 1),
    retryDelayMs: Number(item.retryDelayMs || 100),
    payload: item.payload || {
      source: "memory/queue"
    }
  }));

  if (normalized.length > 0) {
    return [
      ...normalized,
      {
        jobId: "worker-demo-protected-probe",
        workflowId: "worker-demo-workflow-protected",
        project: "platform",
        priority: "gated",
        requiredCapability: "unavailable-capability",
        maxRetries: 1,
        retryDelayMs: 100,
        payload: {
          simulation: "protected-queue",
          probe: true
        }
      }
    ];
  }

  return [
    {
      jobId: "worker-demo-job-1",
      workflowId: "worker-demo-workflow-success",
      project: "platform",
      priority: "normal",
      requiredCapability: "runtime-read",
      maxRetries: 1,
      retryDelayMs: 100,
      payload: {
        simulation: "complete"
      }
    },
    {
      jobId: "worker-demo-job-2",
      workflowId: "worker-demo-workflow-retry",
      project: "platform",
      priority: "high",
      requiredCapability: "runtime-read",
      maxRetries: 2,
      retryDelayMs: 100,
      payload: {
        failUntilAttempt: 1
      }
    },
    {
      jobId: "worker-demo-job-3",
      workflowId: "worker-demo-workflow-protected",
      project: "platform",
      priority: "gated",
      requiredCapability: "unavailable-capability",
      maxRetries: 1,
      retryDelayMs: 100,
      payload: {
        simulation: "protected-queue"
      }
    }
  ];
}

class RuntimeWorker {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.workerPool = options.workerPool || new WorkerPool();
    this.heartbeat = options.heartbeat || new WorkerHeartbeat({ staleAfterMs: options.staleAfterMs || 30000 });
    this.leaseManager = options.leaseManager || new WorkerLeaseManager({ ttlMs: options.leaseTtlMs || 10000 });
    this.loadBalancer = options.loadBalancer || new WorkerLoadBalancer();
    this.failureRecovery = options.failureRecovery || new WorkerFailureRecovery();
    this.supervisor = options.supervisor || new WorkerSupervisor({
      heartbeat: this.heartbeat,
      leaseManager: this.leaseManager,
      workerPool: this.workerPool
    });
    this.eventBus = options.eventBus || new RuntimeEventBus({ rootDir: this.rootDir });
    this.pluginManager = options.pluginManager || new RuntimePluginManager({ rootDir: this.rootDir });
    this.connectorManager = options.connectorManager || new RuntimeConnectorManager({ rootDir: this.rootDir });
    this.sandbox = options.sandbox || new WorkerSandbox({ rootDir: this.rootDir });
    this.events = [];
    this.stateMachines = [];
    this.transitions = [];
    this.sandboxReports = [];
  }

  registerDefaultWorkers() {
    const registeredWorkers = [
      this.workerPool.registerWorker({
        workerId: "worker-runtime-read-1",
        capabilities: ["runtime-read", "queue-read", "telemetry-read"],
        concurrencyLimit: 2,
        readonly: true,
        enabled: true,
        healthStatus: "healthy",
        metadata: {
          runtime: "workers/root",
          isolation: "simulated-readonly"
        }
      }),
      this.workerPool.registerWorker({
        workerId: "worker-runtime-read-2",
        capabilities: ["runtime-read", "dashboard-read", "connector-read"],
        concurrencyLimit: 1,
        readonly: true,
        enabled: true,
        healthStatus: "healthy",
        metadata: {
          runtime: "workers/root",
          isolation: "simulated-readonly"
        }
      }),
      this.workerPool.registerWorker({
        workerId: "worker-runtime-stale-1",
        capabilities: ["runtime-read"],
        concurrencyLimit: 1,
        readonly: true,
        enabled: true,
        healthStatus: "healthy",
        metadata: {
          runtime: "workers/root",
          expectedFallback: "heartbeat-stale"
        }
      }),
      this.workerPool.registerWorker({
        workerId: "worker-runtime-saturated-1",
        capabilities: ["runtime-read"],
        concurrencyLimit: 1,
        readonly: true,
        enabled: true,
        healthStatus: "healthy",
        metadata: {
          runtime: "workers/root",
          expectedFallback: "saturation-protection"
        }
      })
    ];

    const heartbeatAt = new Date();
    for (const worker of registeredWorkers.filter((worker) => worker.workerId !== "worker-runtime-stale-1")) {
      this.heartbeat.beat(worker.workerId, heartbeatAt);
      this.workerPool.heartbeat(worker.workerId, heartbeatAt.toISOString());
    }

    const staleAt = new Date(heartbeatAt.getTime() - 120000);
    this.heartbeat.beat("worker-runtime-stale-1", staleAt);
    this.workerPool.heartbeat("worker-runtime-stale-1", staleAt.toISOString());
    this.workerPool.recordAssignment("worker-runtime-saturated-1");

    return registeredWorkers;
  }

  publish(type, input) {
    try {
      const publication = this.eventBus.publish({
        type,
        source: "worker-execution-runtime-v1",
        workflowId: input.workflowId,
        project: input.project || "platform",
        payload: input.payload || {},
        safetyMode: input.safetyMode || "readonly-safe-worker-runtime",
        correlationId: input.correlationId
      });
      this.events.push({
        eventId: publication.event.eventId,
        type: publication.event.type,
        workflowId: publication.event.workflowId,
        correlationId: publication.event.correlationId,
        persistence: publication.persistence
      });
      return publication;
    } catch (error) {
      this.events.push({
        type,
        workflowId: input.workflowId,
        failed: true,
        error: error.message,
        fallback: {
          safeMode: true,
          reason: "event-publication-failed"
        }
      });
      return null;
    }
  }

  initializeStateMachine(job) {
    const machine = new WorkflowStateMachine({
      workflow: job.workflowId,
      project: job.project || "platform"
    });
    const queued = machine.transition(WORKFLOW_STATES.QUEUED, {
      reason: "worker runtime accepted job from queue",
      safetyMode: "readonly-safe-worker-runtime",
      source: "worker-execution-runtime-v1"
    });
    this.stateMachines.push(machine);
    this.transitions.push(queued.event);
    return machine;
  }

  transition(machine, toState, options) {
    const result = machine.transition(toState, {
      reason: options.reason,
      safetyMode: options.safetyMode || "readonly-safe-worker-runtime",
      expiresAt: options.expiresAt || null,
      source: "worker-execution-runtime-v1",
      evidence: options.evidence || null
    });
    this.transitions.push(result.event);
    return result;
  }

  async executeJob(job, attempt = 1) {
    const worker = this.loadBalancer.selectWorker(job, this.workerPool.listWorkers());
    const workflowId = job.workflowId || job.jobId;

    this.publish(EVENT_TYPES.WORKFLOW_CREATED, {
      workflowId,
      project: job.project,
      correlationId: job.correlationId,
      payload: {
        jobId: job.jobId,
        priority: job.priority,
        requiredCapability: job.requiredCapability
      }
    });
    this.publish(EVENT_TYPES.WORKFLOW_QUEUED, {
      workflowId,
      project: job.project,
      correlationId: job.correlationId,
      payload: {
        jobId: job.jobId
      }
    });

    const machine = this.initializeStateMachine(job);

    if (!worker) {
      const result = {
        executionId: stableId(`execution_waiting_${workflowId}`),
        correlationId: job.correlationId,
        workflowId,
        jobId: job.jobId,
        project: job.project || "platform",
        workerId: null,
        attempt,
        status: "waiting_worker",
        reason: "no-healthy-capable-worker-available",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        safetyMode: "readonly-safe-protected-queue"
      };
      this.transition(machine, WORKFLOW_STATES.PROTECTED, {
        reason: result.reason,
        safetyMode: result.safetyMode,
        expiresAt: new Date(Date.now() + 300000).toISOString(),
        evidence: result
      });
      return {
        result,
        recovery: this.failureRecovery.decide(job, result),
        lease: null,
        machine: machine.snapshot(),
        pluginHooks: []
      };
    }

    const lease = this.leaseManager.acquireLease(job, worker);
    this.workerPool.recordAssignment(worker.workerId);
    this.publish(EVENT_TYPES.WORKER_LEASE_CREATED, {
      workflowId,
      project: job.project,
      correlationId: job.correlationId,
      payload: {
        leaseId: lease.leaseId,
        workerId: worker.workerId
      }
    });

    const context = createExecutionContext({
      job,
      worker,
      attempt,
      correlationId: job.correlationId,
      lease
    });
    const pluginHooks = [];
    pluginHooks.push(await this.safePluginHook("beforeWorkflow", context));
    pluginHooks.push(await this.safePluginHook("beforeExecution", context));

    const sandboxReport = await this.sandbox.execute({
      executionId: context.executionId,
      correlationId: context.correlationId,
      workerId: worker.workerId,
      workflowId,
      project: job.project || "platform",
      allowedCapabilities: worker.capabilities,
      readonly: true,
      destructiveActions: false,
      timeoutMs: Number(job.timeoutMs || 500),
      payload: job.payload || {},
      handler: async (sandboxContext, sandboxApi) => {
        sandboxApi.attempt({
          type: "readonly-execution",
          workflowId: sandboxContext.workflowId
        });
        if (job.payload?.simulatePermittedWrite === true) {
          sandboxApi.writeFile("runtime-data/workers/sandbox-simulated-write.json");
        }
        const shouldFail = Number(job.payload?.failUntilAttempt || 0) >= attempt;
        return {
          status: shouldFail ? "failed" : "completed",
          reason: shouldFail ? "simulated-readonly-failure" : "simulated-readonly-completion",
          readonly: true,
          destructiveActions: false
        };
      }
    });
    this.sandboxReports.push(sandboxReport);
    const sandboxCompleted = sandboxReport.status === "completed";
    const sandboxResultStatus = sandboxReport.executionResult?.status || "failed";
    const status = sandboxCompleted && sandboxResultStatus === "completed" ? "completed" : "failed";
    const result = {
      executionId: context.executionId,
      correlationId: context.correlationId,
      workflowId,
      jobId: job.jobId,
      project: job.project || "platform",
      workerId: worker.workerId,
      attempt,
      status,
      reason: sandboxCompleted
        ? sandboxReport.executionResult.reason
        : `sandbox-${sandboxReport.status}`,
      startedAt: context.startedAt,
      completedAt: new Date().toISOString(),
      readonly: true,
      destructiveActions: false,
      safetyMode: "readonly-safe-worker-runtime",
      sandbox: {
        sandboxReportId: sandboxReport.sandboxReportId,
        status: sandboxReport.status,
        policyViolations: sandboxReport.policyViolations.length,
        timedOut: sandboxReport.timeout.timedOut
      }
    };

    this.workerPool.releaseAssignment(worker.workerId, status);
    this.leaseManager.releaseLease(lease.leaseId, status === "completed" ? "released" : "failed");

    if (status === "completed") {
      this.transition(machine, WORKFLOW_STATES.COMPLETED, {
        reason: "job completed by readonly worker runtime",
        evidence: result
      });
      this.publish(EVENT_TYPES.WORKFLOW_COMPLETED, {
        workflowId,
        project: job.project,
        correlationId: context.correlationId,
        payload: {
          executionId: result.executionId,
          workerId: worker.workerId,
          attempt
        }
      });
    } else {
      const expiresAt = new Date(Date.now() + Number(job.retryDelayMs || 100)).toISOString();
      this.transition(machine, WORKFLOW_STATES.RETRYING, {
        reason: "job failed and retry orchestration evaluated",
        safetyMode: "readonly-safe-retry",
        expiresAt,
        evidence: result
      });
      this.publish(EVENT_TYPES.WORKFLOW_FAILED, {
        workflowId,
        project: job.project,
        correlationId: context.correlationId,
        payload: {
          executionId: result.executionId,
          workerId: worker.workerId,
          attempt,
          retryable: attempt <= Number(job.maxRetries || 0)
        }
      });
    }

    pluginHooks.push(await this.safePluginHook("afterExecution", { ...context, result }));
    pluginHooks.push(await this.safePluginHook("afterWorkflow", { ...context, result }));

    return {
      result,
      recovery: this.failureRecovery.decide(job, result),
      lease,
      machine: machine.snapshot(),
      pluginHooks
    };
  }

  async safePluginHook(hook, context) {
    try {
      return await this.pluginManager.executeHook(hook, context);
    } catch (error) {
      return {
        hook,
        executedAt: new Date().toISOString(),
        pluginCount: 0,
        executions: [],
        fallback: {
          safeMode: true,
          reason: "plugin-manager-failed",
          error: error.message
        }
      };
    }
  }

  async run() {
    const runId = stableId("worker_runtime_run");
    const generatedAt = new Date().toISOString();
    const registeredWorkers = this.registerDefaultWorkers();
    const queueSource = readLatestJson(this.rootDir, "memory/queue");
    const queueItems = normalizeQueueItems(queueSource).map((job) => ({
      ...job,
      correlationId: job.correlationId || stableId(`correlation_${job.workflowId || job.jobId}`)
    }));

    let pluginLoad = null;
    let connectorLoad = null;
    try {
      pluginLoad = this.pluginManager.load();
    } catch (error) {
      pluginLoad = {
        registeredPlugins: [],
        rejectedPlugins: [],
        fallback: {
          safeMode: true,
          reason: "plugin-load-failed",
          error: error.message
        }
      };
    }
    try {
      connectorLoad = this.connectorManager.load();
    } catch (error) {
      connectorLoad = {
        registeredConnectors: [],
        rejectedConnectors: [],
        fallback: {
          safeMode: true,
          reason: "connector-load-failed",
          error: error.message
        }
      };
    }

    const preflight = this.supervisor.inspect(new Date());
    for (const unhealthy of preflight.unhealthyWorkers) {
      this.publish(EVENT_TYPES.WORKER_UNHEALTHY, {
        workflowId: "worker-runtime-supervision",
        correlationId: runId,
        payload: unhealthy
      });
    }
    for (const saturated of preflight.saturatedWorkers) {
      this.publish(EVENT_TYPES.WORKER_OVERLOADED, {
        workflowId: "worker-runtime-supervision",
        correlationId: runId,
        payload: saturated
      });
    }

    const executionResults = [];
    const recoveryActions = [];
    const leases = [];
    const pluginHooks = [];
    const protectedQueue = [];
    const retryItems = [];
    const rebalances = [];

    for (const job of queueItems) {
      const firstExecution = await this.executeJob(job, 1);
      executionResults.push(firstExecution.result);
      recoveryActions.push(firstExecution.recovery);
      pluginHooks.push(...firstExecution.pluginHooks);
      if (firstExecution.lease) {
        leases.push(firstExecution.lease);
      }

      if (firstExecution.recovery.action === "retry") {
        retryItems.push({
          workflowId: job.workflowId,
          nextAttempt: firstExecution.recovery.nextAttempt,
          reason: firstExecution.recovery.reason
        });
        const retryExecution = await this.executeJob(job, firstExecution.recovery.nextAttempt);
        executionResults.push(retryExecution.result);
        recoveryActions.push(retryExecution.recovery);
        pluginHooks.push(...retryExecution.pluginHooks);
        if (retryExecution.lease) {
          leases.push(retryExecution.lease);
        }
      }

      if (firstExecution.recovery.action === "protected-queue") {
        protectedQueue.push({
          workflowId: job.workflowId,
          jobId: job.jobId,
          requiredCapability: job.requiredCapability,
          reason: firstExecution.recovery.reason
        });
      }
    }

    const rebalancePlan = this.loadBalancer.planRebalance({
      pendingJobs: protectedQueue.map((item) => ({
        ...item,
        project: "platform"
      })),
      workers: this.workerPool.listWorkers(),
      unhealthyWorkers: preflight.unhealthyWorkers,
      saturatedWorkers: preflight.saturatedWorkers
    });
    for (const rebalance of rebalancePlan.rebalances) {
      rebalances.push(rebalance);
      this.publish(EVENT_TYPES.WORKFLOW_REBALANCED, {
        workflowId: rebalance.workflowId,
        correlationId: runId,
        payload: rebalance
      });
    }

    const connectorHealth = await this.safeConnectorHealth();
    const connectorExecutions = [
      await this.safeConnectorCapability("telemetry-read", { runId, source: "worker-runtime" }),
      await this.safeConnectorCapability("dashboard-read", { runId, source: "worker-runtime" })
    ];
    const telemetryHooks = [
      await this.safePluginHook("beforeTelemetry", { runId, executionResults }),
      await this.safePluginHook("afterTelemetry", { runId, executionResults })
    ];
    pluginHooks.push(...telemetryHooks);

    const postflight = this.supervisor.inspect(new Date(Date.now() + 15000));
    const report = {
      workerRuntimeReportId: runId,
      generatedAt,
      status: executionResults.some((result) => result.status === "completed")
        ? "worker_runtime_demo_passed"
        : "worker_runtime_demo_attention",
      readonly: true,
      destructiveActions: false,
      safetyMode: "readonly-safe-worker-runtime",
      architecture: {
        modules: [
          "runtime-worker",
          "worker-pool",
          "worker-heartbeat",
          "worker-lease-manager",
          "worker-supervisor",
          "worker-load-balancer",
          "worker-failure-recovery",
          "worker-execution-context"
        ],
        executionIsolation: true,
        leaseLock: true,
        heartbeat: true,
        retries: true,
        saturationProtection: true,
        workerBalancing: true
      },
      queueSource: {
        available: queueSource.available,
        sourcePath: queueSource.sourcePath,
        readErrors: queueSource.readErrors,
        fallback: queueSource.fallback
      },
      queueItems,
      registeredWorkers: this.workerPool.listWorkers(),
      health: {
        preflight,
        postflight,
        unhealthyWorkers: [
          ...preflight.unhealthyWorkers,
          ...postflight.unhealthyWorkers
        ]
      },
      executionResults,
      recoveryActions,
      retryItems,
      protectedQueue,
      leases: this.leaseManager.listLeases(),
      sandbox: {
        enabled: true,
        reports: this.sandboxReports.map((report) => ({
          sandboxReportId: report.sandboxReportId,
          status: report.status,
          executionId: report.context.executionId,
          correlationId: report.context.correlationId,
          workerId: report.context.workerId,
          workflowId: report.context.workflowId,
          deniedActions: report.deniedActions.length,
          policyViolations: report.policyViolations.length,
          timedOut: report.timeout.timedOut,
          persistence: report.persistence
        })),
        policyViolations: this.sandboxReports.flatMap((report) => report.policyViolations)
      },
      rebalances,
      transitions: this.transitions,
      stateMachines: this.stateMachines.map((machine) => machine.snapshot()),
      publishedEvents: this.events,
      plugins: {
        loadedPlugins: pluginLoad.registeredPlugins || [],
        rejectedPlugins: pluginLoad.rejectedPlugins || [],
        hookExecutions: pluginHooks
      },
      connectors: {
        loadedConnectors: connectorLoad.registeredConnectors || [],
        rejectedConnectors: connectorLoad.rejectedConnectors || [],
        health: connectorHealth,
        capabilityExecutions: connectorExecutions
      },
      telemetryIntegration: {
        writesMemoryWorkers: true,
        compatibleWithRuntimeMetricsCollector: true,
        correlationIds: [...new Set(executionResults.map((result) => result.correlationId).filter(Boolean))]
      },
      dashboardIntegration: {
        readonly: true,
        source: "memory/workers",
        expectedConsumers: [
          "dashboard-runtime-api-v1",
          "dashboard-web-v1"
        ]
      },
      fallback: {
        safeMode: true,
        queueFallbackUsed: !queueSource.available,
        protectedQueueCount: protectedQueue.length,
        unhealthyWorkersAvoided: preflight.unhealthyWorkers.map((worker) => worker.workerId),
        invalidPluginsBlocked: (pluginLoad.rejectedPlugins || []).length,
        unhealthyConnectorsSkipped: connectorHealth.unhealthyConnectors
          ? connectorHealth.unhealthyConnectors.length
          : 0,
        behavior: "jobs without healthy capable workers remain protected; plugin and connector failures are recorded without stopping execution"
      },
      persistence: null
    };

    report.persistence = this.persist(report);
    return report;
  }

  async safeConnectorHealth() {
    try {
      return await this.connectorManager.checkHealth();
    } catch (error) {
      return {
        checkedAt: new Date().toISOString(),
        checks: [],
        unhealthyConnectors: [],
        fallback: {
          safeMode: true,
          reason: "connector-health-failed",
          error: error.message
        }
      };
    }
  }

  async safeConnectorCapability(capability, context) {
    try {
      return await this.connectorManager.executeCapability(capability, context);
    } catch (error) {
      return {
        capability,
        executedAt: new Date().toISOString(),
        connectorCount: 0,
        executions: [],
        fallback: {
          safeMode: true,
          reason: "connector-capability-failed",
          error: error.message
        }
      };
    }
  }

  persist(report) {
    const runtimeDir = path.join(this.rootDir, "runtime-data", "workers");
    const memoryDir = path.join(this.rootDir, "memory", "workers");
    ensureDir(runtimeDir);
    ensureDir(memoryDir);

    const filename = `worker-runtime-root-${timestampForFile()}.json`;
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

async function runWorkerRuntimeDemo(options = {}) {
  const runtime = new RuntimeWorker(options);
  return runtime.run();
}

module.exports = {
  RuntimeWorker,
  normalizeQueueItems,
  readLatestJson,
  runWorkerRuntimeDemo
};
