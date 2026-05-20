const fs = require("node:fs");
const path = require("node:path");

const EVENT_TYPES = Object.freeze({
  WORKFLOW_CREATED: "workflow-created",
  WORKFLOW_QUEUED: "workflow-queued",
  WORKFLOW_PAUSED: "workflow-paused",
  WORKFLOW_REROUTED: "workflow-rerouted",
  WORKFLOW_THROTTLED: "workflow-throttled",
  WORKFLOW_RECOVERING: "workflow-recovering",
  WORKFLOW_COMPLETED: "workflow-completed",
  WORKFLOW_FAILED: "workflow-failed",
  WORKFLOW_QUARANTINED: "workflow-quarantined",
  DECISION_CREATED: "decision-created",
  ENFORCEMENT_APPLIED: "enforcement-applied",
  RECOVERY_TRIGGERED: "recovery-triggered",
  WORKER_LEASE_CREATED: "worker-lease-created",
  WORKER_LEASE_EXPIRED: "worker-lease-expired",
  WORKFLOW_REBALANCED: "workflow-rebalanced",
  WORKER_OVERLOADED: "worker-overloaded",
  WORKER_UNHEALTHY: "worker-unhealthy"
});

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

function safeReadJson(filePath) {
  try {
    return {
      ok: true,
      data: JSON.parse(fs.readFileSync(filePath, "utf8"))
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message
    };
  }
}

class RuntimeEventBus {
  constructor({ rootDir = process.cwd(), persistOnPublish = true } = {}) {
    this.rootDir = rootDir;
    this.persistOnPublish = persistOnPublish;
    this.subscribers = new Map();
    this.history = [];
    this.deliveryErrors = [];
  }

  subscribe(eventType, handler, options = {}) {
    if (!eventType) {
      throw new Error("eventType is required");
    }
    if (typeof handler !== "function") {
      throw new Error("handler must be a function");
    }

    const subscriptionId =
      options.subscriptionId ||
      `subscription_${eventType}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    const subscriptions = this.subscribers.get(eventType) || [];
    subscriptions.push({
      subscriptionId,
      handler,
      createdAt: new Date().toISOString()
    });
    this.subscribers.set(eventType, subscriptions);

    return subscriptionId;
  }

  unsubscribe(subscriptionId) {
    let removed = false;
    for (const [eventType, subscriptions] of this.subscribers.entries()) {
      const nextSubscriptions = subscriptions.filter(
        (subscription) => subscription.subscriptionId !== subscriptionId
      );
      if (nextSubscriptions.length !== subscriptions.length) {
        removed = true;
        this.subscribers.set(eventType, nextSubscriptions);
      }
    }

    return removed;
  }

  publish(eventInput) {
    const event = this.normalizeEvent(eventInput);
    this.history.push(event);

    const subscribers = [
      ...(this.subscribers.get(event.type) || []),
      ...(this.subscribers.get("*") || [])
    ];
    for (const subscription of subscribers) {
      try {
        subscription.handler(event);
      } catch (error) {
        this.deliveryErrors.push({
          eventId: event.eventId,
          subscriptionId: subscription.subscriptionId,
          error: error.message,
          failedAt: new Date().toISOString()
        });
      }
    }

    const persistence = this.persistOnPublish ? this.persistEvent(event) : null;

    return {
      event,
      deliveredTo: subscribers.map((subscription) => subscription.subscriptionId),
      persistence
    };
  }

  replay({ eventType = null, correlationId = null, workflowId = null, includePersisted = true } = {}) {
    const replaySource = includePersisted ? this.loadPersistedEvents().events : this.history;
    return replaySource.filter((event) => {
      if (eventType && event.type !== eventType) {
        return false;
      }
      if (correlationId && event.correlationId !== correlationId) {
        return false;
      }
      if (workflowId && event.workflowId !== workflowId) {
        return false;
      }
      return true;
    });
  }

  listSubscribers() {
    return Object.fromEntries(
      [...this.subscribers.entries()].map(([eventType, subscriptions]) => [
        eventType,
        subscriptions.map((subscription) => ({
          subscriptionId: subscription.subscriptionId,
          createdAt: subscription.createdAt
        }))
      ])
    );
  }

  normalizeEvent(input) {
    if (!input?.type) {
      throw new Error("event type is required");
    }
    if (!Object.values(EVENT_TYPES).includes(input.type)) {
      throw new Error(`unsupported event type: ${input.type}`);
    }

    const timestamp = input.timestamp || new Date().toISOString();
    return {
      eventId:
        input.eventId ||
        `event_${input.type}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      type: input.type,
      source: input.source || "runtime-event-bus",
      workflowId: input.workflowId || "runtime-operational-workflow",
      project: input.project || "platform",
      timestamp,
      payload: input.payload || {},
      safetyMode: input.safetyMode || "observe-only",
      correlationId: input.correlationId || `correlation_${timestamp}`
    };
  }

  persistEvent(event) {
    const runtimeDir = path.join(this.rootDir, "runtime-data", "events");
    const memoryDir = path.join(this.rootDir, "memory", "events");
    ensureDirectory(runtimeDir);
    ensureDirectory(memoryDir);

    const filename = `${timestampForFile(new Date(event.timestamp))}-${event.type}-${event.eventId}.json`;
    const runtimePath = path.join(runtimeDir, filename);
    const memoryPath = path.join(memoryDir, filename);

    fs.writeFileSync(runtimePath, `${JSON.stringify(event, null, 2)}\n`, "utf8");
    fs.writeFileSync(memoryPath, `${JSON.stringify(event, null, 2)}\n`, "utf8");

    return {
      runtimePath,
      memoryPath
    };
  }

  loadPersistedEvents() {
    const memoryDir = path.join(this.rootDir, "memory", "events");
    if (!fs.existsSync(memoryDir)) {
      return {
        events: [...this.history],
        readErrors: []
      };
    }

    const events = [];
    const readErrors = [];
    const files = fs
      .readdirSync(memoryDir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => path.join(memoryDir, file));

    for (const filePath of files) {
      const read = safeReadJson(filePath);
      if (read.ok) {
        events.push(read.data);
      } else {
        readErrors.push({
          path: filePath,
          error: read.error
        });
      }
    }

    return {
      events: events.sort((left, right) => left.timestamp.localeCompare(right.timestamp)),
      readErrors
    };
  }
}

module.exports = {
  EVENT_TYPES,
  RuntimeEventBus
};
