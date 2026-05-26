const { RuntimeStateReplicator } = require("../runtime-state-replicator");

function runRuntimeReplicationDemo() {
  const replicator = new RuntimeStateReplicator();
  const report = replicator.runDemo();
  console.log(JSON.stringify({
    replicationReportId: report.replicationReportId,
    status: report.status,
    readonly: report.readonly,
    realConsensus: report.realConsensus,
    realNodeMutation: report.realNodeMutation,
    snapshots: report.snapshots.map((snapshot) => ({
      snapshotId: snapshot.snapshotId,
      nodeId: snapshot.nodeId,
      versionId: snapshot.version.versionId,
      integrity: snapshot.integrity,
      restoreMetadata: snapshot.restoreMetadata
    })),
    replicationState: report.replicationState,
    consensusMetadata: report.consensus,
    splitBrainDetection: report.consensus.splitBrain,
    reconciliationRecommendations: report.reconciliation.recommendations,
    replicationLag: report.nodeSync.replicationLag,
    syncRecommendations: report.nodeSync.syncRecommendations,
    eventBus: report.eventBus,
    fallback: report.fallback,
    persistence: report.persistence
  }, null, 2));
  return report;
}

if (require.main === module) {
  runRuntimeReplicationDemo();
}

module.exports = {
  runRuntimeReplicationDemo
};
