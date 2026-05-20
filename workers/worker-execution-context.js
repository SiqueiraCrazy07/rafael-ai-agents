function stableId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function readonlyClone(value) {
  return Object.freeze(JSON.parse(JSON.stringify(value || {})));
}

function createCorrelationId(workflowId) {
  return stableId(`correlation_${workflowId || "workflow"}`);
}

function createExecutionId(workerId, workflowId) {
  return stableId(`execution_${workerId || "worker"}_${workflowId || "workflow"}`);
}

function createExecutionContext({ job, worker, attempt = 1, correlationId, lease }) {
  const workflowId = job.workflowId || job.workflow || job.jobId;
  return readonlyClone({
    executionId: createExecutionId(worker.workerId, workflowId),
    correlationId: correlationId || createCorrelationId(workflowId),
    workflowId,
    jobId: job.jobId || workflowId,
    project: job.project || "platform",
    workerId: worker.workerId,
    attempt,
    leaseId: lease ? lease.leaseId : null,
    safetyMode: "readonly-safe-worker-runtime",
    readonly: true,
    destructiveActions: false,
    startedAt: new Date().toISOString(),
    job: {
      workflowId,
      priority: job.priority || "normal",
      requiredCapability: job.requiredCapability || null,
      maxRetries: job.maxRetries || 0,
      payload: job.payload || {}
    },
    worker: {
      workerId: worker.workerId,
      capabilities: worker.capabilities,
      concurrencyLimit: worker.concurrencyLimit,
      healthStatus: worker.healthStatus
    }
  });
}

module.exports = {
  createCorrelationId,
  createExecutionContext,
  createExecutionId,
  readonlyClone,
  stableId
};
