class RuntimeStateReconciliation {
  reconcile({ snapshots = [], distributedRuntime, distributedQueue, consensus }) {
    const issues = [];
    const unhealthyNodes = new Set((distributedRuntime?.nodeHealth || [])
      .filter((node) => node.status !== "healthy")
      .map((node) => node.nodeId));

    for (const lease of distributedRuntime?.leases || []) {
      const expired = new Date(lease.expiresAt).getTime() < Date.now();
      if (expired || unhealthyNodes.has(lease.nodeId)) {
        issues.push(this.issue("lease-divergence", "active lease is expired or owned by unhealthy node", {
          leaseId: lease.leaseId,
          nodeId: lease.nodeId,
          workflowId: lease.workflowId,
          expired,
          unhealthyOwner: unhealthyNodes.has(lease.nodeId)
        }, "high"));
      }
    }

    for (const partition of distributedQueue?.partitions || []) {
      const depth = partition.queueItems.length + partition.retryItems.length + partition.protectedQueue.length;
      if (unhealthyNodes.has(partition.nodeId) && depth > 0) {
        issues.push(this.issue("queue-divergence", "queue partition has items on unhealthy node", {
          partitionId: partition.partitionId,
          nodeId: partition.nodeId,
          depth
        }, "high"));
      }
    }

    for (const snapshot of snapshots) {
      const health = snapshot.payload.workerHealthMetadata.nodeHealth;
      const unhealthyWorkers = health?.unhealthyWorkers || [];
      const workerMismatch = snapshot.payload.workerHealthMetadata.workers
        .filter((worker) => unhealthyWorkers.includes(worker.workerId) && worker.healthStatus === "healthy");
      if (workerMismatch.length > 0) {
        issues.push(this.issue("worker-metadata-mismatch", "worker metadata differs from node health", {
          nodeId: snapshot.nodeId,
          workers: workerMismatch.map((worker) => worker.workerId)
        }, "medium"));
      }
    }

    const uniqueSnapshotHashes = new Set(snapshots.map((snapshot) => snapshot.version.recordHash));
    if (uniqueSnapshotHashes.size > 1) {
      issues.push(this.issue("snapshot-version-divergence", "node snapshots contain different local state views", {
        snapshotCount: snapshots.length,
        uniqueVersions: uniqueSnapshotHashes.size
      }, "medium"));
    }

    if (consensus?.splitBrain?.detected) {
      issues.push(this.issue("split-brain-risk", "consensus detected stale active ownership", consensus.splitBrain.evidence, "high"));
    }

    return {
      reconciliationId: `runtime_reconciliation_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      generatedAt: new Date().toISOString(),
      status: issues.length > 0 ? "reconciliation-required" : "consistent",
      issues,
      recommendations: issues.map((issue) => ({
        issueId: issue.issueId,
        type: issue.type,
        recommendation: this.recommend(issue.type),
        evidence: issue.evidence
      })),
      executeReconciliation: false,
      safetyMode: "readonly-safe-state-reconciliation"
    };
  }

  issue(type, reason, evidence, severity) {
    return {
      issueId: `reconciliation_issue_${type}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      type,
      severity,
      reason,
      evidence,
      safetyMode: "readonly-safe-reconciliation-issue"
    };
  }

  recommend(type) {
    const map = {
      "lease-divergence": "expire-stale-lease-and-require-human-gate-before-reassignment",
      "queue-divergence": "preserve-protected-queue-and-plan-rebalance-to-healthy-node",
      "worker-metadata-mismatch": "refresh-worker-health-metadata-before-routing",
      "snapshot-version-divergence": "replicate-latest-majority-snapshot-readonly",
      "split-brain-risk": "freeze-stale-owner-and-run-supervised-reconciliation"
    };
    return map[type] || "supervised-review";
  }
}

module.exports = {
  RuntimeStateReconciliation
};
