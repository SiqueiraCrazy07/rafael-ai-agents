const fs = require("node:fs");
const path = require("node:path");
const { ExecutionForecastEngine } = require("./execution-forecast-engine");
const { ExecutionPriorityEngine } = require("./execution-priority-engine");
const { ExecutionRoutingEngine } = require("./execution-routing-engine");
const { ExecutionWindowManager } = require("./execution-window-manager");
const { normalizeQueueItems } = require("../runtime-worker");

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

function normalizeWorkers(workerSource) {
  const report = workerSource.data || {};
  const workers = Array.isArray(report.registeredWorkers) ? report.registeredWorkers : [];
  if (workers.length > 0) {
    return workers.map((worker) => ({
      workerId: worker.workerId,
      capabilities: Array.isArray(worker.capabilities) ? worker.capabilities : ["runtime-read"],
      concurrencyLimit: Number(worker.concurrencyLimit || 1),
      readonly: worker.readonly !== false,
      enabled: worker.enabled !== false,
      healthStatus: worker.healthStatus || "unknown",
      activeExecutions: Number(worker.activeExecutions || 0),
      assignedCount: Number(worker.assignedCount || 0)
    }));
  }

  return [
    {
      workerId: "scheduler-fallback-worker-1",
      capabilities: ["runtime-read", "telemetry-read"],
      concurrencyLimit: 1,
      readonly: true,
      enabled: true,
      healthStatus: "healthy",
      activeExecutions: 0,
      assignedCount: 0
    },
    {
      workerId: "scheduler-fallback-unhealthy-1",
      capabilities: ["runtime-read"],
      concurrencyLimit: 1,
      readonly: true,
      enabled: true,
      healthStatus: "unhealthy",
      activeExecutions: 0,
      assignedCount: 0
    }
  ];
}

