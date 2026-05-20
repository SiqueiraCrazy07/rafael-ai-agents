const { readonlyClone, stableId } = require("../worker-execution-context");

function createSandboxContext(input = {}) {
  const executionId = input.executionId || stableId(`sandbox_execution_${input.workflowId || "workflow"}`);
  const correlationId = input.correlationId || stableId(`sandbox_correlation_${input.workflowId || "workflow"}`);
  const policy = input.policy || {};

  return readonlyClone({
    executionId,
    correlationId,
    workerId: input.workerId || "unknown-worker",
    workflowId: input.workflowId || "unknown-workflow",
    project: input.project || "platform",
    allowedCapabilities: input.allowedCapabilities || [],
    readonly: true,
    destructiveActions: false,
    safeMode: input.safeMode || "readonly-safe-worker-sandbox",
    timeoutMs: input.timeoutMs,
    permittedPaths: policy.permittedPaths || [],
    deniedActions: policy.deniedActions || [],
    payload: input.payload || {},
    createdAt: new Date().toISOString()
  });
}

module.exports = {
  createSandboxContext
};
