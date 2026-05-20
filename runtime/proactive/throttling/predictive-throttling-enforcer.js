class PredictiveThrottlingEnforcer {
  enforce(forecast) {
    const throttling = forecast.recommendations?.throttling;
    if (!throttling?.recommended) {
      return [];
    }

    return [
      {
        type: "predictive-throttling",
        status: "applied",
        scope: "runtime",
        mode: throttling.mode,
        maxConcurrentExecutions: throttling.maxConcurrentExecutions,
        requireCheckpointBeforeHandoff: throttling.requireCheckpointBeforeHandoff,
        workflows: throttling.workflows || [],
        reason: throttling.reason
      }
    ];
  }
}

module.exports = {
  PredictiveThrottlingEnforcer
};
