const { DistributedRuntimeEventBus } = require("../runtime-event-bus");
const { EventReplayEngine } = require("../event-replay-engine");
const { EventPersistence } = require("../event-persistence");

function buildDemoBus() {
  const bus = new DistributedRuntimeEventBus({
    maxInMemoryEvents: 8,
    maxEventsPerWindow: 20,
    rateWindowMs: 1000
  });
  const initialization = bus.initialize();
  const received = [];

  const workerSubscription = bus.subscribe("runtime.worker", (event) => {
    received.push({ subscription: "worker-observer", eventId: event.eventId });
  }, {
    subscriptionId: "eventbus-demo-worker-observer",
    routingKey: "worker"
  });

  const telemetrySubscription = bus.subscribe("runtime.telemetry", (event) => {
    received.push({ subscription: "telemetry-observer", eventId: event.eventId });
  }, {
    subscriptionId: "eventbus-demo-telemetry-observer",
    routingKey: "telemetry"
  });

  const failingSubscription = bus.subscribe("runtime.scheduler", () => {
    throw new Error("simulated subscriber failure");
  }, {
    subscriptionId: "eventbus-demo-failing-subscriber",
    routingKey: "scheduler",
    maxRetries: 1
  });

  return {
    bus,
    initialization,
    received,
    subscriptions: [workerSubscription, telemetrySubscription, failingSubscription]
  };
}

