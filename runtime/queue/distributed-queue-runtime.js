const fs = require("node:fs");
const path = require("node:path");
const { DistributedRuntimeEventBus } = require("../../event-bus/runtime-event-bus");
const { DistributedRuntimeCoordinator } = require("../distributed/distributed-runtime-coordinator");
const { WorkerScheduler } = require("../../workers/scheduler/worker-scheduler");
const { normalizeQueueItems } = require("../../workers/runtime-worker");
const { DistributedRetryOrchestrator } = require("./distributed-retry-orchestrator");
const { QueuePartitionManager } = require("./queue-partition-manager");
const { QueuePressureMonitor } = require("./queue-pressure-monitor");
const { QueueRebalancer } = require("./queue-rebalancer");
const { QueueSaturationProtection } = require("./queue-saturation-protection");
const { RuntimeBackpressureEngine } = require("./runtime-backpressure-engine");
const { RuntimeThrottlingEngine } = require("./runtime-throttling-engine");

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

function safeReadJson(filePath) {
  try {
    return { ok: true, data: JSON.parse(fs.readFileSync(filePath, "utf8")) };
  } catch (error) {
    return { ok: false, error: error.message };
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
      fallback: { safeMode: true, reason: "directory-unavailable" }
    };
  }

  const readErrors = [];
  const files = fs.readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const sourcePath = path.join(directory, file);
      return { sourcePath, mtimeMs: fs.statSync(sourcePath).mtimeMs };
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
    readErrors.push({ sourcePath: file.sourcePath, error: read.error });
  }

  return {
    available: false,
    sourcePath: null,
    data: null,
    readErrors,
    fallback: { safeMode: true, reason: "no-readable-json-files" }
  };
}

function normalizeRetryItems(workerSource) {
  const items = Array.isArray(workerSource.data?.retryItems) ? workerSource.data.retryItems : [];
  if (items.length > 0) {
    return items.map((item, index) => ({
      jobId: item.jobId || `retry_item_${index + 1}`,
      workflowId: item.workflowId || item.workflow || `retry-workflow-${index + 1}`,
      nextAttempt: Number(item.nextAttempt || item.attempt || 2),
      maxRetries: Number(item.maxRetries || 3),
      retryDelayMs: Number(item.retryDelayMs || 30000),
      reason: item.reason || "worker-runtime-retry"
    }));
  }

  return [
    {
      jobId: "distributed-retry-demo-1",
      workflowId: "distributed-queue-retry-workflow",
      nextAttempt: 2,
      maxRetries: 3,
      retryDelayMs: 30000,
      reason: "fallback-retry-sample"
    },
    {
      jobId: "distributed-retry-demo-2",
      workflowId: "distributed-queue-retry-storm-probe",
      nextAttempt: 3,
      maxRetries: 3,
      retryDelayMs: 30000,
      reason: "retry-storm-probe"
    }
  ];
}

function normalizeProtectedQueue(workerSource) {
  const items = Array.isArray(workerSource.data?.protectedQueue) ? workerSource.data.protectedQueue : [];
  if (items.length > 0) {
    return items.map((item, index) => ({
      jobId: item.jobId || `protected_item_${index + 1}`,
      workflowId: item.workflowId || item.workflow || `protected-workflow-${index + 1}`,
      priority: "gated",
      requiredCapability: item.requiredCapability || "runtime-read",
      reason: item.reason || "protected-queue-item"
    }));
  }

  return [
    {
      jobId: "distributed-protected-demo-1",
      workflowId: "distributed-protected-workflow",
      priority: "gated",
      requiredCapability: "human-gated-runtime-read",
      reason: "fallback-protected-sample"
    }
  ];
}

