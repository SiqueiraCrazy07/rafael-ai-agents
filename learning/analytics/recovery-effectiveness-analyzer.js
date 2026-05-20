class RecoveryEffectivenessAnalyzer {
  analyze(memory) {
    const byAction = new Map();
    let rollbackRecommended = 0;

    for (const item of memory.recoveryRecommendations) {
      const recommendation = item.data;
      byAction.set(recommendation.action, (byAction.get(recommendation.action) || 0) + 1);
      if (recommendation.rollbackRecommended) {
        rollbackRecommended += 1;
      }
    }

    return {
      totalRecommendations: memory.recoveryRecommendations.length,
      byAction: Object.fromEntries(byAction),
      rollbackRecommended,
      effectiveSignals: memory.recoveryRecommendations.filter((item) =>
        ["monitor_and_retry_if_transient", "human_review_required"].includes(item.data.action)
      ).length
    };
  }
}

module.exports = {
  RecoveryEffectivenessAnalyzer
};
