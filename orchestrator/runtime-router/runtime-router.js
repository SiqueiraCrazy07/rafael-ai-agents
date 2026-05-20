const { CapabilityMatcher } = require("./capability-matcher");
const { RegistryClient } = require("./registry-client");
const { StaticHealthScoreProvider } = require("./health-score-provider");

class RuntimeRouter {
  constructor({
    registryClient = new RegistryClient(),
    matcher = new CapabilityMatcher(),
    healthScoreProvider = new StaticHealthScoreProvider()
  } = {}) {
    this.registryClient = registryClient;
    this.matcher = matcher;
    this.healthScoreProvider = healthScoreProvider;
  }

  route(request) {
    const activeAgents = this.registryClient.listActiveAgents();
    const healthScores = this.healthScoreProvider.getHealthScores(
      activeAgents.map((agent) => agent.id)
    );
    const ranked = this.matcher.rankAgents(activeAgents, request, healthScores);

    if (ranked.length === 0) {
      return {
        decisionId: `route_${Date.now()}`,
        status: "blocked",
        request,
        selectedAgent: null,
        candidates: [],
        reason: "No compatible active agent found"
      };
    }

    const selected = ranked[0];
    return {
      decisionId: `route_${Date.now()}`,
      status: "routed",
      request,
      selectedAgent: selected.agent.id,
      selectedAgentName: selected.agent.nome,
      score: selected.healthAdjustedScore,
      candidates: ranked.map((candidate) => ({
        agentId: candidate.agent.id,
        name: candidate.agent.nome,
        score: candidate.healthAdjustedScore,
        healthScore: candidate.healthScore,
        reasons: candidate.reasons
      })),
      reason: selected.reasons.join("; ")
    };
  }
}

module.exports = {
  RuntimeRouter
};
