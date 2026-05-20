module.exports = {
  pluginId: "readonly-dashboard-plugin",
  type: "dashboard-observer",
  hooks: ["afterTelemetry", "afterDecision", "afterWorkflow"],
  dependencies: ["dashboard-runtime-api-v1", "dashboard-web-v1"],
  readonly: true,
  enabled: true,
  version: "1.0.0",
  metadata: {
    owner: "platform",
    description: "Adds readonly dashboard-facing observations."
  },
  handlers: {
    afterTelemetry(context) {
      return {
        readonly: true,
        dashboardApi: context.dashboardApi || "dashboard-runtime-api-v1",
        action: "refresh-dashboard-read-model"
      };
    },
    afterDecision(context) {
      return {
        readonly: true,
        decisionId: context.decisionId || null,
        dashboardSignal: "decision-visible"
      };
    },
    afterWorkflow(context) {
      return {
        readonly: true,
        workflowId: context.workflowId || null,
        dashboardSignal: "workflow-lifecycle-visible"
      };
    }
  }
};
