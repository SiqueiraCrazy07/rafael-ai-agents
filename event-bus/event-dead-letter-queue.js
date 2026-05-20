class EventDeadLetterQueue {
  constructor({ persistence = null } = {}) {
    this.persistence = persistence;
    this.items = [];
  }

  add(event, reason, metadata = {}) {
    const item = {
      deadLetterId: `dlq_${event?.eventId || "unknown"}_${Date.now()}`,
      event: event || null,
      reason,
      metadata,
      safetyMode: "readonly-safe-dead-letter",
      createdAt: new Date().toISOString()
    };
    this.items.push(item);

    if (this.persistence) {
      this.persistence.persistReport(`dead-letter-${item.deadLetterId}`, item);
    }

    return item;
  }

  list() {
    return [...this.items];
  }
}

module.exports = {
  EventDeadLetterQueue
};
