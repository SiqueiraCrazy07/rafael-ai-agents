class QueuePartitionManager {
  createPartitions({ queueItems = [], retryItems = [], protectedQueue = [], nodes = [] }) {
    const availableNodes = nodes.length > 0
      ? nodes
      : [{ nodeId: "queue-fallback-node", status: "healthy", workers: [], capabilities: ["runtime-read"] }];

    const partitions = availableNodes.map((node, index) => ({
      partitionId: `queue_partition_${node.nodeId}_${index + 1}`,
      nodeId: node.nodeId,
      owner: {
        ownerId: node.nodeId,
        readonly: true,
        lockMode: "declarative-ownership"
      },
      queueItems: [],
      retryItems: [],
      protectedQueue: [],
      metadata: {
        status: node.status || "unknown",
        capabilities: node.capabilities || [],
        workerCount: Array.isArray(node.workers) ? node.workers.length : 0
      },
      safetyMode: "readonly-safe-queue-partition"
    }));

    const assign = (items, targetKey) => {
      items.forEach((item, index) => {
        const partition = partitions[index % partitions.length];
        partition[targetKey].push({
          ...item,
          partitionId: partition.partitionId,
          assignedNodeId: partition.nodeId,
          readonly: true
        });
      });
    };

    assign(queueItems, "queueItems");
    assign(retryItems, "retryItems");
    assign(protectedQueue, "protectedQueue");

    return partitions;
  }

  summarize(partitions = []) {
    return {
      totalPartitions: partitions.length,
      totalQueueItems: partitions.reduce((total, partition) => total + partition.queueItems.length, 0),
      totalRetryItems: partitions.reduce((total, partition) => total + partition.retryItems.length, 0),
      protectedQueueCount: partitions.reduce((total, partition) => total + partition.protectedQueue.length, 0),
      owners: partitions.map((partition) => ({
        partitionId: partition.partitionId,
        nodeId: partition.nodeId,
        queueItems: partition.queueItems.length,
        retryItems: partition.retryItems.length,
        protectedQueue: partition.protectedQueue.length
      }))
    };
  }
}

module.exports = {
  QueuePartitionManager
};
