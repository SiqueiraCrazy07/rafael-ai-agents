class RuntimeLiveTelemetryStream {
  build({ telemetry = {}, distributedQueue = {}, distributedRuntime = {}, brokers = {}, transport = {}, replication = {} } = {}) {
    const metrics = telemetry.data?.metrics || {};
    const queuePressure = distributedQueue.data?.pressure?.status || distributedQueue.data?.backpressure?.status || "unknown";
    const clusterState = distributedRuntime.data?.clusterState || {};
    const brokerHealth = brokers.data?.health?.healthy === true
      ? "healthy"
      : brokers.data?.health?.status || brokers.data?.health?.overallStatus || "unknown";
    const transportStatus = transport.data?.status || "unknown";
    const replicationLag = replication.data?.nodeSync?.replicationLag || {};
    const unhealthyNodes = Array.isArray(distributedRuntime.data?.nodeHealth)
      ? distributedRuntime.data.nodeHealth.filter((node) => node.status !== "healthy" || node.unhealthy).map((node) => node.nodeId)
      : [];

    return {
      liveTelemetryId: `live_telemetry_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      generatedAt: new Date().toISOString(),
      channel: "runtime.telemetry",
      throughput: {
        events: metrics.eventThroughput?.total || 0,
        decisions: metrics.decisionThroughput?.total || 0,
        workflows: metrics.workflowExecutions?.total || 0
      },
      queuePressure,
      workerHealth: metrics.unhealthyWorkers || { count: 0, workerIds: [] },
      unhealthyNodes,
      replayPressure: clusterState.replayPressure || "unknown",
      replicationLag: {
        staleNodes: replicationLag.staleNodes || [],
        maxLagMs: replicationLag.maxLagMs || 0
      },
      transportDeliveryStatus: {
        status: transportStatus,
        deliveryCount: transport.data?.transportMetadata?.deliveryCount || 0,
        nackCount: transport.data?.transportMetadata?.nackCount || 0
      },
      brokerHealth,
      saturation: {
        queue: distributedQueue.data?.saturationProtection?.collapseRisk || false,
        stream: false,
        workers: metrics.unhealthyWorkers?.count || 0
      },
      readonly: true,
      safetyMode: "readonly-safe-live-telemetry"
    };
  }
}

module.exports = {
  RuntimeLiveTelemetryStream
};
