class HandoffEngine {
  createHandoff({ executionId, fromAgent, toAgent, context, status = "pending" }) {
    if (!executionId || !fromAgent || !toAgent) {
      throw new Error("executionId, fromAgent and toAgent are required for handoff");
    }

    if (!context || !context.project || !context.workflow || !context.objective) {
      throw new Error("handoff context must include project, workflow and objective");
    }

    return {
      handoffId: `handoff_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      executionId,
      fromAgent,
      toAgent,
      status,
      createdAt: new Date().toISOString(),
      context: {
        project: context.project,
        workflow: context.workflow,
        objective: context.objective,
        summary: context.summary || "",
        files: context.files || [],
        risks: context.risks || [],
        nextAction: context.nextAction || ""
      }
    };
  }
}

module.exports = {
  HandoffEngine
};
