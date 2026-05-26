const fs = require("node:fs");
const path = require("node:path");
const { runRuntimeObservabilityDemo } = require("../../../telemetry/runtime-observability-demo");
const { runRuntimeRecoveryDemo } = require("../../../self-healing/demo/runtime-recovery-demo");
const { runBrokerAdapterDemo } = require("../../brokers/demo/broker-adapter-demo");
const { DistributedRuntimeCoordinator } = require("../../distributed/distributed-runtime-coordinator");
const { DistributedQueueRuntime } = require("../../queue/distributed-queue-runtime");
const { RuntimeStateReplicator } = require("../../replication/runtime-state-replicator");
const { runWorkflowReplayDemo } = require("../../replay/demo/workflow-replay-demo");
const { RuntimeMessageBus } = require("../../transport/runtime-message-bus");
const { RuntimeDashboardStreamAdapter } = require("../runtime-dashboard-stream-adapter");
const { RuntimeEventStreamer } = require("../runtime-event-streamer");
const { RuntimeLiveTelemetryStream } = require("../runtime-live-telemetry-stream");
const { RuntimeStreamAudit } = require("../runtime-stream-audit");
const { RuntimeStreamAuth } = require("../runtime-stream-auth");
const { RuntimeStreamBackpressure } = require("../runtime-stream-backpressure");
const { RuntimeStreamRegistry } = require("../runtime-stream-registry");
const { RuntimeWebSocketServer } = require("../runtime-websocket-server");

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

function persistDashboardDemo(rootDir, report) {
  const directory = path.join(rootDir, "dashboard", "realtime");
  ensureDir(directory);
  const snapshot = {
    generatedAt: report.generatedAt,
    streamingDemoId: report.streamingDemoId,
    websocket: report.websocket,
    channels: report.channels.map((channel) => channel.name),
    liveTelemetry: report.liveTelemetry,
    dashboardRealtime: report.dashboardRealtime,
    fallbackSnapshot: report.fallbackSnapshot
  };
  const js = `window.RUNTIME_LIVE_DASHBOARD_SNAPSHOT = ${JSON.stringify(snapshot, null, 2)};\n`;
  const snapshotPath = path.join(directory, "runtime-live-dashboard-snapshot.js");
  fs.writeFileSync(snapshotPath, js, "utf8");
  return snapshotPath;
}

function sourceFromReport(report, sourcePath = null) {
  return {
    available: Boolean(report),
    sourcePath,
    data: report || null,
    readErrors: [],
    fallback: report ? null : { safeMode: true, reason: "source-unavailable" }
  };
}

