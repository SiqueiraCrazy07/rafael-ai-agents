module.exports = {
  connectorId: "unhealthy-readonly-connector",
  capabilities: ["telemetry-read"],
  readonly: true,
  enabled: true,
  authRequired: true,
  healthStatus: "unhealthy",
  version: "1.0.0",
  metadata: {
    owner: "platform",
    governed: true,
    description: "Unhealthy connector used to validate fallback and skip behavior."
  },
  handlers: {
    healthCheck() {
      return {
        readonly: true,
        healthStatus: "unhealthy",
        reason: "simulated-unhealthy-connector"
      };
    },
    execute() {
      return {
        readonly: true,
        result: "should-be-skipped-while-unhealthy"
      };
    }
  }
};
