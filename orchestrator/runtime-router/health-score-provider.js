class StaticHealthScoreProvider {
  constructor(scores = {}) {
    this.scores = scores;
  }

  getHealthScores(agentIds) {
    return agentIds.reduce((scores, agentId) => {
      scores[agentId] = this.scores[agentId] ?? 100;
      return scores;
    }, {});
  }
}

module.exports = {
  StaticHealthScoreProvider
};