async function runRuntimeStreamingDemo({ rootDir = process.cwd(), silent = false } = {}) {
  const registry = new RuntimeStreamRegistry();
  const auth = new RuntimeStreamAuth();
  const backpressureEngine = new RuntimeStreamBackpressure({ maxEventsPerSubscriber: 12 });
  const eventStreamer = new RuntimeEventStreamer();
  const liveTelemetryStream = new RuntimeLiveTelemetryStream();
  const dashboardAdapter = new RuntimeDashboardStreamAdapter();
  const websocketServer = new RuntimeWebSocketServer({ auth });
  const audit = new RuntimeStreamAudit({ rootDir });

  const channels = registry.seedDefaultChannels();
  const authAccepted = auth.authorize({ token: "local-readonly-stream-token", command: "subscribe" });
  const destructiveDenied = auth.authorize({ token: "local-readonly-stream-token", command: "delete-workflow" });
  const subscribers = [
    registry.registerSubscriber({
      subscriberId: "dashboard-live-runtime",
      clientType: "dashboard-realtime-demo",
      channels: ["runtime.events", "runtime.telemetry", "runtime.dashboard", "runtime.brokers"]
    }),
    registry.registerSubscriber({
      subscriberId: "telemetry-live-runtime",
      clientType: "telemetry-reader",
      channels: ["runtime.telemetry", "runtime.transport", "runtime.replication", "runtime.queue"]
    })
  ];

  const websocket = await websocketServer.start();
  const broker = runBrokerAdapterDemo({ rootDir, silent: true });
  const transport = new RuntimeMessageBus({ rootDir }).runDemo();
  const distributedRuntime = new DistributedRuntimeCoordinator({ rootDir }).runDemo();
  const distributedQueue = new DistributedQueueRuntime({ rootDir }).runDemo();
  const replication = new RuntimeStateReplicator({ rootDir }).runDemo();
  const replay = runWorkflowReplayDemo();
  const selfHealing = runRuntimeRecoveryDemo();
  const telemetry = runRuntimeObservabilityDemo({});

  const sources = {
    workers: sourceFromReport({ status: "workers-readable-via-telemetry", metrics: telemetry.metrics }),
    queue: sourceFromReport({ status: "queue-readable-via-distributed-queue", pressure: distributedQueue.pressure }),
    distributedQueue: sourceFromReport(distributedQueue, distributedQueue.persistence?.memoryPath),
    brokers: sourceFromReport(broker, broker.persistence?.memoryPath),
    transport: sourceFromReport(transport, transport.persistence?.memoryPath),
    replication: sourceFromReport(replication, replication.persistence?.memoryPath),
    replay: sourceFromReport(replay, replay.persistence?.memoryPath),
    selfHealing: sourceFromReport(selfHealing, selfHealing.persistence?.memoryPath),
    telemetry: sourceFromReport(telemetry, telemetry.persistence?.memoryPath),
    dashboard: sourceFromReport({ status: "dashboard-stream-ready", readonly: true }),
    eventBus: sourceFromReport(transport.eventBus || null)
  };

  const events = eventStreamer.buildEvents(sources);
  const liveTelemetry = liveTelemetryStream.build({
    telemetry: sources.telemetry,
    distributedQueue: sources.distributedQueue,
    distributedRuntime: sourceFromReport(distributedRuntime, distributedRuntime.persistence?.memoryPath),
    brokers: sources.brokers,
    transport: sources.transport,
    replication: sources.replication
  });
  const backpressure = backpressureEngine.evaluate({ events, subscribers });
  const eventsToStream = backpressure.throttling.publishLiveEvents ? events : events.slice(0, 4);
  const streamedEvents = eventsToStream.map((event) => ({
    event,
    deliveries: websocketServer.broadcast(event)
  }));
  const liveTelemetryDelivery = websocketServer.broadcast({
    type: "runtime.telemetry.live",
    channel: "runtime.telemetry",
    payload: liveTelemetry,
    readonly: true,
    safetyMode: "readonly-safe-live-telemetry-event"
  });
  const fallbackSnapshot = websocketServer.snapshotFallback(events, backpressure.overload ? "stream-backpressure-throttled" : "no-active-websocket-client-required-for-demo");
  const dashboardRealtime = dashboardAdapter.adapt({
    events,
    liveTelemetry,
    backpressure,
    subscribers
  });

  const report = {
    streamingDemoId: `runtime_streaming_demo_${Date.now()}`,
    streamingReportId: `runtime_streaming_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    status: "runtime_streaming_websocket_layer_ready",
    readonly: true,
    destructiveActions: false,
    externalExposure: false,
    realExternalAuth: false,
    websocket,
    auth: {
      accepted: authAccepted,
      destructiveDenied
    },
    channels,
    subscribers,
    realtimeEvents: events,
    streamedEvents: streamedEvents.map((item) => ({
      eventId: item.event.streamEventId,
      type: item.event.type,
      channel: item.event.channel,
      deliveryCount: item.deliveries.filter((delivery) => delivery.delivered).length,
      deliveries: item.deliveries
    })),
    liveTelemetry,
    liveTelemetryDelivery,
    backpressure,
    streamThrottling: backpressure.throttling,
    dashboardRealtime,
    fallbackSnapshot,
    integrations: {
      brokerAdapterLayer: broker.brokerDemoId,
      runtimeTransport: transport.transportReportId,
      distributedRuntime: distributedRuntime.distributedRuntimeDemoId,
      distributedQueue: distributedQueue.distributedQueueReportId,
      replication: replication.replicationReportId,
      replay: replay.replayDemoId || "workflow-replay-readable",
      selfHealing: selfHealing.recoveryDemoId || "self-healing-readable",
      telemetry: telemetry.telemetryReportId,
      dashboard: "dashboard realtime adapter and static demo snapshot generated",
      eventBus: "runtime stream events are event-bus compatible"
    },
    fallback: {
      safeMode: true,
      jsonFallback: true,
      snapshotFallback: true,
      behavior: "local websocket streams readonly metadata; snapshot mode preserves observability when unavailable"
    },
    risks: [
      "WebSocket server is local-only and minimal in V1",
      "no external auth provider yet",
      "no broker-backed fanout yet",
      "stream throttling is metadata-only"
    ],
    persistence: null
  };
  report.dashboardSnapshotPath = persistDashboardDemo(rootDir, report);
  report.persistence = audit.persist(report);
  await websocketServer.stop();

  if (!silent) {
    console.log(JSON.stringify({
      streamingDemoId: report.streamingDemoId,
      status: report.status,
      websocket: report.websocket,
      channels: report.channels.map((channel) => channel.name),
      subscribers: report.subscribers,
      realtimeEvents: report.realtimeEvents.map((event) => ({
        eventId: event.streamEventId,
        type: event.type,
        channel: event.channel
      })),
      liveTelemetry: report.liveTelemetry,
      backpressure: report.backpressure,
      streamThrottling: report.streamThrottling,
      dashboardRealtime: report.dashboardRealtime,
      fallbackSnapshot: {
        mode: report.fallbackSnapshot.mode,
        reason: report.fallbackSnapshot.reason,
        eventCount: report.fallbackSnapshot.eventCount
      },
      integrations: report.integrations,
      persistence: report.persistence,
      dashboardSnapshotPath: report.dashboardSnapshotPath
    }, null, 2));
  }
  return report;
}

if (require.main === module) {
  runRuntimeStreamingDemo().catch((error) => {
    console.error(JSON.stringify({
      status: "runtime_streaming_demo_failed",
      error: error.message,
      fallback: {
        safeMode: true,
        reason: "streaming-demo-error"
      }
    }, null, 2));
    process.exitCode = 1;
  });
}

module.exports = {
  runRuntimeStreamingDemo
};
