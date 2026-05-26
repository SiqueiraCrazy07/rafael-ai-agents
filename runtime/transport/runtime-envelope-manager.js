class RuntimeEnvelopeManager {
  createEnvelope(message = {}) {
    const now = new Date().toISOString();
    const transportId = message.transportId || `transport_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    return {
      envelopeId: `envelope_${transportId}`,
      transportId,
      messageId: message.messageId || `message_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      type: message.type || "runtime.message",
      sourceNodeId: message.sourceNodeId || "runtime-node-a",
      targetNodeId: message.targetNodeId || null,
      capability: message.capability || "runtime-read",
      correlationId: message.correlationId || `correlation_${transportId}`,
      executionId: message.executionId || null,
      workflowId: message.workflowId || "runtime-transport-workflow",
      project: message.project || "platform",
      createdAt: now,
      expiresAt: message.expiresAt || new Date(Date.now() + Number(message.ttlMs || 30000)).toISOString(),
      routing: {
        routingKey: message.routingKey || "runtime.transport",
        requiredCapability: message.capability || "runtime-read",
        preferredNodeId: message.preferredNodeId || null,
        avoidNodeIds: message.avoidNodeIds || []
      },
      replaySafe: {
        replayable: true,
        deterministicPayload: true,
        reason: "transport-envelope-is-readonly-metadata"
      },
      payload: message.payload || {},
      readonly: true,
      destructiveActions: false,
      safetyMode: "readonly-safe-runtime-envelope"
    };
  }
}

module.exports = {
  RuntimeEnvelopeManager
};
