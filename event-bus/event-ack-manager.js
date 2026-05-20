class EventAckManager {
  constructor() {
    this.acks = [];
  }

  ack({ eventId, subscriptionId, status = "acknowledged", reason = "delivered" }) {
    const entry = {
      ackId: `ack_${eventId}_${subscriptionId}_${Date.now()}`,
      eventId,
      subscriptionId,
      status,
      reason,
      acknowledgedAt: new Date().toISOString()
    };
    this.acks.push(entry);
    return entry;
  }

  listAcks() {
    return [...this.acks];
  }
}

module.exports = {
  EventAckManager
};
