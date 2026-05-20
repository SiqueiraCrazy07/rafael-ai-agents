const fs = require("node:fs");
const path = require("node:path");

function readJsonHistory(rootDir, relativeDir, limit = 50) {
  const directory = path.join(rootDir, relativeDir);
  if (!fs.existsSync(directory)) {
    return {
      relativeDir,
      available: false,
      items: [],
      readErrors: [],
      fallback: {
        safeMode: true,
        reason: "directory-unavailable"
      }
    };
  }

  const readErrors = [];
  const items = fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const sourcePath = path.join(directory, file);
      return {
        file,
        sourcePath,
        mtimeMs: fs.statSync(sourcePath).mtimeMs
      };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs)
    .slice(0, limit)
    .flatMap((file) => {
      try {
        return [{
          ...file,
          data: JSON.parse(fs.readFileSync(file.sourcePath, "utf8"))
        }];
      } catch (error) {
        readErrors.push({
          sourcePath: file.sourcePath,
          error: error.message
        });
        return [];
      }
    });

  return {
    relativeDir,
    available: items.length > 0,
    items,
    readErrors,
    fallback: items.length > 0 ? null : {
      safeMode: true,
      reason: "no-readable-json-files"
    }
  };
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

class RuntimeMetricsCollector {
  constructor(rootDir = process.cwd(), options = {}) {
    this.rootDir = rootDir;
    this.limit = options.limit || 50;
  }

  loadSources() {
    return {
      workers: readJsonHistory(this.rootDir, "memory/workers", this.limit),
      orchestration: readJsonHistory(this.rootDir, "memory/orchestration", this.limit),
      events: readJsonHistory(this.rootDir, "memory/events", this.limit * 4),
      decisions: readJsonHistory(this.rootDir, "memory/decisions", this.limit),
      queue: readJsonHistory(this.rootDir, "memory/queue", this.limit),
      transitions: readJsonHistory(this.rootDir, "memory/state-transitions", this.limit),
      api: readJsonHistory(this.rootDir, "memory/api", this.limit),
      openapi: readJsonHistory(this.rootDir, "memory/openapi", this.limit),
      database: readJsonHistory(this.rootDir, "memory/database", this.limit),
      plugins: readJsonHistory(this.rootDir, "memory/plugins", this.limit),
      connectors: readJsonHistory(this.rootDir, "memory/connectors", this.limit),
      workerSandbox: readJsonHistory(this.rootDir, "memory/worker-sandbox", this.limit),
      workerScheduler: readJsonHistory(this.rootDir, "memory/worker-scheduler", this.limit),
      autonomousOrchestrator: readJsonHistory(this.rootDir, "memory/autonomous-orchestrator", this.limit)
    };
  }

