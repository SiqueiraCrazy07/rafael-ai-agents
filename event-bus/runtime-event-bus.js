const { EventAckManager } = require("./event-ack-manager");
const { EventBackpressureManager } = require("./event-backpressure-manager");
const { EventCorrelationEngine } = require("./event-correlation-engine");
const { EventDeadLetterQueue } = require("./event-dead-letter-queue");
const { EventPersistence } = require("./event-persistence");
const { EventRateLimiter } = require("./event-rate-limiter");
const { EventReplayEngine } = require("./event-replay-engine");
const { EventRouter } = require("./event-router");
const { EventStreamManager } = require("./event-stream-manager");
const { EventSubscriber } = require("./event-subscriber");
const { TopicManager } = require("./topic-manager");

const DEFAULT_ROUTES = Object.freeze([
  ["workflow.created", "runtime.workflow", "workflow"],
  ["workflow.queued", "runtime.workflow", "workflow"],
  ["workflow.completed", "runtime.workflow", "workflow"],
  ["workflow.failed", "runtime.workflow", "workflow"],
  ["worker.execution.started", "runtime.worker", "worker"],
  ["worker.execution.completed", "runtime.worker", "worker"],
  ["worker.unhealthy", "runtime.worker", "worker"],
  ["scheduler.plan.created", "runtime.scheduler", "scheduler"],
  ["autonomous.plan.created", "runtime.autonomous", "autonomous"],
  ["database.transaction.committed", "runtime.database", "database"],
  ["telemetry.metric.collected", "runtime.telemetry", "telemetry"],
  ["dashboard.refresh.requested", "runtime.dashboard", "dashboard"],
  ["plugin.hook.executed", "runtime.plugins", "plugins"],
  ["connector.health.changed", "runtime.connectors", "connectors"]
]);

class DistributedRuntimeEventBus {
  constructor({
    rootDir = process.cwd(),
    maxInMemoryEvents = 1000,
    maxEventsPerWindow = 100,
    rateWindowMs = 1000,
    useDatabase = true
  } = {}) {
    this.rootDir = rootDir;
    this.topicManager = new TopicManager();
    this.router = new EventRouter({ topicManager: this.topicManager });
    this.streamManager = new EventStreamManager();
    this.persistence = new EventPersistence({ rootDir, useDatabase });
    this.deadLetterQueue = new EventDeadLetterQueue({ persistence: this.persistence });
    this.ackManager = new EventAckManager();
    this.correlationEngine = new EventCorrelationEngine();
    this.backpressureManager = new EventBackpressureManager({ maxInMemoryEvents });
    this.rateLimiter = new EventRateLimiter({ maxEventsPerWindow, windowMs: rateWindowMs });
    this.replayEngine = new EventReplayEngine({ persistence: this.persistence, streamManager: this.streamManager });
    this.subscribers = new Map();
    this.initialization = null;
    this.readonly = true;
    this.safetyMode = "readonly-safe-distributed-event-bus";

    for (const [eventType, topic, routingKey] of DEFAULT_ROUTES) {
      this.router.registerRoute({ eventType, topic, routingKey });
    }
  }

  initialize() {
    this.initialization = this.persistence.initialize();
    return {
      ...this.initialization,
      topics: this.topicManager.listTopics().length,
      routes: this.router.listRoutes().length,
      safetyMode: this.safetyMode
    };
  }

