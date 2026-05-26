class RuntimeConsensusEngine {
  evaluate({ snapshots = [], distributedRuntime }) {
    const nodeHealth = Array.isArray(distributedRuntime?.nodeHealth) ? distributedRuntime.nodeHealth : [];
    const heartbeat = Array.isArray(distributedRuntime?.heartbeat) ? distributedRuntime.heartbeat : [];
    const totalNodes = snapshots.length;
    const majority = Math.floor(totalNodes / 2) + 1;
    const eligibleVotes = snapshots
      .map((snapshot) => {
        const health = nodeHealth.find((item) => item.nodeId === snapshot.nodeId);
        const heartbeatState = heartbeat.find((item) => item.nodeId === snapshot.nodeId);
        return {
          nodeId: snapshot.nodeId,
          vote: health?.status === "healthy" && heartbeatState?.stale !== true,
          reason: health?.status === "healthy" && heartbeatState?.stale !== true
            ? "healthy-current-node"
            : heartbeatState?.stale
              ? "stale-heartbeat"
              : "unhealthy-node"
        };
      });
    const votesForConsensus = eligibleVotes.filter((vote) => vote.vote).length;
    const leaderCandidate = eligibleVotes.find((vote) => vote.vote)?.nodeId || null;
    const staleActiveLeaseNodes = (distributedRuntime?.leases || [])
      .filter((lease) => lease.status === "active" && new Date(lease.expiresAt).getTime() < Date.now())
      .map((lease) => lease.nodeId);
    const splitBrainDetected = staleActiveLeaseNodes.length > 0;

    return {
      consensusId: `runtime_consensus_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      generatedAt: new Date().toISOString(),
      type: "declarative-consensus",
      realConsensus: false,
      election: {
        leaderCandidate,
        majorityRequired: majority,
        votesForConsensus,
        votes: eligibleVotes,
        electionMetadata: {
          term: `readonly_term_${Date.now()}`,
          electionExecuted: false,
          reason: "V1 simulates consensus metadata only"
        }
      },
      clusterMajority: {
        achieved: votesForConsensus >= majority,
        totalNodes,
        healthyVotes: votesForConsensus
      },
      staleNodeDetection: eligibleVotes.filter((vote) => vote.reason === "stale-heartbeat").map((vote) => vote.nodeId),
      splitBrain: {
        detected: splitBrainDetected,
        evidence: {
          staleActiveLeaseNodes: [...new Set(staleActiveLeaseNodes)]
        },
        recommendation: splitBrainDetected
          ? "freeze-stale-node-ownership-and-reconcile-leases-before-real-sync"
          : "continue-readonly-replication"
      },
      safetyMode: "readonly-safe-runtime-consensus"
    };
  }
}

module.exports = {
  RuntimeConsensusEngine
};
