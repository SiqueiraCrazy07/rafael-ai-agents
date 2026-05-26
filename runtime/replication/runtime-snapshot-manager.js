const { RuntimeStateVersioning } = require("./runtime-state-versioning");

class RuntimeSnapshotManager {
  constructor({ versioning = new RuntimeStateVersioning() } = {}) {
    this.versioning = versioning;
  }

  createSnapshots({ distributedRuntime, distributedQueue, replay = null, selfHealing = null }) {
    const nodes = Array.isArray(distributedRuntime?.nodes) ? distributedRuntime.nodes : [];
    const partitions = Array.isArray(distributedQueue?.partitions) ? distributedQueue.partitions : [];
    const nodeHealth = Array.isArray(distributedRuntime?.nodeHealth) ? distributedRuntime.nodeHealth : [];
    const leases = Array.isArray(distributedRuntime?.leases) ? distributedRuntime.leases : [];
    const heartbeat = Array.isArray(distributedRuntime?.heartbeat) ? distributedRuntime.heartbeat : [];

    return nodes.map((node) => {
      const nodePartitions = partitions.filter((partition) => partition.nodeId === node.nodeId);
      const health = nodeHealth.find((item) => item.nodeId === node.nodeId) || null;
      const heartbeatState = heartbeat.find((item) => item.nodeId === node.nodeId) || null;
      const nodeLeases = leases.filter((lease) => lease.nodeId === node.nodeId);
      const observedAt = heartbeatState?.heartbeat?.timestamp || distributedRuntime.generatedAt || new Date().toISOString();
      const payload = {
        nodeId: node.nodeId,
        clusterState: distributedRuntime.clusterState,
        queueMetadata: nodePartitions.map((partition) => ({
          partitionId: partition.partitionId,
          queueItems: partition.queueItems.length,
          retryItems: partition.retryItems.length,
          protectedQueue: partition.protectedQueue.length
        })),
        leaseMetadata: nodeLeases.map((lease) => ({
          leaseId: lease.leaseId,
          workflowId: lease.workflowId,
          workerId: lease.workerId,
          ownerId: lease.ownerId,
          status: lease.status,
          expiresAt: lease.expiresAt
        })),
        workerHealthMetadata: {
          nodeHealth: health,
          workers: node.workers
        },
        replayMetadata: {
          replayReportId: replay?.workflowReplayDemoId || replay?.replayAuditId || null,
          validation: replay?.validation || null
        },
        recoveryMetadata: {
          recoveryReportId: selfHealing?.runtimeRecoveryDemoId || null,
          recoveryPlan: selfHealing?.recoveryPlan || null
        }
      };
      const version = this.versioning.createVersion(payload, `snapshot_${node.nodeId}`);
      return {
        snapshotId: `runtime_snapshot_${node.nodeId}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
        nodeId: node.nodeId,
        generatedAt: new Date().toISOString(),
        observedAt,
        readonly: true,
        payload,
        version,
        integrity: {
          valid: true,
          hash: version.recordHash,
          algorithm: version.algorithm,
          reason: "snapshot-hash-generated"
        },
        restoreMetadata: {
          restoreSupported: false,
          executeRestore: false,
          reason: "V1 only prepares readonly restore metadata",
          requiresHumanGate: true
        },
        safetyMode: "readonly-safe-runtime-snapshot"
      };
    });
  }
}

module.exports = {
  RuntimeSnapshotManager
};
