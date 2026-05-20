module.exports = {
  connectorId: "readonly-mock-connector",
  capabilities: ["telemetry-read", "dashboard-read", "worker-read"],
  readonly: true,
  enabled: true,
  authRequired: false,
  healthStatus: "healthy",
  version: "1.0.0",
  metadata: {
    owner: "platform",
    governed: true,
    description: "Mock readonly connector for platform integration demos."
  },
  handlers: {
    healthCheck() {
      return {
        readonly: true,
        healthStatus: "healthy",
        checkedAt: new Date().toISOString()
      };
    },
    execute(context) {
      return {
        readonly: true,
        capability: context.capability,
        source: context.source || "platform",
        result: "mock-readonly-data"
      };
    }
  }
};
