class RuntimeNodeSyncEngine {
  evaluate({ snapshots = [], consensus }) {
    const now = Date.now();
    const syncStates = snapshots.map((snapshot) => {
      const observedAt = new Date(snapshot.observedAt).getTime();
      const replicationLagMs = Number.isFinite(observedAt) ? Math.max(0, now - observedAt) : null;
      const staleReplication = replicationLagMs === null || replicationLagMs > 30000;
      return {
        nodeId: snapshot.nodeId,
        snapshotId: snapshot.snapshotId,
        replicationLagMs,
        staleReplication,
        syncStatus: staleReplication ? "stale" : "current",
        recommendation: staleReplication
          ? "request-readonly-snapshot-refresh-before-sync"
          : "node-snapshot-current",
        safetyMode: "readonly-safe-node-sync"
      };
    });

    return {
      nodeSyncId: `runtime_node_sync_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      generatedAt: new Date().toISOString(),
      executeSync: false,
      syncStates,
      replicationLag: {
        maxLagMs: Math.max(...syncStates.map((state) => state.replicationLagMs || 0), 0),
        staleNodes: syncStates.filter((state) => state.staleReplication).map((state) => state.nodeId)
      },
      syncRecommendations: [
        ...syncStates
          .filter((state) => state.staleReplication)
          .map((state) => ({
            nodeId: state.nodeId,
            recommendation: state.recommendation,
            evidence: { replicationLagMs: state.replicationLagMs }
          })),
        consensus?.splitBrain?.detected
          ? {
              nodeId: "cluster",
              recommendation: "block-real-sync-until-split-brain-is-reviewed",
              evidence: consensus.splitBrain.evidence
            }
          : null
      ].filter(Boolean),
      safetyMode: "readonly-safe-runtime-node-sync"
    };
  }
}

module.exports = {
  RuntimeNodeSyncEngine
};
