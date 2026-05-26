class RuntimeDashboardStreamAdapter {
  adapt({ events = [], liveTelemetry = {}, backpressure = {}, subscribers = [] } = {}) {
    return {
      dashboardStreamId: `dashboard_stream_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      generatedAt: new Date().toISOString(),
      readonly: true,
      liveRuntimeUpdates: events.slice(0, 8).map((event) => ({
        eventId: event.streamEventId,
        type: event.type,
        channel: event.channel,
        status: event.payload?.status || "snapshot-ready",
        correlationId: event.correlationId
      })),
      topologyUpdates: {
        unhealthyNodes: liveTelemetry.unhealthyNodes || [],
        brokerHealth: liveTelemetry.brokerHealth,
        transportDeliveryStatus: liveTelemetry.transportDeliveryStatus
      },
      realtimeTimelineMetadata: {
        channelCount: new Set(events.map((event) => event.channel)).size,
        eventCount: events.length,
        subscriberCount: subscribers.length
      },
      streamHealthCards: [
        {
          label: "stream",
          status: backpressure.status === "throttled" ? "attention-required" : "healthy",
          value: backpressure.status
        },
        {
          label: "queue-pressure",
          status: liveTelemetry.queuePressure === "high" ? "attention-required" : "observable",
          value: liveTelemetry.queuePressure
        },
        {
          label: "broker-health",
          status: liveTelemetry.brokerHealth === "healthy" ? "healthy" : "observable",
          value: liveTelemetry.brokerHealth
        }
      ],
      safetyMode: "readonly-safe-dashboard-stream-adapter"
    };
  }
}

module.exports = {
  RuntimeDashboardStreamAdapter
};
