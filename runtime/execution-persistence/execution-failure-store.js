const { timestampForFile } = require("./execution-persistence-engine");

function classifyFailure(error) {
  const message = String(error?.message || error || "unknown failure").toLowerCase();
  if (message.includes("timeout")) return "timeout";
  if (message.includes("worker")) return "worker-failure";
  if (message.includes("subscriber")) return "event-subscriber-failure";
  if (message.includes("validation")) return "validation-failure";
  return "runtime-failure";
}

class ExecutionFailureStore {
  constructor({ engine }) {
    this.engine = engine;
  }

  recordFailure(input) {
    const timestamp = input.timestamp || new Date().toISOString();
    const failureType = input.failureType || classifyFailure(input.error);
    const retryEligible = input.retryEligible ?? ["timeout", "worker-failure", "event-subscriber-failure"].includes(failureType);
    const failure = {
      failureId:
        input.failureId ||
        `execution_failure_${input.executionId}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      type: "execution-failure",
      workflowId: input.workflowId,
      workerId: input.workerId || null,
      executionId: input.executionId,
      correlationId: input.correlationId,
      timestamp,
      failureType,
      error: {
        message: input.error?.message || String(input.error || "unknown failure"),
        code: input.error?.code || null
      },
      retryEligible,
      recoveryRecommendation:
        input.recoveryRecommendation ||
        (retryEligible ? "schedule-controlled-retry" : "route-to-human-gate-or-protected-queue"),
      safetyMode: input.safetyMode || "readonly-safe-execution-failure",
      source: input.source || "execution-failure-store"
    };

    failure.persistence = this.engine.persistRecord(
      "execution_failures",
      failure,
      {
        runtimeDir: this.engine.failureRuntimeDir,
        memoryDir: this.engine.failureMemoryDir
      },
      `${timestampForFile(new Date(timestamp))}-${failure.executionId}-${failure.failureId}.json`
    );
    return failure;
  }
}

module.exports = {
  ExecutionFailureStore,
  classifyFailure
};
