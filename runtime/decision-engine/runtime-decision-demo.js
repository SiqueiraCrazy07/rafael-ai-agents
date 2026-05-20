const { RuntimeDecisionEngine } = require("./runtime-decision-engine");
const { EVENT_TYPES, RuntimeEventBus } = require("../event-bus/runtime-event-bus");

function runRuntimeDecisionDemo() {
  const engine = new RuntimeDecisionEngine();
  const report = engine.evaluate();
  const persistence = engine.persist(report);
  const eventBus = new RuntimeEventBus();
  const eventPublications = report.decisions.map((decision) =>
    eventBus.publish({
      type: EVENT_TYPES.DECISION_CREATED,
      source: "runtime-decision-engine",
      workflowId: decision.evidence?.workflow || "runtime-operational-workflow",
      project: "platform",
      correlationId: report.decisionReportId,
      safetyMode: decision.safetyMode,
      payload: {
        decisionId: decision.decisionId,
        decisionType: decision.type,
        severity: decision.severity,
        action: decision.action,
        reason: decision.reason
      }
    })
  );

  console.log(
    JSON.stringify(
      {
        decisionReportId: report.decisionReportId,
        status: report.status,
        safety: report.safety,
        sources: Object.fromEntries(
          Object.entries(report.sources).map(([key, source]) => [
            key,
            {
              available: source.available,
              latestPath: source.latestPath,
              recentFiles: source.recentFiles,
              readErrors: source.readErrors
            }
          ])
        ),
        decisions: report.decisions.map((decision) => ({
          decisionId: decision.decisionId,
          type: decision.type,
          severity: decision.severity,
          source: decision.source,
          action: decision.action,
          reason: decision.reason,
          safetyMode: decision.safetyMode,
          expiresAt: decision.expiresAt
        })),
        coordination: report.coordination,
        fallback: report.fallback,
        events: {
          published: eventPublications.map((publication) => ({
            eventId: publication.event.eventId,
            type: publication.event.type,
            workflowId: publication.event.workflowId,
            persistence: publication.persistence
          }))
        },
        persistence
      },
      null,
      2
    )
  );
}

runRuntimeDecisionDemo();