  collect() {
    const sources = this.loadSources();
    const workerReports = sources.workers.items.map((item) => item.data);
    const orchestrationReports = sources.orchestration.items.map((item) => item.data);
    const eventItems = sources.events.items.map((item) => item.data);
    const decisionReports = sources.decisions.items.map((item) => item.data);
    const queueReports = sources.queue.items.map((item) => item.data);
    const sandboxReports = sources.workerSandbox.items.map((item) => item.data);
    const schedulerReports = sources.workerScheduler.items.map((item) => item.data);
    const autonomousReports = sources.autonomousOrchestrator.items.map((item) => item.data);

    const workerExecutions = workerReports.flatMap((report) =>
      asArray(report.executionResults || report.executionResults?.executionResults)
    );
    const orchestrationExecutions = orchestrationReports.flatMap((report) => asArray(report.executionResults));
    const allExecutions = [...workerExecutions, ...orchestrationExecutions];
    const latestQueue = queueReports[0] || {};
    const queueItems = asArray(latestQueue.queueItems);
    const retryItems = asArray(latestQueue.retryItems);
    const throttlingCount = [
      ...allExecutions.filter((result) => result.status === "throttled"),
      ...eventItems.filter((event) => event.type === "workflow-throttled")
    ].length;
    const workerHealth = workerReports.flatMap((report) => asArray(report.health?.unhealthyWorkers));
    const orchestrationHealth = orchestrationReports.flatMap((report) => asArray(report.health?.unhealthyWorkers));
    const unhealthyWorkerIds = [...new Set([
      ...workerHealth.map((worker) => worker.workerId || worker),
      ...orchestrationHealth.map((worker) => worker.workerId || worker),
      ...orchestrationReports.flatMap((report) => asArray(report.fallback?.unhealthyWorkersAvoided))
    ].filter(Boolean))];
    const workerUtilization = this.calculateWorkerUtilization(workerReports, orchestrationReports);
    const eventThroughput = this.countByMinute(eventItems.map((event) => event.timestamp));
    const decisionThroughput = this.countByMinute(decisionReports.map((report) => report.generatedAt || report.timestamp));
    const rebalances = orchestrationReports.flatMap((report) => asArray(report.rebalance?.rebalances));
    const leaseExpirations = orchestrationReports.flatMap((report) => asArray(report.leaseEvents?.expired));

    return {
      generatedAt: new Date().toISOString(),
      metrics: {
        workflowExecutions: {
          total: allExecutions.length,
          completed: allExecutions.filter((result) => result.status === "completed").length,
          failed: allExecutions.filter((result) => result.status === "failed").length,
          waitingWorker: allExecutions.filter((result) => result.status === "waiting_worker").length
        },
        queueDepth: queueItems.length,
        retryCount: retryItems.length,
        throttlingCount,
        workerUtilization,
        unhealthyWorkers: {
          count: unhealthyWorkerIds.length,
          workerIds: unhealthyWorkerIds
        },
        rebalanceCount: rebalances.length,
        leaseExpirationCount: leaseExpirations.length,
        eventThroughput,
        decisionThroughput,
        apiReports: sources.api.items.length,
        openApiExports: sources.openapi.items.length,
        databaseReports: sources.database.items.length,
        pluginReports: sources.plugins.items.length,
        connectorReports: sources.connectors.items.length,
        workerSandboxReports: sandboxReports.length,
        workerSandboxPolicyViolations: sandboxReports
          .flatMap((report) => asArray(report.policyViolations))
          .length,
        workerSandboxTimeouts: sandboxReports
          .filter((report) => report.timeout?.timedOut === true)
          .length,
        workerSchedulerReports: schedulerReports.length,
        workerSchedulerPlannedJobs: sum(schedulerReports.map((report) =>
          asArray(report.scheduledJobs).length
        )),
        workerSchedulerProtectedPlans: sum(schedulerReports.map((report) =>
          asArray(report.scheduledJobs).filter((job) => job.action === "protected-queue").length
        )),
        autonomousOrchestratorReports: autonomousReports.length,
        autonomousHumanGates: autonomousReports.filter((report) =>
          report.humanGate?.required === true || report.plan?.humanGate?.required === true
        ).length
      },
      sources: Object.fromEntries(Object.entries(sources).map(([key, source]) => [
        key,
        {
          relativeDir: source.relativeDir,
          available: source.available,
          filesRead: source.items.length,
          readErrors: source.readErrors,
          fallback: source.fallback
        }
      ])),
      fallback: {
        safeMode: true,
        missingSources: Object.entries(sources)
          .filter(([, source]) => !source.available)
          .map(([key]) => key)
      }
    };
  }

  calculateWorkerUtilization(workerReports, orchestrationReports) {
    const workers = new Map();

    for (const report of workerReports) {
      for (const worker of asArray(report.registeredWorkers)) {
        workers.set(worker.workerId, {
          workerId: worker.workerId,
          assigned: 0,
          concurrencyLimit: worker.concurrencyLimit || worker.capacity || 1,
          healthStatus: worker.healthStatus || worker.status || "unknown"
        });
      }
      for (const result of asArray(report.executionResults)) {
        if (!result.workerId) {
          continue;
        }
        const existing = workers.get(result.workerId) || {
          workerId: result.workerId,
          assigned: 0,
          concurrencyLimit: 1,
          healthStatus: "unknown"
        };
        existing.assigned += 1;
        workers.set(result.workerId, existing);
      }
    }

    for (const report of orchestrationReports) {
      for (const worker of asArray(report.workers)) {
        workers.set(worker.workerId, {
          workerId: worker.workerId,
          assigned: worker.assignedCount || 0,
          concurrencyLimit: worker.concurrencyLimit || 1,
          healthStatus: worker.healthStatus || "unknown"
        });
      }
    }

    return [...workers.values()].map((worker) => ({
      ...worker,
      utilization: worker.concurrencyLimit > 0 ? worker.assigned / worker.concurrencyLimit : 0
    }));
  }

  countByMinute(timestamps) {
    const buckets = {};
    for (const timestamp of timestamps.filter(Boolean)) {
      const minute = String(timestamp).slice(0, 16);
      buckets[minute] = (buckets[minute] || 0) + 1;
    }

    return {
      total: sum(Object.values(buckets)),
      buckets
    };
  }
}

module.exports = {
  RuntimeMetricsCollector,
  readJsonHistory
};