function runEventBusDemo() {
  const { bus, initialization, received, subscriptions } = buildDemoBus();
  const correlationId = `eventbus_correlation_${Date.now()}`;
  const workflowId = "distributed-eventbus-demo-workflow";
  const base = {
    workflowId,
    correlationId,
    executionId: `eventbus_execution_${Date.now()}`,
    project: "platform",
    safetyMode: "readonly-safe-event-streaming"
  };

  const publishResults = [
    bus.publish({
      ...base,
      type: "workflow.created",
      source: "workers",
      payload: { integration: "Workers", action: "created" }
    }),
    bus.publish({
      ...base,
      type: "worker.execution.started",
      source: "workers",
      payload: { workerId: "eventbus-worker-1", status: "executing" }
    }),
    bus.publish({
      ...base,
      type: "scheduler.plan.created",
      source: "worker-scheduler",
      payload: { planId: "eventbus-scheduler-plan", protectedQueueAware: true }
    }),
    bus.publish({
      ...base,
      type: "telemetry.metric.collected",
      source: "telemetry",
      payload: { metric: "eventThroughput", value: 4 }
    }),
    bus.publish({
      ...base,
      type: "dashboard.refresh.requested",
      source: "dashboard",
      payload: { readonly: true }
    }),
    bus.publish({
      ...base,
      type: "plugin.hook.executed",
      source: "plugins",
      payload: { hook: "afterTelemetry", readonly: true }
    }),
    bus.publish({
      ...base,
      type: "connector.health.changed",
      source: "connectors",
      payload: { connectorId: "readonly-mock-connector", healthStatus: "healthy" }
    })
  ];

  const invalidResult = bus.publish({
    ...base,
    source: "eventbus-demo",
    payload: { missingType: true }
  });

  const overflowResult = bus.publish({
    ...base,
    type: "database.transaction.committed",
    source: "database",
    payload: { adapter: "sqlite", readonlySafe: true }
  });

  const overflowRejectedResult = bus.publish({
    ...base,
    type: "workflow.failed",
    source: "eventbus-demo",
    payload: { expected: "overflow-protection" }
  });

  const workflowReplay = bus.replay({ workflowId });
  const correlationReplay = bus.replay({ correlationId });
  const temporalReplay = bus.replay({
    from: new Date(Date.now() - 60_000).toISOString(),
    to: new Date(Date.now() + 60_000).toISOString()
  });

  const status = bus.status();
  const report = {
    eventBusDemoId: `eventbus_demo_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    status: publishResults.some((result) => result.ok) ? "distributed_event_bus_ready" : "distributed_event_bus_attention",
    readonly: true,
    destructiveActions: false,
    initialization,
    architecture: {
      publishSubscribe: true,
      persistentStreams: true,
      databasePersistence: initialization.database,
      jsonFallback: true,
      deadLetterQueue: true,
      replay: true,
      backpressure: true,
      distributedTracing: true
    },
    integrations: [
      "Workers",
      "Scheduler",
      "Autonomous Runtime",
      "Database",
      "Telemetry",
      "Dashboard",
      "Plugins",
      "Connectors"
    ],
    subscriptions,
    published: publishResults.map((result) => ({
      ok: result.ok,
      status: result.status,
      eventId: result.event?.eventId,
      topic: result.event?.topic,
      sequence: result.event?.ordering?.sequence,
      delivered: result.delivery?.delivered?.length || 0,
      failed: result.delivery?.failed?.length || 0,
      persistenceSource: result.persistence?.database?.source,
      fallbackUsed: result.persistence?.fallbackUsed || false
    })),
    invalidEvent: {
      status: invalidResult.status,
      deadLetterId: invalidResult.deadLetter?.deadLetterId
    },
    overflowProtection: {
      status: overflowResult.status,
      rejectedStatus: overflowRejectedResult.status,
      deadLetterId: overflowResult.deadLetter?.deadLetterId,
      rejectedDeadLetterId: overflowRejectedResult.deadLetter?.deadLetterId,
      fallback: overflowResult.fallback
    },
    received,
    replay: {
      byWorkflow: workflowReplay.total,
      byCorrelation: correlationReplay.total,
      temporal: temporalReplay.total
    },
    deadLetterQueue: bus.deadLetterQueue.list(),
    ackCount: status.ackCount,
    backpressure: status.backpressure,
    streams: status.streams,
    correlation: status.correlation,
    fallback: {
      safeMode: true,
      behavior: "database persistence is additive; JSON fallback in runtime-data/event-bus and memory/event-bus remains mandatory"
    }
  };

  report.persistence = bus.persistence.persistReport("eventbus-demo", report);
  return report;
}

function runReplayDemo() {
  const persistence = new EventPersistence({ rootDir: process.cwd(), useDatabase: false });
  const initialization = persistence.initialize();
  const replayEngine = new EventReplayEngine({ persistence });
  let allReplay = replayEngine.replay();
  let seeded = false;
  if (allReplay.total === 0) {
    runEventBusDemo();
    seeded = true;
    allReplay = replayEngine.replay();
  }
  const sample = allReplay.events[0] || null;
  const workflowReplay = sample ? replayEngine.replay({ workflowId: sample.workflowId }) : replayEngine.replay({ workflowId: "missing" });
  const correlationReplay = sample
    ? replayEngine.replay({ correlationId: sample.correlationId })
    : replayEngine.replay({ correlationId: "missing" });
  const temporalReplay = replayEngine.replay({
    from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    to: new Date(Date.now() + 60_000).toISOString()
  });

  const report = {
    eventBusReplayDemoId: `eventbus_replay_demo_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    status: "event_replay_ready",
    readonly: true,
    destructiveActions: false,
    initialization,
    replay: {
      all: allReplay.total,
      byWorkflow: workflowReplay.total,
      byCorrelation: correlationReplay.total,
      temporal: temporalReplay.total,
      sampleEventId: sample?.eventId || null,
      seeded
    },
    readErrors: allReplay.readErrors,
    missingSources: allReplay.missingSources,
    fallback: {
      safeMode: true,
      reason: "readonly-safe-replay",
      jsonFallback: true
    }
  };

  report.persistence = persistence.persistReport("eventbus-replay-demo", report);
  return report;
}

if (require.main === module) {
  const report = process.argv.includes("--replay") ? runReplayDemo() : runEventBusDemo();
  console.log(JSON.stringify(report, null, 2));
}

module.exports = {
  runEventBusDemo,
  runReplayDemo
};
