class ExecutionPlanBuilder {
  buildPlan({ request, routingDecision, supportingAgents = [] }) {
    if (routingDecision.status !== "routed") {
      return {
        planId: `plan_${Date.now()}`,
        status: "blocked",
        reason: routingDecision.reason,
        steps: []
      };
    }

    const agents = [routingDecision.selectedAgent, ...supportingAgents]
      .filter(Boolean)
      .filter((agentId, index, list) => list.indexOf(agentId) === index);

    const steps = agents.map((agentId, index) => ({
      stepId: `step_${index + 1}`,
      agentId,
      order: index + 1,
      status: "planned",
      inputContract: {
        project: request.project,
        workflow: request.workflow,
        objective: request.objective,
        capabilities: request.capabilities || []
      },
      outputContract: {
        required: ["summary", "status", "validation", "risks", "nextSteps"]
      }
    }));

    return {
      planId: `plan_${Date.now()}`,
      status: "planned",
      project: request.project,
      workflow: request.workflow,
      criticidade: request.criticidade || "medium",
      primaryAgent: routingDecision.selectedAgent,
      agents,
      steps,
      gates: this.buildGates(request)
    };
  }

  buildGates(request) {
    const gates = ["runtime-state-validation"];
    if (["high", "critical"].includes(request.criticidade)) {
      gates.push("human-validation");
    }
    if ((request.requiredPermissions || []).includes("deploy-review")) {
      gates.push("qa-validation");
    }
    return gates;
  }
}

module.exports = {
  ExecutionPlanBuilder
};
