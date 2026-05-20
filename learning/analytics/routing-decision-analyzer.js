class RoutingDecisionAnalyzer {
  analyze(memory) {
    const selections = new Map();
    const healthAtSelection = [];

    for (const item of memory.routingDecisions) {
      const decision = item.data.routingDecision;
      if (!decision?.selectedAgent) continue;

      selections.set(decision.selectedAgent, (selections.get(decision.selectedAgent) || 0) + 1);
      const selectedCandidate = decision.candidates?.find(
        (candidate) => candidate.agentId === decision.selectedAgent
      );
      if (selectedCandidate) {
        healthAtSelection.push({
          agentId: decision.selectedAgent,
          healthScore: selectedCandidate.healthScore,
          score: selectedCandidate.score,
          reasons: selectedCandidate.reasons
        });
      }
    }

    return {
      totalDecisions: memory.routingDecisions.length,
      selections: Object.fromEntries(selections),
      healthAtSelection
    };
  }
}

module.exports = {
  RoutingDecisionAnalyzer
};
