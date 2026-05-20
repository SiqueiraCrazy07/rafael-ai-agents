class PredictiveWorkflowBlocker {
  enforce(forecast) {
    return (forecast.criticalWorkflows || []).map((workflow) => ({
      type: "predictive-workflow-block",
      status: "applied",
      workflow: workflow.workflow,
      failureProbability: workflow.failureProbability,
      blockMode: "preventive-soft-block",
      reason: `forecast=${workflow.forecast}; failureProbability=${workflow.failureProbability}`
    }));
  }
}

module.exports = {
  PredictiveWorkflowBlocker
};
