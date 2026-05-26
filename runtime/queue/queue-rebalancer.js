class QueueRebalancer {
  rebalance({ partitions = [], nodeHealth = [], saturationProtection }) {
    const saturatedNodes = nodeHealth.filter((node) => node.saturated || node.status !== "healthy");
    const healthyTargets = nodeHealth.filter((node) => node.status === "healthy" && !node.saturated);
    const moves = [];

    for (const saturated of saturatedNodes) {
      const source = partitions.find((partition) => partition.nodeId === saturated.nodeId);
      if (!source || healthyTargets.length === 0) {
        continue;
      }
      const movableItems = source.queueItems.filter((item) => item.priority !== "gated").slice(0, 2);
      movableItems.forEach((item, index) => {
        const target = healthyTargets[index % healthyTargets.length];
        moves.push({
          moveId: `queue_rebalance_move_${Date.now()}_${moves.length + 1}`,
          workflowId: item.workflowId || item.workflow || item.jobId,
          jobId: item.jobId || item.queueItemId || null,
          fromNodeId: source.nodeId,
          toNodeId: target.nodeId,
          executeMove: false,
          reason: "saturated-or-unhealthy-source-node",
          safetyMode: "readonly-safe-queue-rebalance"
        });
      });
    }

    return {
      rebalancePlanId: `queue_rebalance_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      executeRebalance: false,
      saturatedNodes: saturatedNodes.map((node) => node.nodeId),
      targetNodes: healthyTargets.map((node) => node.nodeId),
      moves,
      protectedQueuePreserved: true,
      saturationProtectionActive: saturationProtection.assignmentPolicy.blockExcessiveAssignments,
      recommendations: moves.length > 0
        ? ["rebalance non-gated queue items to healthy nodes", "keep protected queue gated"]
        : ["no safe rebalance target available or no movement required"],
      safetyMode: "readonly-safe-queue-rebalancer"
    };
  }
}

module.exports = {
  QueueRebalancer
};
