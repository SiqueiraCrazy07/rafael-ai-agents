const fs = require("node:fs");
const path = require("node:path");
const { WorkerHealthMonitor } = require("./worker-health-monitor");
const { WorkerRegistry } = require("./worker-registry");

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

function persistHealthReport(report, rootDir = process.cwd()) {
  const runtimeDir = path.join(rootDir, "runtime-data", "workers");
  const memoryDir = path.join(rootDir, "memory", "workers");
  ensureDirectory(runtimeDir);
  ensureDirectory(memoryDir);

  const filename = `worker-health-${timestampForFile(new Date(report.generatedAt))}.json`;
  const runtimePath = path.join(runtimeDir, filename);
  const memoryPath = path.join(memoryDir, filename);
  fs.writeFileSync(runtimePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(memoryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  return {
    runtimePath,
    memoryPath
  };
}

function runWorkerHealthDemo() {
  const registry = new WorkerRegistry();
  registry.register({
    workerId: "worker-health-stable",
    name: "Worker Health Stable",
    capabilities: ["backend"],
    concurrencyLimit: 1,
    readonly: true,
    enabled: true
  });
  registry.register({
    workerId: "worker-health-flaky",
    name: "Worker Health Flaky",
    capabilities: ["qa"],
    concurrencyLimit: 1,
    readonly: true,
    enabled: true
  });
  registry.register({
    workerId: "worker-health-paused",
    name: "Worker Health Paused",
    capabilities: ["frontend"],
    concurrencyLimit: 1,
    readonly: true,
    enabled: true,
    status: "paused",
    healthStatus: "paused"
  });
  registry.register({
    workerId: "worker-health-disabled",
    name: "Worker Health Disabled",
    capabilities: ["automation"],
    concurrencyLimit: 1,
    readonly: true,
    enabled: false,
    healthStatus: "unhealthy"
  });

  const executionResults = [
    { workerId: "worker-health-stable", status: "completed" },
    { workerId: "worker-health-stable", status: "completed" },
    { workerId: "worker-health-flaky", status: "failed" },
    { workerId: "worker-health-flaky", status: "failed" },
    { workerId: "worker-health-paused", status: "throttled" }
  ];
  const monitor = new WorkerHealthMonitor({
    minimumExecutions: 2,
    unhealthySuccessRateThreshold: 0.5
  });
  const health = monitor.evaluate(registry.list(), executionResults);
  const report = {
    workerHealthDemoId: `worker_health_demo_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    status: health.unhealthyWorkers.length > 0 ? "unhealthy_workers_detected" : "workers_healthy",
    health,
    fallback: {
      safeMode: true,
      runtimeExecutionChanged: false,
      destructiveActions: false
    },
    persistence: null
  };
  report.persistence = persistHealthReport(report);

  console.log(JSON.stringify({
    workerHealthDemoId: report.workerHealthDemoId,
    status: report.status,
    workers: report.health.workers.map((worker) => ({
      workerId: worker.workerId,
      healthStatus: worker.healthStatus,
      successRate: worker.successRate,
      failedExecutions: worker.failedExecutions,
      throttledState: worker.throttledState,
      pausedState: worker.pausedState,
      unhealthy: worker.unhealthy,
      reason: worker.reason
    })),
    unhealthyWorkers: report.health.unhealthyWorkers.map((worker) => worker.workerId),
    fallback: report.fallback,
    persistence: report.persistence
  }, null, 2));
}

if (require.main === module) {
  runWorkerHealthDemo();
}

module.exports = {
  persistHealthReport,
  runWorkerHealthDemo
};
