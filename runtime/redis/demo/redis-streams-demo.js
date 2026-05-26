const { runBrokerAdapterDemo } = require("../../brokers/demo/broker-adapter-demo");
const { DistributedQueueRuntime } = require("../../queue/distributed-queue-runtime");
const { runWorkflowReplayDemo } = require("../../replay/demo/workflow-replay-demo");
const { RuntimeMessageBus, readLatestJson } = require("../../transport/runtime-message-bus");
const { runRuntimeRecoveryDemo } = require("../../../self-healing/demo/runtime-recovery-demo");
const { runRuntimeObservabilityDemo } = require("../../../telemetry/runtime-observability-demo");
const { RedisStreamAudit } = require("../redis-stream-audit");
const { RedisStreamConsumer } = require("../redis-stream-consumer");
const { RedisStreamFallback } = require("../redis-stream-fallback");
const { RedisStreamGroupManager } = require("../redis-stream-group-manager");
const { RedisStreamHealth } = require("../redis-stream-health");
const { RedisStreamPublisher } = require("../redis-stream-publisher");
const { RedisStreamRetry } = require("../redis-stream-retry");
const { RedisStreamsAdapter } = require("../redis-streams-adapter");

function buildDemoEnvelopes(transport) {
  const envelopes = Array.isArray(transport.envelopes) ? transport.envelopes : [];
  if (envelopes.length > 0) {
    return envelopes.slice(0, 3);
  }
  return [
    {
      transportId: `redis_transport_${Date.now()}`,
      messageId: `redis_message_${Date.now()}`,
      workflowId: "redis-streams-demo-workflow",
      correlationId: `redis_correlation_${Date.now()}`,
      routing: { routingKey: "runtime.redis", requiredCapability: "runtime-read" },
      replaySafe: { replayable: true, deterministicPayload: true }
    }
  ];
}

