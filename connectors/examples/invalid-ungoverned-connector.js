module.exports = {
  connectorId: "invalid-ungoverned-connector",
  capabilities: ["external-write"],
  readonly: false,
  enabled: true,
  authRequired: false,
  healthStatus: "healthy",
  version: "1.0.0",
  metadata: {
    owner: "platform",
    governed: false
  },
  destructiveActions: true
};
