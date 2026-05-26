class RuntimeEventStreamer {
  buildEvents(sources = {}) {
    const now = new Date().toISOString();
    const sourcePairs = [
      ["workers", "runtime.workers"],
      ["queue", "runtime.queue"],
      ["distributedQueue", "runtime.queue"],
      ["brokers", "runtime.brokers"],
      ["transport", "runtime.transport"],
      ["replication", "runtime.replication"],
      ["replay", "runtime.replay"],
      ["selfHealing", "runtime.recovery"],
      ["telemetry", "runtime.telemetry"],
      ["dashboard", "runtime.dashboard"],
      ["eventBus", "runtime.events"]
    ];

    return sourcePairs.map(([sourceName, channel]) => {
      const source = sources[sourceName] || {};
      return {
        streamEventId: `stream_event_${sourceName}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
        type: `${channel}.snapshot`,
        channel,
        source: sourceName,
        timestamp: now,
        workflowId: source.data?.workflowId || source.data?.seededExecution?.workflowId || "runtime-streaming",
        correlationId: source.data?.correlationId || source.data?.seededExecution?.correlationId || `stream_correlation_${Date.now()}`,
        payload: {
          available: Boolean(source.available),
          sourcePath: source.sourcePath || null,
          status: source.data?.status || source.data?.readiness || "snapshot-ready",
          reportId: source.data?.brokerDemoId ||
            source.data?.transportReportId ||
            source.data?.distributedQueueReportId ||
            source.data?.replicationReportId ||
            source.data?.telemetryReportId ||
            source.data?.replayDemoId ||
            source.data?.recoveryDemoId ||
            null
        },
        readonly: true,
        safetyMode: "readonly-safe-runtime-stream-event"
      };
    });
  }
}

module.exports = {
  RuntimeEventStreamer
};
