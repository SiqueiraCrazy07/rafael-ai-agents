class WorkerProcessIsolation {
  constructor({ maxPayloadBytes = 32 * 1024 } = {}) {
    this.maxPayloadBytes = maxPayloadBytes;
    this.blockedCommands = new Set(["write-file", "delete-file", "network-call", "shell", "deploy", "publish"]);
  }

  buildContext(worker = {}, job = {}) {
    const payloadBytes = Buffer.byteLength(JSON.stringify(job.payload || {}), "utf8");
    const violations = [];
    if (payloadBytes > this.maxPayloadBytes) {
      violations.push({
        type: "payload-too-large",
        reason: `payload exceeds ${this.maxPayloadBytes} bytes`,
        evidence: { payloadBytes }
      });
    }
    if (this.blockedCommands.has(job.command)) {
      violations.push({
        type: "destructive-command",
        reason: "destructive command blocked by multiprocess isolation",
        evidence: { command: job.command }
      });
    }
    if (worker.readonly === false || job.readonly === false) {
      violations.push({
        type: "readonly-required",
        reason: "worker and job must be readonly-safe",
        evidence: { workerReadonly: worker.readonly, jobReadonly: job.readonly }
      });
    }

    return {
      executionId: job.executionId || `mp_execution_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      correlationId: job.correlationId || `mp_correlation_${Date.now()}`,
      workerId: worker.workerId,
      workflowId: job.workflowId,
      capabilities: worker.capabilities || [],
      readonly: true,
      safeMode: true,
      payloadBytes,
      permittedPaths: ["runtime-data/multiprocess-workers", "memory/multiprocess-workers"],
      deniedActions: [...this.blockedCommands],
      violations,
      allowed: violations.length === 0,
      environment: {
        networkDisabled: true,
        destructiveActions: false,
        externalContainers: false,
        localSubprocessOnly: true
      },
      safetyMode: "readonly-safe-multiprocess-isolation"
    };
  }
}

module.exports = {
  WorkerProcessIsolation
};
