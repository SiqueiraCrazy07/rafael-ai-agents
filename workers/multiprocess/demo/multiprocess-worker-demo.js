const { MultiprocessWorkerRuntime } = require("../multiprocess-worker-runtime");

async function runMultiprocessWorkerDemo({ silent = false } = {}) {
  const runtime = new MultiprocessWorkerRuntime();
  const report = await runtime.runDemo();
  if (!silent) {
    console.log(JSON.stringify({
      multiprocessWorkerDemoId: report.multiprocessWorkerDemoId,
      status: report.status,
      subprocessWorkers: report.subprocessWorkers.map((process) => ({
        processId: process.processId,
        pid: process.pid || null,
        workerId: process.workerId,
        workflowId: process.workflowId,
        status: process.status,
        healthStatus: process.healthStatus
      })),
      processLifecycle: report.executionMetadata,
      heartbeats: report.heartbeats,
      staleDetection: report.staleDetection,
      supervisorChecks: report.supervisorChecks,
      recoveryRecommendations: report.recoveryRecommendations,
      workerIsolation: report.workerIsolation,
      quarantineMetadata: report.quarantineMetadata,
      integrations: report.integrations,
      fallback: report.fallback,
      persistence: report.persistence
    }, null, 2));
  }
  return report;
}

if (require.main === module) {
  runMultiprocessWorkerDemo().catch((error) => {
    console.error(JSON.stringify({
      status: "multiprocess_worker_demo_failed",
      error: error.message,
      fallback: {
        safeMode: true,
        reason: "multiprocess-worker-demo-error"
      }
    }, null, 2));
    process.exitCode = 1;
  });
}

module.exports = {
  runMultiprocessWorkerDemo
};