class DistributedQueueRuntime {
  constructor({ rootDir = process.cwd() } = {}) {
    this.rootDir = rootDir;
    this.runtimeDir = path.join(rootDir, "runtime-data", "distributed-queue");
    this.memoryDir = path.join(rootDir, "memory", "distributed-queue");
    this.partitionManager = new QueuePartitionManager();
    this.pressureMonitor = new QueuePressureMonitor();
    this.backpressureEngine = new RuntimeBackpressureEngine();
    this.throttlingEngine = new RuntimeThrottlingEngine();
    this.retryOrchestrator = new DistributedRetryOrchestrator();
    this.saturationProtection = new QueueSaturationProtection();
    this.rebalancer = new QueueRebalancer();
    this.eventBus = new DistributedRuntimeEventBus({ rootDir, maxInMemoryEvents: 50, maxEventsPerWindow: 100 });
  }

  initialize() {
    ensureDir(this.runtimeDir);
    ensureDir(this.memoryDir);
    return {
      runtimeDir: this.runtimeDir,
      memoryDir: this.memoryDir,
      safetyMode: "readonly-safe-distributed-queue"
    };
  }

  loadSources() {
    return {
      queue: readLatestJson(this.rootDir, "memory/queue"),
      workers: readLatestJson(this.rootDir, "memory/workers"),
      distributedRuntime: readLatestJson(this.rootDir, "memory/distributed-runtime"),
      selfHealing: readLatestJson(this.rootDir, "memory/self-healing"),
      replay: readLatestJson(this.rootDir, "memory/replay"),
      telemetry: readLatestJson(this.rootDir, "memory/telemetry"),
      scheduler: readLatestJson(this.rootDir, "memory/worker-scheduler"),
      eventBus: readLatestJson(this.rootDir, "memory/event-bus")
    };
  }

