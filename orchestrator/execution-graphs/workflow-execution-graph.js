class WorkflowExecutionGraph {
  build(plan) {
    const nodes = plan.steps.map((step) => ({
      id: step.stepId,
      agentId: step.agentId,
      status: step.status
    }));

    const edges = plan.steps.slice(1).map((step, index) => ({
      from: plan.steps[index].stepId,
      to: step.stepId,
      type: "handoff"
    }));

    return {
      graphId: `graph_${Date.now()}`,
      planId: plan.planId,
      project: plan.project,
      workflow: plan.workflow,
      nodes,
      edges,
      gates: plan.gates || []
    };
  }
}

module.exports = {
  WorkflowExecutionGraph
};
