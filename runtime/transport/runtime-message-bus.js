const fs = require("node:fs");
const path = require("node:path");
const { DistributedRuntimeEventBus } = require("../../event-bus/runtime-event-bus");
const { DistributedRuntimeCoordinator } = require("../distributed/distributed-runtime-coordinator");
const { DistributedQueueRuntime } = require("../queue/distributed-queue-runtime");
const { RuntimeStateReplicator } = require("../replication/runtime-state-replicator");
const { RuntimeAckManager } = require("./runtime-ack-manager");
const { RuntimeDeadLetterQueue } = require("./runtime-deadletter-queue");
const { RuntimeDeliveryTracker } = require("./runtime-delivery-tracker");
const { RuntimeEnvelopeManager } = require("./runtime-envelope-manager");
const { RuntimeMessageRouter } = require("./runtime-message-router");
const { RuntimeRetryTransport } = require("./runtime-retry-transport");
const { RuntimeTransportAudit } = require("./runtime-transport-audit");

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function safeReadJson(filePath) {
  try {
    return { ok: true, data: JSON.parse(fs.readFileSync(filePath, "utf8")) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function readLatestJson(rootDir, relativeDir) {
  const directory = path.join(rootDir, relativeDir);
  if (!fs.existsSync(directory)) {
    return {
      available: false,
      sourcePath: null,
      data: null,
      readErrors: [],
      fallback: { safeMode: true, reason: "directory-unavailable" }
    };
  }

  const readErrors = [];
  const files = fs.readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const sourcePath = path.join(directory, file);
      return { sourcePath, mtimeMs: fs.statSync(sourcePath).mtimeMs };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs);

  for (const file of files) {
    const read = safeReadJson(file.sourcePath);
    if (read.ok) {
      return { available: true, sourcePath: file.sourcePath, data: read.data, readErrors, fallback: null };
    }
    readErrors.push({ sourcePath: file.sourcePath, error: read.error });
  }

  return {
    available: false,
    sourcePath: null,
    data: null,
    readErrors,
    fallback: { safeMode: true, reason: "no-readable-json-files" }
  };
}

class RuntimeMessageBus {
  constructor({ rootDir = process.cwd() } = {}) {
    this.rootDir = rootDir;
    this.runtimeDir = path.join(rootDir, "runtime-data", "transport");
    this.memoryDir = path.join(rootDir, "memory", "transport");
    this.envelopeManager = new RuntimeEnvelopeManager();
    this.router = new RuntimeMessageRouter();
    this.deliveryTracker = new RuntimeDeliveryTracker();
    this.ackManager = new RuntimeAckManager();
    this.retryTransport = new RuntimeRetryTransport();
    this.deadLetterQueue = new RuntimeDeadLetterQueue();
    this.audit = new RuntimeTransportAudit({ rootDir });
    this.eventBus = new DistributedRuntimeEventBus({
      rootDir,
      maxInMemoryEvents: 50,
      maxEventsPerWindow: 100,
      useDatabase: process.env.RUNTIME_EVENT_BUS_SQLITE_ENABLED === "true"
    });
  }

  initialize() {
    ensureDir(this.runtimeDir);
    ensureDir(this.memoryDir);
    return {
      runtimeDir: this.runtimeDir,
      memoryDir: this.memoryDir,
      safetyMode: "readonly-safe-runtime-transport"
    };
  }

  loadSources() {
    return {
      distributedRuntime: readLatestJson(this.rootDir, "memory/distributed-runtime"),
      distributedQueue: readLatestJson(this.rootDir, "memory/distributed-queue"),
      replication: readLatestJson(this.rootDir, "memory/replication"),
      replay: readLatestJson(this.rootDir, "memory/replay"),
      selfHealing: readLatestJson(this.rootDir, "memory/self-healing"),
      eventBus: readLatestJson(this.rootDir, "memory/event-bus"),
      scheduler: readLatestJson(this.rootDir, "memory/worker-scheduler"),
      telemetry: readLatestJson(this.rootDir, "memory/telemetry"),
      dashboard: readLatestJson(this.rootDir, "memory/dashboard-web")
    };
  }

  runDemo() {
    const initialization = this.initialize();
    const distributedRuntime = new DistributedRuntimeCoordinator({ rootDir: this.rootDir }).runDemo();
    const distributedQueue = new DistributedQueueRuntime({ rootDir: this.rootDir }).runDemo();
    const replication = new RuntimeStateReplicator({ rootDir: this.rootDir }).runDemo();
    const sources = this.loadSources();

    const messages = this.demoMessages(replication);
    const envelopes = messages.map((message) => this.envelopeManager.createEnvelope(message));
    const routes = envelopes.map((envelope) => this.router.route({ envelope, distributedRuntime, replication }));
    const deliveries = envelopes.map((envelope, index) => this.deliveryTracker.createDelivery({ envelope, route: routes[index] }));
    const forcedExpired = deliveries.map((delivery, index) => index === deliveries.length - 1
      ? { ...delivery, expiresAt: new Date(Date.now() - 5000).toISOString() }
      : delivery);
    const staleChecked = this.deliveryTracker.detectStale(forcedExpired);
    const acks = staleChecked
      .filter((delivery) => delivery.status === "delivered-simulated" && !delivery.stale)
      .map((delivery) => this.ackManager.ack(delivery));
    const nacks = staleChecked
      .filter((delivery) => delivery.status !== "delivered-simulated" || delivery.stale)
      .map((delivery) => this.ackManager.nack(delivery, delivery.stale ? "delivery-expired-before-ack" : "no-safe-route"));
    const retryTransport = this.retryTransport.plan({ deliveries: staleChecked, nacks, staleDeliveries: staleChecked.filter((delivery) => delivery.stale) });
    const deadLetters = this.deadLetterQueue.collect({ deliveries: staleChecked, nacks, retryTransport });
    const eventBus = this.publishTransportEvent({ envelopes, deliveries: staleChecked, retryTransport, deadLetters });

    const report = {
      transportReportId: `runtime_transport_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      status: "runtime_transport_messaging_layer_ready",
      readonly: true,
      destructiveActions: false,
      externalBroker: false,
      networkTransport: false,
      initialization,
      sources: Object.fromEntries(Object.entries(sources).map(([key, source]) => [
        key,
        {
          available: source.available,
          sourcePath: source.sourcePath,
          readErrors: source.readErrors,
          fallback: source.fallback
        }
      ])),
      transportMetadata: {
        durableSimulation: true,
        envelopeCount: envelopes.length,
        deliveryCount: staleChecked.length,
        ackCount: acks.length,
        nackCount: nacks.length,
        deadLetterCount: deadLetters.totalDeadLetters
      },
      distributedRuntime: {
        clusterState: distributedRuntime.clusterState,
        failuresDetected: distributedRuntime.failuresDetected.length
      },
      distributedQueue: {
        partitionSummary: distributedQueue.partitionSummary,
        backpressure: distributedQueue.backpressure.status
      },
      replication: {
        replicationState: replication.replicationState,
        splitBrain: replication.consensus.splitBrain
      },
      envelopes,
      routing: routes,
      deliveries: staleChecked,
      acknowledgements: {
        acks,
        nacks
      },
      retryTransport,
      deadLetters,
      staleDeliveryDetection: staleChecked
        .filter((delivery) => delivery.stale)
        .map((delivery) => ({
          deliveryId: delivery.deliveryId,
          transportId: delivery.transportId,
          reason: delivery.staleReason,
          expiresAt: delivery.expiresAt
        })),
      recoveryRecommendations: this.recoveryRecommendations({ routes, staleChecked, retryTransport, deadLetters, replication }),
      integrations: {
        distributedRuntime: "node health and routing consumed",
        distributedQueue: "queue pressure and partition metadata consumed",
        replication: "split-brain and stale node metadata consumed",
        replay: "envelopes carry replay-safe metadata",
        selfHealing: "transport recovery recommendations are compatible with recovery planning",
        eventBus: "transport event published as readonly signal",
        scheduler: "transport routes are scheduler-readable",
        telemetry: "memory/transport is telemetry-readable",
        dashboard: "transport report is dashboard-ready"
      },
      eventBus,
      fallback: {
        safeMode: true,
        jsonFallback: true,
        behavior: "transport creates durable readonly envelopes and delivery plans only",
        missingSources: Object.entries(sources).filter(([, source]) => !source.available).map(([key]) => key)
      },
      persistence: null
    };
    report.persistence = this.audit.persist(report);
    return report;
  }

  demoMessages(replication) {
    const staleNodes = replication?.nodeSync?.replicationLag?.staleNodes || [];
    return [
      {
        type: "replication.snapshot.sync.requested",
        sourceNodeId: "runtime-node-a",
        targetNodeId: "runtime-node-b",
        preferredNodeId: "runtime-node-b",
        capability: "runtime-read",
        workflowId: "runtime-transport-snapshot-sync",
        payload: { purpose: "snapshot-sync", readonly: true }
      },
      {
        type: "queue.backpressure.notice",
        sourceNodeId: "runtime-node-a",
        capability: "queue-read",
        workflowId: "runtime-transport-queue-pressure",
        payload: { purpose: "queue-pressure-notice", readonly: true }
      },
      {
        type: "stale.node.probe",
        sourceNodeId: "runtime-node-a",
        preferredNodeId: staleNodes[0] || "runtime-node-c",
        capability: "runtime-read",
        workflowId: "runtime-transport-stale-delivery",
        ttlMs: 1,
        payload: { purpose: "stale-node-probe", readonly: true }
      }
    ];
  }

  recoveryRecommendations({ routes, staleChecked, retryTransport, deadLetters, replication }) {
    return [
      ...routes
        .filter((route) => route.fallback)
        .map((route) => ({
          type: "routing-failure",
          recommendation: "refresh-node-health-and-route-through-healthy-node",
          evidence: route.fallback
        })),
      ...staleChecked
        .filter((delivery) => delivery.stale)
        .map((delivery) => ({
          type: "stale-delivery",
          recommendation: "retry-with-refreshed-route-or-deadletter-after-human-gate",
          evidence: { deliveryId: delivery.deliveryId, transportId: delivery.transportId }
        })),
      ...(retryTransport.retryPlans || []).map((plan) => ({
        type: "retry-transport",
        recommendation: plan.recoveryRecommendation,
        evidence: { retryPlanId: plan.retryPlanId, deliveryId: plan.deliveryId }
      })),
      ...(deadLetters.deadLetters || []).map((item) => ({
        type: "dead-letter",
        recommendation: item.replayRecommendation,
        evidence: { deadLetterId: item.deadLetterId, reason: item.reason }
      })),
      replication?.consensus?.splitBrain?.detected
        ? {
            type: "split-brain-transport-guard",
            recommendation: "avoid-stale-owner-nodes-for-message-delivery",
            evidence: replication.consensus.splitBrain.evidence
          }
        : null
    ].filter(Boolean);
  }

  publishTransportEvent(payload) {
    try {
      this.eventBus.initialize();
      const publication = this.eventBus.publish({
        type: "scheduler.plan.created",
        source: "runtime-transport-messaging-layer",
        workflowId: "runtime-transport",
        correlationId: `runtime_transport_${Date.now()}`,
        routingKey: "scheduler",
        payload,
        safetyMode: "readonly-safe-runtime-transport"
      });
      return {
        eventPublished: publication.ok,
        eventId: publication.event?.eventId || null,
        status: publication.status,
        fallback: publication.fallback
      };
    } catch (error) {
      return {
        eventPublished: false,
        error: error.message,
        fallback: {
          safeMode: true,
          reason: "event-publication-failed"
        }
      };
    }
  }
}

module.exports = {
  RuntimeMessageBus,
  readLatestJson
};
