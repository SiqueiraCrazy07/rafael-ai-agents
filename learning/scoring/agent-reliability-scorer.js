class AgentReliabilityScorer {
  score(memory) {
    const scores = new Map();

    for (const item of memory.healthReports) {
      for (const agent of item.data.agents || []) {
        if (!scores.has(agent.agentId)) {
          scores.set(agent.agentId, {
            agentId: agent.agentId,
            samples: 0,
            totalHealth: 0,
            unstableSamples: 0,
            reasons: []
          });
        }

        const record = scores.get(agent.agentId);
        record.samples += 1;
        record.totalHealth += agent.healthScore;
        if (agent.unstable) record.unstableSamples += 1;
        record.reasons.push(...(agent.reasons || []));
      }
    }

    return [...scores.values()].map((record) => {
      const reliabilityScore = Math.round(record.totalHealth / Math.max(1, record.samples));
      return {
        agentId: record.agentId,
        reliabilityScore,
        samples: record.samples,
        unstableSamples: record.unstableSamples,
        status:
          reliabilityScore >= 90
            ? "reliable"
            : reliabilityScore >= 75
              ? "watch"
              : "unstable",
        reasons: [...new Set(record.reasons)]
      };
    });
  }
}

module.exports = {
  AgentReliabilityScorer
};