function normalizeSchedulerJobs(queueSource, workerSource) {
  const queueJobs = normalizeQueueItems(queueSource).map((job) => ({
    ...job,
    workflowId: job.workflowId || job.workflow || job.jobId,
    protected: job.priority === "gated",
    retry: false
  }));
  const latestWorkerReport = workerSource.data || {};
  const retryJobs = Array.isArray(latestWorkerReport.retryItems)
    ? latestWorkerReport.retryItems.map((item) => ({
        jobId: `scheduled-retry-${item.workflowId}`,
        workflowId: item.workflowId,
        project: "platform",
        priority: "retry",
        requiredCapability: item.requiredCapability || "runtime-read",
        retry: true,
        attempt: item.nextAttempt || 2,
        retryDelayMs: 30000,
        payload: {
          source: "worker-runtime-retry-item",
          reason: item.reason
        }
      }))
    : [];
  const protectedJobs = Array.isArray(latestWorkerReport.protectedQueue)
    ? latestWorkerReport.protectedQueue.map((item) => ({
        jobId: `protected-release-${item.workflowId}`,
        workflowId: item.workflowId,
        project: "platform",
        priority: "gated",
        requiredCapability: item.requiredCapability || "runtime-read",
        protected: true,
        payload: {
          source: "worker-runtime-protected-queue",
          reason: item.reason
        }
      }))
    : [];

  const seen = new Set();
  return [...queueJobs, ...retryJobs, ...protectedJobs].filter((job) => {
    const key = [
      job.workflowId,
      job.jobId,
      job.requiredCapability,
      job.retry === true ? "retry" : "normal",
      job.protected === true || job.priority === "gated" ? "protected" : "open"
    ].join(":");
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

class ExecutionPlanner {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.priorityEngine = options.priorityEngine || new ExecutionPriorityEngine();
    this.forecastEngine = options.forecastEngine || new ExecutionForecastEngine();
    this.windowManager = options.windowManager || new ExecutionWindowManager(options);
    this.routingEngine = options.routingEngine || new ExecutionRoutingEngine();
  }

  loadSources() {
    return {
      queue: readLatestJson(this.rootDir, "memory/queue"),
      workers: readLatestJson(this.rootDir, "memory/workers"),
      telemetry: readLatestJson(this.rootDir, "memory/telemetry"),
      sandbox: readLatestJson(this.rootDir, "memory/worker-sandbox"),
      plugins: readLatestJson(this.rootDir, "memory/plugins"),
      connectors: readLatestJson(this.rootDir, "memory/connectors"),
      database: readLatestJson(this.rootDir, "memory/database")
    };
  }

  createPlan(options = {}) {
    const sources = options.sources || this.loadSources();
    const workers = normalizeWorkers(sources.workers);
    const jobs = normalizeSchedulerJobs(sources.queue, sources.workers);
    const rankedJobs = this.priorityEngine.rankJobs(jobs);
    const forecast = this.forecastEngine.forecast({
      jobs: rankedJobs,
      workers,
      telemetry: sources.telemetry.data || {},
      sandboxReports: sources.sandbox.data ? [sources.sandbox.data] : []
    });
    const plannedWorkers = workers.map((worker) => ({ ...worker }));
    const executionPlans = rankedJobs.map((job, index) => {
      const route = this.routingEngine.selectRoute(job, plannedWorkers);
      const window = this.windowManager.createWindow(job, forecast);
      const action = route.routeStatus === "routed" ? "schedule" : "protected-queue";
      if (route.selectedWorkerId) {
        const selectedWorker = plannedWorkers.find((worker) => worker.workerId === route.selectedWorkerId);
        if (selectedWorker) {
          selectedWorker.activeExecutions = Number(selectedWorker.activeExecutions || 0) + 1;
          selectedWorker.assignedCount = Number(selectedWorker.assignedCount || 0) + 1;
        }
      }
      return {
        planItemId: `execution_plan_item_${Date.now()}_${index}`,
        workflowId: job.workflowId,
        jobId: job.jobId,
        project: job.project || "platform",
        action,
        priority: job.priorityScore,
        route,
        window,
        retry: {
          scheduled: job.retry === true,
          attempt: job.attempt || 1,
          retryDelayMs: job.retryDelayMs || null
        },
        protectedQueue: {
          releaseCandidate: job.protected === true || job.priority === "gated",
          releaseAllowed: action === "schedule" && window.type === "protected-release"
        },
        safetyMode: "readonly-safe-execution-plan",
        reason: action === "schedule"
          ? "healthy-capable-worker-selected"
          : "no-safe-route-available"
      };
    });

    return {
      executionPlanId: `execution_plan_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      source: "worker-scheduler-execution-planner-v1",
      readonly: true,
      destructiveActions: false,
      workload: {
        totalJobs: jobs.length,
        rankedJobs: rankedJobs.map((job) => ({
          workflowId: job.workflowId,
          priority: job.priority,
          priorityScore: job.priorityScore.score,
          reasons: job.priorityScore.reasons
        }))
      },
      workers: {
        total: workers.length,
        healthy: workers.filter((worker) => worker.healthStatus === "healthy").length,
        unhealthy: workers.filter((worker) => worker.healthStatus === "unhealthy").map((worker) => worker.workerId),
        workers
      },
      forecast,
      executionPlans,
      integrations: {
        workerRuntime: sources.workers.available,
        queueManager: sources.queue.available,
        telemetry: sources.telemetry.available,
        sandbox: sources.sandbox.available,
        plugins: sources.plugins.available,
        connectors: sources.connectors.available,
        databaseLayer: sources.database.available,
        dashboard: "telemetry-dashboard-consumes-memory-worker-scheduler"
      },
      sourceSummary: Object.fromEntries(Object.entries(sources).map(([key, source]) => [
        key,
        {
          available: source.available,
          sourcePath: source.sourcePath,
          readErrors: source.readErrors,
          fallback: source.fallback
        }
      ])),
      fallback: {
        safeMode: true,
        missingSources: Object.entries(sources)
          .filter(([, source]) => !source.available)
          .map(([key]) => key),
        protectedPlanItems: executionPlans.filter((item) => item.action === "protected-queue").length,
        behavior: "plans are declarative; no worker execution is triggered by the scheduler demo"
      }
    };
  }
}

module.exports = {
  ExecutionPlanner,
  normalizeSchedulerJobs,
  normalizeWorkers,
  readLatestJson
};
