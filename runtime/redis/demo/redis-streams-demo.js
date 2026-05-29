const fs = require("node:fs");
const path = require("node:path");
const { RedisStreamAudit } = require("../redis-stream-audit");
const { RedisStreamConsumer } = require("../redis-stream-consumer");
const { RedisStreamFallback } = require("../redis-stream-fallback");
const { RedisStreamGroupManager } = require("../redis-stream-group-manager");
const { RedisStreamHealth } = require("../redis-stream-health");
const { RedisStreamPublisher } = require("../redis-stream-publisher");
const { RedisStreamRetry } = require("../redis-stream-retry");
const { RedisStreamsAdapter } = require("../redis-streams-adapter");

function readLatestSummary(rootDir, relativeDir, idFields = []) {
  const directory = path.join(rootDir, relativeDir);
  if (!fs.existsSync(directory)) {
    return {
      available: false,
      sourcePath: null,
      data: null,
      fallback: { safeMode: true, reason: "directory-unavailable" }
    };
  }
  const files = fs.readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const sourcePath = path.join(directory, file);
      return { sourcePath, mtimeMs: fs.statSync(sourcePath).mtimeMs };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs);

  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(file.sourcePath, "utf8"));
      return {
        available: true,
        sourcePath: file.sourcePath,
        data: {
          status: data.status,
          reportId: idFields.map((field) => data[field]).find(Boolean) || data.status || "metadata-readable",
          envelopes: Array.isArray(data.envelopes) ? data.envelopes.slice(0, 3) : []
        },
        fallback: null
      };
    } catch (error) {
      // Continue to next file; stale partial JSON should not disable fallback.
    }
  }
  return {
    available: false,
    sourcePath: null,
    data: null,
    fallback: { safeMode: true, reason: "no-readable-json-files" }
  };
}

function buildDemoEnvelopes(transport) {
  const envelopes = Array.isArray(transport.envelopes)
    ? transport.envelopes
    : Array.isArray(transport.data?.envelopes)
      ? transport.data.envelopes
      : [];
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

  const broker = readLatestSummary(rootDir, "memory/brokers", ["brokerDemoId"]);
  const transport = readLatestSummary(rootDir, "memory/transport", ["transportReportId"]);
  const distributedQueue = readLatestSummary(rootDir, "memory/distributed-queue", ["distributedQueueReportId"]);
  const replay = readLatestSummary(rootDir, "memory/replay", ["replayDemoId"]);

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

  const selfHealing = readLatestSummary(rootDir, "memory/self-healing", ["runtimeRecoveryDemoId", "recoveryDemoId"]);
  const telemetry = readLatestSummary(rootDir, "memory/telemetry", ["telemetryReportId"]);
  const streamingSource = readLatestSummary(rootDir, "memory/streaming", ["streamingDemoId"]);
  const multiprocessWorkersSource = readLatestSummary(rootDir, "memory/multiprocess-workers", ["multiprocessWorkerDemoId"]);

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
      brokerLayer: broker.data?.reportId || "broker-source-unavailable-safe-fallback",
      runtimeTransport: transport.data?.reportId || "transport-source-unavailable-safe-fallback",
      distributedQueue: distributedQueue.data?.reportId || "distributed-queue-source-unavailable-safe-fallback",
      replay: replay.data?.reportId || "replay-source-unavailable-safe-fallback",
      selfHealing: selfHealing.data?.reportId || "self-healing-source-unavailable-safe-fallback",
      streaming: streamingSource.available ? streamingSource.data.reportId || streamingSource.data.status : "streaming-source-unavailable-safe-fallback",
      telemetry: telemetry.data?.reportId || "telemetry-source-unavailable-safe-fallback",
      dashboard: "redis report is dashboard-readable",
      multiprocessWorkers: multiprocessWorkersSource.available ? multiprocessWorkersSource.data.reportId || multiprocessWorkersSource.data.status : "multiprocess-workers-source-unavailable-safe-fallback",
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
  runRedisStreamsDemo().then(() => {
    setImmediate(() => process.exit(0));
  }).catch((error) => {
    console.error(JSON.stringify({
      status: "redis_streams_demo_failed",
      error: error.message,
      fallback: {
        safeMode: true,
        reason: "redis-streams-demo-error"
      }
    }, null, 2));
    setImmediate(() => process.exit(1));
  });
}

module.exports = {
  runRedisStreamsDemo
};
