class WorkerProcessSupervisor {
  constructor({ freezeAfterMs = 1000 } = {}) {
    this.freezeAfterMs = freezeAfterMs;
  }

  supervise({ processes = [], heartbeatStatus = [], results = [], exits = [] } = {}) {
    return processes.map((processRecord) => {
      const heartbeat = heartbeatStatus.find((item) => item.processId === processRecord.processId);
      const result = results.find((item) => item.processId === processRecord.processId);
      const exit = exits.find((item) => item.processId === processRecord.processId);
      const crashed = exit && exit.code !== 0;
      const frozen = heartbeat?.stale && !result;
      const failed = result?.status === "failed";
      const status = crashed ? "crashed" : frozen ? "frozen" : failed ? "failed" : result ? "completed" : "running";
      return {
        supervisorCheckId: `mp_supervisor_${processRecord.processId}_${Date.now()}`,
        processId: processRecord.processId,
        workerId: processRecord.workerId,
        status,
        healthy: status === "completed" || status === "running",
        crashDetected: Boolean(crashed),
        freezeDetected: Boolean(frozen),
        staleHeartbeat: Boolean(heartbeat?.stale),
        evidence: {
          heartbeatReason: heartbeat?.reason || null,
          exitCode: exit?.code ?? null,
          resultStatus: result?.status || null
        },
        recoveryRecommendation: status === "completed"
          ? null
          : {
              action: crashed ? "restart-worker-process" : frozen ? "quarantine-and-reroute" : "schedule-controlled-retry",
              reason: status,
              requiresHumanGate: crashed || frozen
            },
        safetyMode: "readonly-safe-worker-process-supervisor"
      };
    });
  }
}

module.exports = {
  WorkerProcessSupervisor
};
