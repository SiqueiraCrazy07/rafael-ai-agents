const fs = require("node:fs");
const path = require("node:path");
const { DistributedQueueRuntime } = require("../../queue/distributed-queue-runtime");
const { RuntimeStateReplicator } = require("../../replication/runtime-state-replicator");
const { RuntimeMessageBus } = require("../../transport/runtime-message-bus");
const { BrokerConsumerRegistry } = require("../broker-consumer-registry");
const { BrokerDeliveryPolicy } = require("../broker-delivery-policy");
const { BrokerFallbackManager } = require("../broker-fallback-manager");
const { BrokerHealthMonitor } = require("../broker-health-monitor");
const { FileBrokerAdapter } = require("../file-broker-adapter");
const { InMemoryBrokerAdapter } = require("../in-memory-broker-adapter");

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

function persistReport(rootDir, report) {
  const runtimeDir = path.join(rootDir, "runtime-data", "brokers");
  const memoryDir = path.join(rootDir, "memory", "brokers");
  ensureDir(runtimeDir);
  ensureDir(memoryDir);
  const filename = `broker-adapter-${timestampForFile()}-${report.brokerDemoId}.json`;
  const runtimePath = path.join(runtimeDir, filename);
  const memoryPath = path.join(memoryDir, filename);
  fs.writeFileSync(runtimePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(memoryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return { runtimePath, memoryPath };
}

function runBrokerAdapterDemo({ rootDir = process.cwd(), silent = false } = {}) {
  const inMemory = new InMemoryBrokerAdapter();
  const fileBroker = new FileBrokerAdapter({ rootDir });
  const adapters = [inMemory, fileBroker];
  const registry = new BrokerConsumerRegistry();
  const deliveryPolicy = new BrokerDeliveryPolicy();
  const healthMonitor = new BrokerHealthMonitor();
  const fallbackManager = new BrokerFallbackManager();

  const transport = new RuntimeMessageBus({ rootDir }).runDemo();
  const distributedQueue = new DistributedQueueRuntime({ rootDir }).runDemo();
  const replication = new RuntimeStateReplicator({ rootDir }).runDemo();

  const consumerRegistrations = adapters.flatMap((adapter) => {
    const transportConsumer = adapter.subscribe("runtime.transport", {
      consumerId: `${adapter.adapterName}-transport-consumer`,
      capabilities: ["runtime-read"]
    });
    const queueConsumer = adapter.subscribe("runtime.queue", {
      consumerId: `${adapter.adapterName}-queue-consumer`,
      capabilities: ["queue-read"]
    });
    return [
      registry.register({ adapterName: adapter.adapterName, topic: "runtime.transport", consumerId: transportConsumer.consumerId }),
      registry.register({ adapterName: adapter.adapterName, topic: "runtime.queue", consumerId: queueConsumer.consumerId, capabilities: ["queue-read"] })
    ];
  });

  const messages = [
    {
      topic: "runtime.transport",
      key: "transport-envelope",
      workflowId: "broker-transport-envelope",
      correlationId: transport.envelopes[0]?.correlationId,
      source: "broker-adapter-demo",
      payload: {
        transportReportId: transport.transportReportId,
        envelopeCount: transport.envelopes.length
      }
    },
    {
      topic: "runtime.queue",
      key: "queue-backpressure",
      workflowId: "broker-queue-backpressure",
      source: "broker-adapter-demo",
      payload: {
        simulateNack: true,
        backpressure: distributedQueue.backpressure.status,
        partitions: distributedQueue.partitionSummary.totalPartitions
      }
    },
    {
      topic: "runtime.replication",
      key: "replication-split-brain",
      workflowId: "broker-replication-split-brain",
      source: "broker-adapter-demo",
      payload: {
        simulateExpired: true,
        splitBrain: replication.consensus.splitBrain.detected
      }
    }
  ];

  const publications = adapters.flatMap((adapter) => messages.map((message) => adapter.publish(message)));
  const deliveries = [];
  const acks = [];
  const nacks = [];
  const retryPlans = [];
  const deadLetters = [];

  for (const publication of publications) {
    const matchingConsumer = registry.list().find((consumer) =>
      consumer.adapterName === publication.adapter && consumer.topic === publication.message.topic
    ) || registry.list().find((consumer) => consumer.adapterName === publication.adapter);
    const policy = deliveryPolicy.evaluate({ message: publication.message, consumer: matchingConsumer || { consumerId: "fallback-consumer" } });
    const delivery = {
      deliveryId: `broker_delivery_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      adapter: publication.adapter,
      messageId: publication.message.brokerMessageId,
      topic: publication.message.topic,
      consumerId: matchingConsumer?.consumerId || "fallback-consumer",
      status: policy.status === "ack" ? "delivered" : "delivery-failed",
      policy,
      readonly: true,
      safetyMode: "readonly-safe-broker-delivery"
    };
    deliveries.push(delivery);
    const adapter = adapters.find((item) => item.adapterName === publication.adapter);
    if (policy.status === "ack") {
      acks.push(adapter.ack(publication.message.brokerMessageId, delivery.consumerId));
    } else {
      nacks.push(adapter.nack(publication.message.brokerMessageId, delivery.consumerId, policy.retryMetadata.reason));
      if (policy.retryMetadata.retryEligible) {
        retryPlans.push({
          retryPlanId: `broker_retry_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
          adapter: publication.adapter,
          messageId: publication.message.brokerMessageId,
          nextAttempt: policy.retryMetadata.nextAttempt,
          retryDelayMs: policy.retryMetadata.retryDelayMs,
          executeRetry: false,
          safetyMode: "readonly-safe-broker-retry"
        });
      } else {
        deadLetters.push({
          deadLetterId: `broker_dlq_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
          adapter: publication.adapter,
          messageId: publication.message.brokerMessageId,
          reason: policy.dlqMetadata.reason,
          replayRecommendation: "replay-message-metadata-before-redelivery",
          safetyMode: "readonly-safe-broker-dlq"
        });
      }
      if (policy.dlqMetadata.eligible) {
        deadLetters.push({
          deadLetterId: `broker_dlq_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
          adapter: publication.adapter,
          messageId: publication.message.brokerMessageId,
          reason: policy.dlqMetadata.reason,
          replayRecommendation: "use-transport-and-replication-context-before-redelivery",
          safetyMode: "readonly-safe-broker-dlq"
        });
      }
    }
  }

  const health = healthMonitor.check(adapters);
  const fallback = fallbackManager.choose({ preferredAdapter: "redis-streams", adapters });
  const report = {
    brokerDemoId: `broker_demo_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    status: "broker_adapter_layer_ready",
    readonly: true,
    destructiveActions: false,
    realExternalBroker: false,
    adapters: adapters.map((adapter) => ({
      adapterName: adapter.adapterName,
      readonly: adapter.readonly,
      messages: adapter.listMessages().length,
      consumers: [...adapter.consumers.values()].flat().length,
      futureExternalAdapter: false
    })),
    futureBrokerReadiness: {
      redisStreams: "interface-ready-not-enabled",
      kafka: "interface-ready-not-enabled",
      nats: "interface-ready-not-enabled",
      rabbitmq: "interface-ready-not-enabled"
    },
    messagesPublished: publications.map((publication) => ({
      adapter: publication.adapter,
      messageId: publication.message.brokerMessageId,
      topic: publication.message.topic,
      durable: publication.durable,
      persistence: publication.persistence || null
    })),
    consumersRegistered: consumerRegistrations,
    deliveries,
    acknowledgements: {
      acks,
      nacks
    },
    retryMetadata: retryPlans,
    dlqMetadata: deadLetters,
    health,
    fallback,
    integrations: {
      runtimeTransport: transport.transportReportId,
      eventBus: "broker report is event-bus compatible but does not require external broker",
      distributedQueue: distributedQueue.distributedQueueReportId,
      replication: replication.replicationReportId,
      selfHealing: "DLQ and retry metadata are recovery-readable",
      telemetry: "memory/brokers is telemetry-readable",
      dashboard: "broker report is dashboard-ready"
    },
    safeMode: {
      jsonFallback: true,
      networkCalls: false,
      destructiveActions: false,
      behavior: "in-memory and file broker adapters simulate broker contracts only"
    },
    persistence: null
  };
  report.persistence = persistReport(rootDir, report);
  if (!silent) {
    console.log(JSON.stringify({
      brokerDemoId: report.brokerDemoId,
      status: report.status,
      adapters: report.adapters,
      messagesPublished: report.messagesPublished,
      consumersRegistered: report.consumersRegistered,
      ackNack: report.acknowledgements,
      retryMetadata: report.retryMetadata,
      dlqMetadata: report.dlqMetadata,
      health: report.health,
      fallback: report.fallback,
      integrations: report.integrations,
      persistence: report.persistence
    }, null, 2));
  }
  return report;
}

if (require.main === module) {
  runBrokerAdapterDemo();
}

module.exports = {
  runBrokerAdapterDemo
};
