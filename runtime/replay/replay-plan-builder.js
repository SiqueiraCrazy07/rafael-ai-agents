class ReplayPlanBuilder {
  build(input = {}) {
    const filters = {
      workflowId: input.workflowId || null,
      executionId: input.executionId || null,
      correlationId: input.correlationId || null
    };
    const reasons = [];
    if (filters.workflowId) reasons.push("workflow-filter");
    if (filters.executionId) reasons.push("execution-filter");
    if (filters.correlationId) reasons.push("correlation-filter");

    return {
      replayPlanId: `replay_plan_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      readonly: true,
      destructiveActions: false,
      reexecuteWorkflow: false,
      safetyMode: "readonly-safe-workflow-replay",
      filters,
      source: "workflow-replay-engine",
      reason: reasons.length ? reasons.join("+") : "latest-execution-replay",
      steps: [
        "load execution journal",
        "load execution checkpoints",
        "load event bus events",
        "validate readonly-safe replay",
        "reconstruct timeline",
        "persist replay audit"
      ]
    };
  }
}

module.exports = {
  ReplayPlanBuilder
};