  runDemo() {
    const initialization = this.initialize();
    const distributedRuntime = new DistributedRuntimeCoordinator({ rootDir: this.rootDir }).runDemo();
    const schedulerPlan = new WorkerScheduler({ rootDir: this.rootDir }).schedule();
    const sources = this.loadSources();
    const queueItems = [
      ...normalizeQueueItems(sources.queue),
      {
        jobId: "distributed-queue-overload-probe",
        workflowId: "distributed-queue-overload-workflow",
        project: "platform",
        priority: "normal",
        requiredCapability: "runtime-read",
        maxRetries: 1,
        retryDelayMs: 30000,
        payload: { simulation: "queue-overload" }
      }
    ];
    const retryItems = normalizeRetryItems(sources.workers);
    const protectedQueue = normalizeProtectedQueue(sources.workers);
    const nodes = distributedRuntime.nodes.map((node) => ({
      ...node,
      enabled: node.status !== "disabled",
      readonly: true
    }));
    const partitions = this.partitionManager.createPartitions({ queueItems, retryItems, protectedQueue, nodes });
    const partitionSummary = this.partitionManager.summarize(partitions);
    const pressure = this.pressureMonitor.evaluate({
      partitions,
      clusterState: distributedRuntime.clusterState,
      schedulerPlan
    });
    const backpressure = this.backpressureEngine.detect({
      pressure,
      clusterState: distributedRuntime.clusterState,
      failures: distributedRuntime.failuresDetected
    });
    const throttling = this.throttlingEngine.apply({ backpressure, pressure });
    const retryOrchestration = this.retryOrchestrator.plan({ partitions, backpressure });
    const protection = this.saturationProtection.protect({ backpressure, throttling, pressure });
    const rebalancing = this.rebalancer.rebalance({
      partitions,
      nodeHealth: distributedRuntime.nodeHealth,
      saturationProtection: protection
    });
    const event = this.publishQueueEvent({
      pressure,
      backpressure,
      throttling,
      retryOrchestration,
      rebalancing
    });

    const report = {
      distributedQueueReportId: `distributed_queue_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      status: "distributed_queue_backpressure_runtime_ready",
      readonly: true,
      destructiveActions: false,
      externalBroker: false,
      initialization,
      sources: Object.fromEntries(Object.entries(sources).map(([key, source]) => [
        key,
        {
          available: source.available,
          sourcePath: source.sourcePath,
          readErrors: source.readErrors,
          fallback: source.fallback
        }
      ])),
      distributedRuntime: {
        reportId: distributedRuntime.distributedRuntimeDemoId,
        clusterState: distributedRuntime.clusterState,
        nodeHealth: distributedRuntime.nodeHealth,
        failuresDetected: distributedRuntime.failuresDetected.length
      },
      scheduler: {
        reportId: schedulerPlan.workerSchedulerReportId,
        totalScheduled: schedulerPlan.metrics.totalScheduled,
        totalProtected: schedulerPlan.metrics.totalProtected,
        retrySchedules: schedulerPlan.metrics.retrySchedules
      },
      partitions,
      partitionSummary,
      pressure,
      backpressure,
      throttling,
      retryOrchestration,
      saturationProtection: protection,
      rebalancing,
      recoveryRecommendations: this.buildRecoveryRecommendations({ backpressure, retryOrchestration, protection, rebalancing }),
      integrations: {
        distributedRuntime: "cluster state and node health consumed",
        scheduler: "execution plan and forecast consumed",
        workers: "retry and protected queue data consumed",
        replay: "replay pressure source checked",
        selfHealing: "queue saturation and recovery signals checked",
        eventBus: "queue pressure event emitted as readonly signal",
        telemetry: "memory/distributed-queue is telemetry-readable",
        dashboard: "report is dashboard-ready"
      },
      eventBus: event,
      fallback: {
        safeMode: true,
        jsonFallback: true,
        behavior: "queue runtime emits declarative throttling, retry and rebalance plans only",
        missingSources: Object.entries(sources).filter(([, source]) => !source.available).map(([key]) => key)
      },
      persistence: null
    };
    report.persistence = this.persist(report);
    return report;
  }

  publishQueueEvent(payload) {
    try {
      this.eventBus.initialize();
      const publication = this.eventBus.publish({
        type: "scheduler.plan.created",
        source: "distributed-queue-backpressure-runtime",
        workflowId: "distributed-queue-runtime",
        correlationId: `distributed_queue_${Date.now()}`,
        routingKey: "scheduler",
        payload,
        safetyMode: "readonly-safe-distributed-queue"
      });
      return {
        eventPublished: publication.ok,
        eventId: publication.event?.eventId || null,
        status: publication.status,
        fallback: publication.fallback
      };
    } catch (error) {
      return {
        eventPublished: false,
        error: error.message,
        fallback: {
          safeMode: true,
          reason: "event-publication-failed"
        }
      };
    }
  }

  buildRecoveryRecommendations({ backpressure, retryOrchestration, protection, rebalancing }) {
    return [
      ...backpressure.signals.map((signal) => ({
        type: signal.type,
        recommendation: signal.recommendation,
        evidence: signal.evidence
      })),
      ...retryOrchestration.retryPlans
        .filter((plan) => plan.escalationRecommendation)
        .map((plan) => ({
          type: "retry-escalation",
          recommendation: plan.escalationRecommendation,
          evidence: { workflowId: plan.workflowId, attempt: plan.attempt }
        })),
      protection.collapseRisk
        ? {
            type: "collapse-risk",
            recommendation: "activate-safe-mode-and-block-excessive-assignments",
            evidence: protection.assignmentPolicy
          }
        : null,
      rebalancing.moves.length > 0
        ? {
            type: "queue-rebalance",
            recommendation: "execute-supervised-readonly-reviewed-rebalance-in-future-phase",
            evidence: { moves: rebalancing.moves.length }
          }
        : null
    ].filter(Boolean);
  }

  persist(report) {
    const filename = `distributed-queue-${timestampForFile()}-${report.distributedQueueReportId}.json`;
    const runtimePath = path.join(this.runtimeDir, filename);
    const memoryPath = path.join(this.memoryDir, filename);
    fs.writeFileSync(runtimePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(memoryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    return { runtimePath, memoryPath };
  }
}

module.exports = {
  DistributedQueueRuntime,
  readLatestJson
};