async function runRedisStreamsDemo({ rootDir = process.cwd() } = {}) {
  const adapter = new RedisStreamsAdapter({ rootDir });
  const publisher = new RedisStreamPublisher({ adapter });
  const consumer = new RedisStreamConsumer({ adapter });
  const groupManager = new RedisStreamGroupManager();
  const healthMonitor = new RedisStreamHealth();
  const retryEngine = new RedisStreamRetry();
  const fallbackManager = new RedisStreamFallback({ rootDir });
  const audit = new RedisStreamAudit({ rootDir });

  const broker = runBrokerAdapterDemo({ rootDir, silent: true });
  const transport = new RuntimeMessageBus({ rootDir }).runDemo();
  const distributedQueue = new DistributedQueueRuntime({ rootDir }).runDemo();
  const replay = runWorkflowReplayDemo();

  const streams = [
    "runtime.transport.stream",
    "runtime.queue.stream",
    "runtime.replay.stream"
  ];
  const groups = streams.map((stream) => groupManager.registerGroup({ stream, groupId: "runtime-readers" }));
  const groupConsumers = streams.map((stream, index) => groupManager.registerConsumer({
    stream,
    groupId: "runtime-readers",
    consumerId: `redis-runtime-consumer-${index + 1}`,
    nodeId: index === 1 ? "runtime-node-b" : "runtime-node-a"
  }));

  const envelopes = buildDemoEnvelopes(transport);
  const publications = envelopes.map((envelope, index) => publisher.publishEnvelope({
    stream: streams[index % streams.length],
    envelope,
    source: "redis-streams-demo"
  }));
  const publishedMessages = publications.map((publication) => publication.message);
  if (publishedMessages[1]) {
    publishedMessages[1].payload.simulateStale = true;
  }

  const consumption = streams.map((stream, index) => consumer.consume({
    stream,
    groupId: "runtime-readers",
    consumerId: groupConsumers[index].consumerId,
    messages: publishedMessages.filter((message) => message.stream === stream || message.topic === stream)
  }));
  const deliveries = consumption.flatMap((item) => item.deliveries);
  const pending = deliveries
    .filter((delivery) => delivery.status !== "delivered")
    .map((delivery) => groupManager.recordPending({ stream: delivery.stream, groupId: delivery.groupId, delivery }));
  const allGroups = groupManager.listGroups();
  const health = healthMonitor.evaluate({ adapter, groups: allGroups, streamMessages: publishedMessages });
  const fallback = fallbackManager.choose({ redisHealth: health });
  const retry = retryEngine.plan({ deliveries });

  const selfHealing = runRuntimeRecoveryDemo();
  const telemetry = runRuntimeObservabilityDemo({});
  const streamingSource = readLatestJson(rootDir, "memory/streaming");
  const multiprocessWorkersSource = readLatestJson(rootDir, "memory/multiprocess-workers");

  const report = {
    redisStreamsDemoId: `redis_streams_demo_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    status: "redis_streams_runtime_integration_ready",
    readonly: true,
    destructiveActions: false,
    redisOptional: true,
    redisFeatureFlag: {
      env: "REDIS_STREAMS_ENABLED",
      enabled: adapter.enabled,
      default: false
    },
    adapter: adapter.health(),
    streams: streams.map((stream) => ({
      stream,
      publishedMessages: publishedMessages.filter((message) => message.stream === stream || message.topic === stream).length,
      replaySafe: true,
      readonly: true
    })),
    groups: allGroups,
    consumers: groupConsumers,
    publications: publications.map((publication) => ({
      stream: publication.stream,
      messageId: publication.message.brokerMessageId,
      redisStreamId: publication.message.redisStreamId,
      status: publication.status,
      fallbackUsed: Boolean(publication.fallback),
      fallback: publication.fallback ? {
        adapter: publication.fallback.adapter,
        status: publication.fallback.status,
        durable: publication.fallback.durable
      } : null
    })),
    deliveries,
    acknowledgements: {
      acks: consumption.flatMap((item) => item.acks),
      nacks: consumption.flatMap((item) => item.nacks)
    },
    pending,
    health,
    streamLag: health.streamLag,
    retryMetadata: retry,
    fallback,
    integrations: {
      brokerLayer: broker.brokerDemoId,
      runtimeTransport: transport.transportReportId,
      distributedQueue: distributedQueue.distributedQueueReportId,
      replay: replay.replayDemoId || replay.status,
      selfHealing: selfHealing.runtimeRecoveryDemoId || selfHealing.status,
      streaming: streamingSource.available ? streamingSource.data.streamingDemoId || streamingSource.data.status : "streaming-source-unavailable-safe-fallback",
      telemetry: telemetry.telemetryReportId,
      dashboard: "redis report is dashboard-readable",
      multiprocessWorkers: multiprocessWorkersSource.available ? multiprocessWorkersSource.data.multiprocessWorkerDemoId || multiprocessWorkersSource.data.status : "multiprocess-workers-source-unavailable-safe-fallback",
      localBrokerPreserved: true
    },
    fallbackBehavior: {
      safeMode: true,
      jsonFallback: true,
      localBrokerFallback: fallback.selected,
      runtimeInterrupted: false,
      behavior: "redis streams are optional; local broker handles messages when redis is unavailable"
    },
    risks: [
      "Redis client is not required in V1 and no live Redis command is executed by default",
      "consumer groups and pending metadata are readiness metadata unless Redis is enabled in a future phase",
      "ack/nack are readonly metadata and do not mutate Redis in this V1",
      "stream lag is estimated from local metadata when Redis is unavailable"
    ],
    persistence: null
  };
  report.persistence = audit.persist(report);

  console.log(JSON.stringify({
    redisStreamsDemoId: report.redisStreamsDemoId,
    status: report.status,
    redisFeatureFlag: report.redisFeatureFlag,
    streams: report.streams,
    groups: report.groups.map((group) => ({
      groupId: group.groupId,
      stream: group.stream,
      consumers: group.consumers.length,
      pending: group.pending.length
    })),
    consumers: report.consumers,
    ackNack: report.acknowledgements,
    pending: report.pending,
    streamLag: report.streamLag,
    health: report.health,
    fallback: report.fallback,
    retryMetadata: report.retryMetadata,
    integrations: report.integrations,
    persistence: report.persistence
  }, null, 2));
  return report;
}

if (require.main === module) {
  runRedisStreamsDemo().catch((error) => {
    console.error(JSON.stringify({
      status: "redis_streams_demo_failed",
      error: error.message,
      fallback: {
        safeMode: true,
        reason: "redis-streams-demo-error"
      }
    }, null, 2));
    process.exitCode = 1;
  });
}

module.exports = {
  runRedisStreamsDemo
};