  subscribe(topic, handler, options = {}) {
    this.topicManager.ensureTopic(topic);
    const subscription = new EventSubscriber({
      subscriptionId:
        options.subscriptionId ||
        `subscription_${topic}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      topic,
      routingKey: options.routingKey || "*",
      handler,
      maxRetries: options.maxRetries ?? 1,
      readonly: options.readonly !== false
    });
    const subscriptions = this.subscribers.get(topic) || [];
    subscriptions.push(subscription);
    this.subscribers.set(topic, subscriptions);
    return subscription.describe();
  }

  unsubscribe(subscriptionId) {
    let removed = false;
    for (const [topic, subscriptions] of this.subscribers.entries()) {
      const next = subscriptions.filter((subscription) => subscription.subscriptionId !== subscriptionId);
      if (next.length !== subscriptions.length) {
        removed = true;
        this.subscribers.set(topic, next);
      }
    }
    return removed;
  }

  publish(input) {
    if (!this.initialization) {
      this.initialize();
    }

    const rate = this.rateLimiter.allow();
    if (!rate.allowed) {
      const rejected = this.deadLetterQueue.add(input, rate.reason, { rate });
      return {
        ok: false,
        status: "rate-limited",
        deadLetter: rejected,
        fallback: {
          safeMode: true,
          reason: rate.reason
        }
      };
    }

    const pressure = this.backpressureManager.evaluate(this.streamManager.sequence);
    if (!pressure.accepted) {
      const rejected = this.deadLetterQueue.add(input, pressure.reason, { pressure });
      return {
        ok: false,
        status: "backpressure-rejected",
        deadLetter: rejected,
        fallback: {
          safeMode: true,
          reason: pressure.reason
        }
      };
    }

    const normalized = this.normalizeEvent(input);
    if (!normalized.ok) {
      const deadLetter = this.deadLetterQueue.add(input, normalized.reason, { validation: normalized });
      return {
        ok: false,
        status: "invalid-event",
        deadLetter,
        fallback: {
          safeMode: true,
          reason: normalized.reason
        }
      };
    }

    let event = normalized.event;
    const routing = this.router.route(event);
    event = {
      ...event,
      topic: routing.topic,
      routingKey: routing.routingKey,
      routing
    };

    if (!routing.matched && routing.topic === "runtime.dead-letter") {
      const deadLetter = this.deadLetterQueue.add(event, routing.reason, { routing });
      return {
        ok: false,
        status: "routing-failed",
        event,
        deadLetter,
        fallback: {
          safeMode: true,
          reason: routing.reason
        }
      };
    }

    event = this.streamManager.append(event);
    const trace = this.correlationEngine.record(event);
    const persistence = this.persistence.persistEvent(event);
    const delivery = this.deliver(event);

    return {
      ok: true,
      status: pressure.mode === "throttled" ? "published-throttled" : "published",
      event,
      trace,
      delivery,
      persistence,
      backpressure: pressure,
      fallback: {
        safeMode: true,
        reason: persistence.fallbackUsed ? "json-fallback-used" : "event-persisted"
      }
    };
  }

  normalizeEvent(input) {
    if (!input || typeof input !== "object") {
      return { ok: false, reason: "event-payload-required" };
    }
    if (!input.type) {
      return { ok: false, reason: "event-type-required" };
    }

    const enriched = this.correlationEngine.enrich(input);
    return {
      ok: true,
      event: {
        eventId:
          input.eventId ||
          `event_${input.type.replace(/[^a-z0-9]+/gi, "-")}_${Date.now()}_${Math.random()
            .toString(16)
            .slice(2, 8)}`,
        type: input.type,
        topic: input.topic || null,
        source: input.source || "distributed-runtime-event-bus",
        workflowId: enriched.workflowId,
        project: input.project || "platform",
        timestamp: enriched.timestamp,
        payload: input.payload || {},
        safetyMode: input.safetyMode || this.safetyMode,
        correlationId: enriched.correlationId,
        executionId: enriched.executionId,
        routingKey: input.routingKey || null,
        trace: enriched.trace,
        readonly: true
      }
    };
  }

  deliver(event) {
    const candidates = [
      ...(this.subscribers.get(event.topic) || []),
      ...(this.subscribers.get("*") || [])
    ].filter((subscription) => subscription.matches(event));

    const delivered = [];
    const failed = [];

    for (const subscription of candidates) {
      let attempts = 0;
      let deliveredToSubscriber = false;
      let lastError = null;

      while (attempts <= subscription.maxRetries && !deliveredToSubscriber) {
        attempts += 1;
        try {
          subscription.deliver(event);
          const ack = this.ackManager.ack({
            eventId: event.eventId,
            subscriptionId: subscription.subscriptionId,
            status: "acknowledged",
            reason: `delivered-attempt-${attempts}`
          });
          delivered.push({ subscriptionId: subscription.subscriptionId, attempts, ack });
          deliveredToSubscriber = true;
        } catch (error) {
          lastError = error;
        }
      }

      if (!deliveredToSubscriber) {
        const deadLetter = this.deadLetterQueue.add(event, "subscriber-failure", {
          subscriptionId: subscription.subscriptionId,
          attempts,
          error: lastError?.message || "unknown subscriber error"
        });
        failed.push({
          subscriptionId: subscription.subscriptionId,
          attempts,
          error: lastError?.message || "unknown subscriber error",
          deadLetterId: deadLetter.deadLetterId
        });
        this.ackManager.ack({
          eventId: event.eventId,
          subscriptionId: subscription.subscriptionId,
          status: "failed",
          reason: "subscriber-failure"
        });
      }
    }

    return {
      subscriberCount: candidates.length,
      delivered,
      failed
    };
  }

  replay(filters = {}) {
    return this.replayEngine.replay(filters);
  }

  status() {
    return {
      readonly: this.readonly,
      safetyMode: this.safetyMode,
      topics: this.topicManager.listTopics(),
      routes: this.router.listRoutes(),
      streams: this.streamManager.listStreams(),
      subscribers: [...this.subscribers.values()].flat().map((subscription) => subscription.describe()),
      deadLetterCount: this.deadLetterQueue.list().length,
      ackCount: this.ackManager.listAcks().length,
      correlation: this.correlationEngine.summary(),
      backpressure: this.backpressureManager.status(this.streamManager.sequence)
    };
  }
}

module.exports = {
  DEFAULT_ROUTES,
  DistributedRuntimeEventBus
};
