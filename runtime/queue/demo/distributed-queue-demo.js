const { DistributedQueueRuntime } = require("../distributed-queue-runtime");

function runDistributedQueueDemo() {
  const runtime = new DistributedQueueRuntime();
  const report = runtime.runDemo();
  console.log(JSON.stringify({
    distributedQueueReportId: report.distributedQueueReportId,
    status: report.status,
    readonly: report.readonly,
    externalBroker: report.externalBroker,
    queuePartitions: report.partitionSummary,
    backpressure: {
      status: report.backpressure.status,
      severity: report.backpressure.severity,
      signals: report.backpressure.signals.map((signal) => ({
        type: signal.type,
        severity: signal.severity,
        recommendation: signal.recommendation
      }))
    },
    throttling: report.throttling,
    retryOrchestration: {
      totalRetryItems: report.retryOrchestration.totalRetryItems,
      retryStormDetected: report.retryOrchestration.retryStormDetected,
      retryPlans: report.retryOrchestration.retryPlans
    },
    saturationProtection: report.saturationProtection,
    rebalancing: report.rebalancing,
    recoveryRecommendations: report.recoveryRecommendations,
    eventBus: report.eventBus,
    fallback: report.fallback,
    persistence: report.persistence
  }, null, 2));
  return report;
}

if (require.main === module) {
  runDistributedQueueDemo();
}

module.exports = {
  runDistributedQueueDemo
};
