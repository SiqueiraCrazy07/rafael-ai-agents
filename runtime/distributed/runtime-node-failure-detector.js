class RuntimeNodeFailureDetector {
  detect({ nodes = [], heartbeatStatus = [], nodeHealth = [], staleLeases = [], clusterState = null }) {
    const failures = [];
    for (const heartbeat of heartbeatStatus) {
      if (heartbeat.stale) {
        failures.push(this.failure("stale-heartbeat", "stale heartbeat detected", { nodeId: heartbeat.nodeId }, "medium"));
      }
      if (heartbeat.unhealthy) {
        failures.push(this.failure("node-offline", "node offline or unhealthy", { nodeId: heartbeat.nodeId }, "high"));
      }
    }
    for (const lease of staleLeases) {
      failures.push(this.failure("lease-inconsistency", "stale lease detected", lease, "medium"));
    }
    for (const node of nodeHealth) {
      if (node.unhealthyWorkers.length > 0) {
        failures.push(
          this.failure("worker-isolation", "worker isolation recommended", {
            nodeId: node.nodeId,
            workers: node.unhealthyWorkers
          })
        );
      }
      if (node.saturated) {
        failures.push(this.failure("queue-imbalance", "node saturation may cause queue imbalance", { nodeId: node.nodeId }));
      }
    }
    if (clusterState?.pressure?.queuePressure > 0) {
      failures.push(this.failure("queue-imbalance", "cluster queue pressure detected", clusterState.pressure));
    }
    return failures;
  }

  failure(type, reason, evidence = {}, severity = "medium") {
    return {
      failureId: `distributed_failure_${type}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      type,
      severity,
      reason,
      evidence,
      recoveryRecommendation: this.recommend(type),
      safetyMode: "readonly-safe-distributed-failure"
    };
  }

  recommend(type) {
    const map = {
      "node-offline": "route-away-from-node-and-request-human-gate",
      "stale-heartbeat": "pause-node-assignment-until-heartbeat-recovers",
      "lease-inconsistency": "expire-lease-and-reroute-workflow",
      "worker-isolation": "isolate-worker-and-reroute-capability",
      "queue-imbalance": "rebalance-queue-to-healthy-nodes"
    };
    return map[type] || "supervised-review";
  }
}

module.exports = {
  RuntimeNodeFailureDetector
};
