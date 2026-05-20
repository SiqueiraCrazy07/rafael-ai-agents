class WorkerExecutor {
  constructor(options = {}) {
    this.timeoutMs = options.timeoutMs || 1000;
    this.maxRetries = options.maxRetries ?? 1;
    this.throttlingMode = options.throttlingMode || "safe-simulated";
  }

  execute(worker, queueItem, options = {}) {
    const executionId =
      queueItem.executionId ||
      `worker_exec_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    const correlationId = options.correlationId || `worker_corr_${Date.now()}`;
    const maxRetries = queueItem.maxRetries ?? queueItem.payload?.maxRetries ?? this.maxRetries;
    const attempts = [];
    const startedAt = new Date();

    if (!worker) {
      return this.safeResult({
        executionId,
        correlationId,
        queueItem,
        status: "waiting_worker",
        attempts,
        error: "no-compatible-worker",
        startedAt
      });
    }

    if (worker.readonly === false) {
      return this.safeResult({
        executionId,
        correlationId,
        queueItem,
        worker,
        status: "blocked",
        attempts,
        error: "worker-runtime-v1-requires-readonly-worker",
        startedAt
      });
    }

    worker.running += 1;
    try {
      for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        const attemptStartedAt = new Date();
        const shouldTimeout = queueItem.payload?.simulateTimeout === true;
        const shouldFail =
          queueItem.payload?.simulateFailure === true ||
          (queueItem.payload?.failUntilAttempt !== undefined && attempt < queueItem.payload.failUntilAttempt);
        const durationMs = shouldTimeout
          ? this.timeoutMs + 1
          : 20 + String(queueItem.workflow || "").length + attempt;
        const timedOut = durationMs > this.timeoutMs;

        attempts.push({
          attempt,
          startedAt: attemptStartedAt.toISOString(),
          durationMs,
          timedOut,
          throttlingMode: this.throttlingMode
        });

        if (timedOut) {
          if (attempt < maxRetries) {
            continue;
          }
          return this.safeResult({
            executionId,
            correlationId,
            queueItem,
            worker,
            status: "failed",
            attempts,
            error: "safe-timeout-exceeded",
            startedAt
          });
        }

        if (shouldFail) {
          if (attempt < maxRetries) {
            continue;
          }
          return this.safeResult({
            executionId,
            correlationId,
            queueItem,
            worker,
            status: "failed",
            attempts,
            error: "simulated-worker-failure",
            startedAt
          });
        }

        return this.safeResult({
          executionId,
          correlationId,
          queueItem,
          worker,
          status: "completed",
          attempts,
          output: {
            summary: "Worker Runtime V1 simulated readonly workflow execution."
          },
          startedAt
        });
      }
    } catch (error) {
      return this.safeResult({
        executionId,
        correlationId,
        queueItem,
        worker,
        status: "failed",
        attempts,
        error: error.message,
        startedAt
      });
    } finally {
      worker.running = Math.max(0, worker.running - 1);
    }

    return this.safeResult({
      executionId,
      correlationId,
      queueItem,
      worker,
      status: "failed",
      attempts,
      error: "unknown-worker-execution-result",
      startedAt
    });
  }

  safeResult({ executionId, correlationId, queueItem, worker = null, status, attempts, error = null, output = null, startedAt }) {
    const completedAt = new Date();
    return {
      executionId,
      correlationId,
      queueId: queueItem.queueId || null,
      workflow: queueItem.workflow,
      project: queueItem.project || "platform",
      workerId: worker ? worker.workerId : null,
      status,
      attempts: attempts.length,
      attemptHistory: attempts,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs: completedAt.getTime() - startedAt.getTime(),
      error,
      output,
      safety: {
        readonly: true,
        destructiveActions: false,
        simulatedExecution: true
      }
    };
  }
}

module.exports = {
  WorkerExecutor
};
