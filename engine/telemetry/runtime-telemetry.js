class RuntimeTelemetry {
  summarizeExecution(execution) {
    const startedAt = execution.startedAt ? new Date(execution.startedAt).getTime() : null;
    const completedAt = execution.completedAt ? new Date(execution.completedAt).getTime() : Date.now();
    const durationMs = startedAt ? completedAt - startedAt : null;
    const failures = execution.logs.filter((log) => log.level === "error").length;

    return {
      executionId: execution.executionId,
      workflow: execution.workflow,
      project: execution.project,
      status: execution.status,
      durationMs,
      failures,
      retries: execution.retries.count,
      checkpoints: execution.checkpoints.length,
      outputs: execution.outputs.length,
      risks: execution.risks.length,
      finalStatus: execution.status,
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = {
  RuntimeTelemetry
};
