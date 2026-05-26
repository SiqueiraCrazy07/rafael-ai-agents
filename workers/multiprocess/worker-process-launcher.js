const { fork } = require("node:child_process");

const CHILD_SCRIPT = `
process.on("message", async (message) => {
  if (!message || message.type !== "execute") {
    return;
  }
  const context = message.context || {};
  const job = message.job || {};
  const heartbeat = {
    type: "heartbeat",
    processId: context.processId,
    workerId: context.workerId,
    timestamp: new Date().toISOString(),
    metrics: { phase: "executing", readonly: true }
  };
  if (process.send) {
    process.send(heartbeat);
  }
  const result = {
    type: "result",
    processId: context.processId,
    workerId: context.workerId,
    executionId: context.executionId,
    correlationId: context.correlationId,
    workflowId: context.workflowId,
    status: job.simulateFailure ? "failed" : "completed",
    reason: job.simulateFailure ? "simulated-readonly-worker-failure" : "readonly-workflow-simulated",
    output: {
      readonly: true,
      processedCapabilities: context.capabilities || [],
      destructiveActions: false
    },
    timestamp: new Date().toISOString(),
    safetyMode: "readonly-safe-child-worker"
  };
  const delay = Number(job.simulateFreeze ? 2000 : 25);
  setTimeout(() => {
    if (process.send) {
      process.send(result);
    }
    process.exit(job.simulateCrash ? 2 : 0);
  }, delay);
});
`;

class WorkerProcessLauncher {
  constructor({ nodeExecutable = process.execPath, timeoutMs = 1500 } = {}) {
    this.nodeExecutable = nodeExecutable;
    this.timeoutMs = timeoutMs;
  }

  launch({ worker, job, context }) {
    const processId = `mp_process_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    const child = fork("-e", [CHILD_SCRIPT], {
      execPath: this.nodeExecutable,
      silent: true,
      env: {
        RAFAEL_WORKER_READONLY: "true",
        RAFAEL_WORKER_SAFE_MODE: "true",
        RAFAEL_WORKER_ID: worker.workerId,
        RAFAEL_PROCESS_ID: processId
      }
    });
    const startedAt = new Date().toISOString();
    const processRecord = {
      processId,
      pid: child.pid,
      workerId: worker.workerId,
      workflowId: job.workflowId,
      executionId: context.executionId,
      correlationId: context.correlationId,
      status: "started",
      healthStatus: "starting",
      startedAt,
      timeoutMs: this.timeoutMs,
      environment: {
        readonly: true,
        safeMode: true,
        localSubprocess: true,
        networkDisabledByPolicy: true
      },
      safetyMode: "readonly-safe-worker-process-launch"
    };
    child.send({
      type: "execute",
      processId,
      worker,
      job,
      context: { ...context, processId }
    });
    return { child, processRecord };
  }
}

module.exports = {
  WorkerProcessLauncher
};
