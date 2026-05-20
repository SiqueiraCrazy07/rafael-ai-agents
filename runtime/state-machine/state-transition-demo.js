const { StateTransitionCoordinator } = require("./state-transition-coordinator");

function runStateTransitionDemo() {
  const coordinator = new StateTransitionCoordinator();
  const report = coordinator.coordinate();
  const persistence = coordinator.persist(report);

  console.log(
    JSON.stringify(
      {
        transitionReportId: report.transitionReportId,
        status: report.status,
        safety: report.safety,
        decisionSource: report.decisionSource,
        consumedDecisions: report.consumedDecisions,
        appliedTransitions: report.appliedTransitions.map((transition) => ({
          decisionId: transition.decisionId,
          decisionType: transition.decisionType,
          workflow: transition.workflow,
          from: transition.from,
          to: transition.to,
          source: transition.source,
          reason: transition.reason,
          safetyMode: transition.safetyMode,
          expiresAt: transition.expiresAt
        })),
        blockedTransitions: report.blockedTransitions,
        ignoredDecisions: report.ignoredDecisions,
        events: {
          published: report.publishedEvents
        },
        fallback: report.fallback,
        persistence
      },
      null,
      2
    )
  );
}

runStateTransitionDemo();
