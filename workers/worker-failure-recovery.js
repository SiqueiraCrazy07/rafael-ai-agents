class WorkerFailureRecovery {
  decide(job, executionResult) {
    const attempt = executionResult.attempt || 1;
    const maxRetries = Number(job.maxRetries || 0);
    const retryable = executionResult.status === "failed" && attempt <= maxRetries;

    if (retryable) {
      return {
        workflowId: executionResult.workflowId,
        action: "retry",
        nextAttempt: attempt + 1,
        maxRetries,
        retryDelayMs: Number(job.retryDelayMs || 100),
        reason: "execution-failed-with-retry-budget",
        safetyMode: "readonly-safe-retry"
      };
    }

    if (executionResult.status === "waiting_worker") {
      return {
        workflowId: executionResult.workflowId,
        action: "protected-queue",
        reason: "no-healthy-worker-available",
        safetyMode: "readonly-safe-protected-queue"
      };
    }

    return {
      workflowId: executionResult.workflowId,
      action: executionResult.status === "failed" ? "mark-failed" : "none",
      reason: executionResult.status === "failed" ? "retry-budget-exhausted" : "execution-successful",
      safetyMode: "readonly-safe-recovery"
    };
  }
}

module.exports = {
  WorkerFailureRecovery
};
