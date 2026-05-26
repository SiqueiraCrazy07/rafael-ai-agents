const { RuntimeMessageBus } = require("../runtime-message-bus");

function runRuntimeTransportDemo() {
  const bus = new RuntimeMessageBus();
  const report = bus.runDemo();
  console.log(JSON.stringify({
    transportReportId: report.transportReportId,
    status: report.status,
    readonly: report.readonly,
    externalBroker: report.externalBroker,
    networkTransport: report.networkTransport,
    transportMetadata: report.transportMetadata,
    envelopes: report.envelopes.map((envelope) => ({
      envelopeId: envelope.envelopeId,
      transportId: envelope.transportId,
      messageId: envelope.messageId,
      type: envelope.type,
      sourceNodeId: envelope.sourceNodeId,
      targetNodeId: envelope.targetNodeId,
      correlationId: envelope.correlationId,
      routing: envelope.routing,
      replaySafe: envelope.replaySafe
    })),
    deliveries: report.deliveries.map((delivery) => ({
      deliveryId: delivery.deliveryId,
      transportId: delivery.transportId,
      targetNodeId: delivery.targetNodeId,
      status: delivery.status,
      ackStatus: delivery.ackStatus,
      stale: delivery.stale,
      staleReason: delivery.staleReason
    })),
    ackNack: report.acknowledgements,
    retryTransport: report.retryTransport,
    deadLetters: report.deadLetters,
    routing: report.routing,
    staleDeliveryDetection: report.staleDeliveryDetection,
    recoveryRecommendations: report.recoveryRecommendations,
    eventBus: report.eventBus,
    fallback: report.fallback,
    persistence: report.persistence
  }, null, 2));
  return report;
}

if (require.main === module) {
  runRuntimeTransportDemo();
}

module.exports = {
  runRuntimeTransportDemo
};
