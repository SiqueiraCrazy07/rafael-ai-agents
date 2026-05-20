const { MultiWorkerOrchestrator } = require("./multi-worker-orchestrator");

function runRebalanceDemo() {
  const orchestrator = new MultiWorkerOrchestrator();
  const report = orchestrator.run();
  const persistence = orchestrator.persist(report);

  console.log(JSON.stringify({
    orchestrationReportId: report.orchestrationReportId,
    status: report.status,
    overloadedWorkers: report.rebalance.overloadedWorkers,
    rebalances: report.rebalance.rebalances,
    protectedQueueAwareness: {
      protectedQueueCount: report.distribution.protectedQueue.length,
      protectedQueueMoved: report.rebalance.rebalances.some((rebalance) =>
        report.distribution.protectedQueue.some((item) => item.queueItem.queueId === rebalance.queueId)
      )
    },
    unhealthyWorkersAvoided: report.fallback.unhealthyWorkersAvoided,
    events: report.events
      .filter((event) => ["workflow-rebalanced", "worker-overloaded", "worker-unhealthy"].includes(event.type))
      .map((event) => ({
        eventId: event.eventId,
        type: event.type,
        workflowId: event.workflowId
      })),
    fallback: report.fallback,
    persistence
  }, null, 2));
}

if (require.main === module) {
  runRebalanceDemo();
}

module.exports = {
  runRebalanceDemo
};
