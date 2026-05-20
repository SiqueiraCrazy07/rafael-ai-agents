class PredictiveRoutingAdvisor {
  advise({ workerPredictions, workflowPredictions }) {
    const avoidWorkers = workerPredictions
      .filter((worker) => ["critical", "high"].includes(worker.forecast))
      .map((worker) => ({
        workerId: worker.workerId,
        reason: `predicted saturation ${worker.saturationScore}`,
        action: "avoid-or-reduce-routing"
      }));
    const guardedWorkflows = workflowPredictions
      .filter((workflow) => ["critical", "high"].includes(workflow.forecast))
      .map((workflow) => ({
        workflow: workflow.workflow,
        reason: `predicted failure probability ${workflow.failureProbability}`,
        action: "require-healthy-worker-and-human-gate"
      }));

    return {
      avoidWorkers,
      guardedWorkflows,
      reroutingRecommended: avoidWorkers.length > 0 || guardedWorkflows.length > 0
    };
  }
}

module.exports = {
  PredictiveRoutingAdvisor
};
