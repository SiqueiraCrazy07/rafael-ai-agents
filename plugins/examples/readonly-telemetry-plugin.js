module.exports = {
  pluginId: "readonly-telemetry-plugin",
  type: "telemetry-observer",
  hooks: [
    "beforeWorkflow",
    "beforeDecision",
    "beforeExecution",
    "beforeTelemetry",
    "afterTelemetry",
    "afterExecution"
  ],
  dependencies: ["telemetry-observability-runtime-v1"],
  readonly: true,
  enabled: true,
  version: "1.0.0",
  metadata: {
    owner: "platform",
    description: "Observes telemetry lifecycle without mutating runtime."
  },
  handlers: {
    beforeWorkflow(context) {
      return {
        readonly: true,
        observed: "beforeWorkflow",
        workflowId: context.workflowId || null
      };
    },
    beforeDecision(context) {
      return {
        readonly: true,
        observed: "beforeDecision",
        decisionType: context.decisionType || null
      };
    },
    beforeExecution(context) {
      return {
        readonly: true,
        observed: "beforeExecution",
        executionId: context.executionId || null,
        workerId: context.workerId || null
      };
    },
    beforeTelemetry(context) {
      return {
        readonly: true,
        observed: "beforeTelemetry",
        telemetryReportId: context.telemetryReportId || null
      };
    },
    afterTelemetry(context) {
      return {
        readonly: true,
        observed: "afterTelemetry",
        source: context.source || "telemetry"
      };
    },
    afterExecution(context) {
      return {
        readonly: true,
        observed: "afterExecution",
        executionId: context.executionId || null,
        status: context.status || "unknown"
      };
    }
  }
};
