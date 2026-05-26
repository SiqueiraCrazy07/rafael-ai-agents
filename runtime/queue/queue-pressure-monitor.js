class QueuePressureMonitor {
  evaluate({ partitions = [], clusterState = null, schedulerPlan = null }) {
    const totalQueueItems = partitions.reduce((total, partition) => total + partition.queueItems.length, 0);
    const totalRetryItems = partitions.reduce((total, partition) => total + partition.retryItems.length, 0);
    const protectedQueueCount = partitions.reduce((total, partition) => total + partition.protectedQueue.length, 0);
    const nodeCount = Math.max(partitions.length, 1);
    const queueDepthByNode = partitions.map((partition) => ({
      nodeId: partition.nodeId,
      depth: partition.queueItems.length + partition.retryItems.length + partition.protectedQueue.length,
      protectedQueue: partition.protectedQueue.length
    }));
    const maxDepth = Math.max(...queueDepthByNode.map((item) => item.depth), 0);
    const avgDepth = (totalQueueItems + totalRetryItems + protectedQueueCount) / nodeCount;
    const schedulerForecast = schedulerPlan?.plan?.forecast || schedulerPlan?.forecast || {};
    const executionPressure = Number(clusterState?.pressure?.executionPressure || 0);
    const replayPressure = Number(clusterState?.pressure?.replayPressure || 0);

    return {
      pressureId: `queue_pressure_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      generatedAt: new Date().toISOString(),
      totalQueueItems,
      totalRetryItems,
      protectedQueueCount,
      nodeCount,
      maxDepth,
      avgDepth,
      queueDepthByNode,
      executionPressure,
      replayPressure,
      retryRatio: totalQueueItems > 0 ? totalRetryItems / totalQueueItems : totalRetryItems,
      schedulerSignals: {
        saturationRisk: schedulerForecast.saturationRisk || schedulerForecast.saturation || "unknown",
        retryStormRisk: schedulerForecast.retryStormRisk || schedulerForecast.retryStorm || "unknown",
        queueGrowthRisk: schedulerForecast.queueGrowthRisk || schedulerForecast.queueGrowth || "unknown"
      },
      safetyMode: "readonly-safe-queue-pressure"
    };
  }
}

module.exports = {
  QueuePressureMonitor
};
