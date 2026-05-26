class RedisStreamPublisher {
  constructor({ adapter }) {
    this.adapter = adapter;
  }

  publishEnvelope({ stream, envelope, source = "redis-stream-publisher" }) {
    return this.adapter.publish({
      stream,
      key: envelope.messageId || envelope.transportId,
      workflowId: envelope.workflowId || "redis-stream-workflow",
      correlationId: envelope.correlationId,
      executionId: envelope.executionId,
      source,
      transport: {
        transportId: envelope.transportId,
        messageId: envelope.messageId,
        routing: envelope.routing
      },
      replaySafe: envelope.replaySafe || { replayable: true, deterministicPayload: true },
      payload: {
        envelope,
        readonly: true
      }
    });
  }
}

module.exports = {
  RedisStreamPublisher
};
