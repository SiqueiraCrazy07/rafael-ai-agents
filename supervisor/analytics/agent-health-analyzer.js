class AgentHealthAnalyzer {
  analyze({ events, executions }) {
    const health = new Map();

    for (const execution of executions) {
      for (const agentId of execution.agents || []) {
        if (!health.has(agentId)) {
          health.set(agentId, {
            agentId,
            healthScore: 100,
            executions: 0,
            failures: 0,
            retries: 0,
            rollbacks: 0,
            unstable: false,
            reasons: []
          });
        }

        const record = health.get(agentId);
        record.executions += 1;

        if (execution.status === "failed") {
          record.failures += 1;
          record.healthScore -= 25;
          record.reasons.push("failed-execution");
        }

        if (execution.status === "rolled_back") {
          record.rollbacks += 1;
          record.healthScore -= 20;
          record.reasons.push("rollback");
        }

        if ((execution.retries?.count || 0) > 0) {
          record.retries += execution.retries.count;
          record.healthScore -= execution.retries.count * 8;
          record.reasons.push("retry");
        }
      }
    }

    for (const event of events) {
      const agents = event.agents || [];
      for (const agentId of agents) {
        if (!health.has(agentId)) continue;
        const record = health.get(agentId);
        if (event.type === "rollback_triggered") {
          record.healthScore -= 5;
        }
      }
    }

    return [...health.values()].map((record) => ({
      ...record,
      healthScore: Math.max(0, Math.min(100, record.healthScore)),
      unstable: record.healthScore < 75 || record.failures > 0 || record.rollbacks > 0
    }));
  }
}

module.exports = {
  AgentHealthAnalyzer
};
