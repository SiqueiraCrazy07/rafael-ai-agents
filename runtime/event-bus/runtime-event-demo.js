const { EVENT_TYPES, RuntimeEventBus } = require("./runtime-event-bus");

function runRuntimeEventDemo() {
  const bus = new RuntimeEventBus();
  const received = [];

  const auditSubscription = bus.subscribe("*", (event) => {
    received.push({
      subscriber: "audit",
      eventId: event.eventId,
      type: event.type
    });
  }, { subscriptionId: "subscriber-audit-all" });
  const workflowSubscription = bus.subscribe(EVENT_TYPES.WORKFLOW_QUEUED, (event) => {
    received.push({
      subscriber: "queue-monitor",
      eventId: event.eventId,
      type: event.type,
      workflowId: event.workflowId
    });
  }, { subscriptionId: "subscriber-queue-monitor" });

  const correlationId = `event_demo_${Date.now()}`;
  const publications = [
    bus.publish({
      type: EVENT_TYPES.WORKFLOW_CREATED,
      source: "runtime:event-demo",
      workflowId: "event-demo-workflow",
      project: "platform",
      correlationId,
      safetyMode: "observe-only",
      payload: {
        objective: "Demonstrate Event Bus V1"
      }
    }),
    bus.publish({
      type: EVENT_TYPES.WORKFLOW_QUEUED,
      source: "runtime:event-demo",
      workflowId: "event-demo-workflow",
      project: "platform",
      correlationId,
      safetyMode: "normal-runtime",
      payload: {
        queue: "demo"
      }
    }),
    bus.publish({
      type: EVENT_TYPES.DECISION_CREATED,
      source: "runtime:event-demo",
      workflowId: "event-demo-workflow",
      project: "platform",
      correlationId,
      safetyMode: "declarative-decision",
      payload: {
        decisionType: "normal-execution"
      }
    }),
    bus.publish({
      type: EVENT_TYPES.ENFORCEMENT_APPLIED,
      source: "runtime:event-demo",
      workflowId: "event-demo-workflow",
      project: "platform",
      correlationId,
      safetyMode: "declarative-enforcement",
      payload: {
        mode: "demo"
      }
    }),
    bus.publish({
      type: EVENT_TYPES.RECOVERY_TRIGGERED,
      source: "runtime:event-demo",
      workflowId: "event-demo-workflow",
      project: "platform",
      correlationId,
      safetyMode: "preventive-recovery",
      payload: {
        trigger: "demo"
      }
    })
  ];

  const unsubscribed = bus.unsubscribe(workflowSubscription);
  const afterUnsubscribe = bus.publish({
    type: EVENT_TYPES.WORKFLOW_QUEUED,
    source: "runtime:event-demo",
    workflowId: "event-demo-workflow",
    project: "platform",
    correlationId,
    safetyMode: "normal-runtime",
    payload: {
      queue: "after-unsubscribe"
    }
  });

  const replayed = bus.replay({ correlationId });

  console.log(
    JSON.stringify(
      {
        publishedEvents: [...publications, afterUnsubscribe].map((publication) => ({
          eventId: publication.event.eventId,
          type: publication.event.type,
          deliveredTo: publication.deliveredTo,
          persistence: publication.persistence
        })),
        subscribers: {
          registeredInitially: [auditSubscription, workflowSubscription],
          afterUnsubscribe: bus.listSubscribers(),
          unsubscribed
        },
        received,
        replay: {
          correlationId,
          count: replayed.length,
          eventTypes: replayed.map((event) => event.type)
        },
        fallback: {
          safeMode: true,
          deliveryErrors: bus.deliveryErrors
        }
      },
      null,
      2
    )
  );
}

runRuntimeEventDemo();
