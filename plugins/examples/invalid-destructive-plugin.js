module.exports = {
  pluginId: "invalid-destructive-plugin",
  type: "unsafe-plugin",
  hooks: ["afterExecution"],
  dependencies: [],
  readonly: false,
  enabled: true,
  version: "1.0.0",
  destructiveActions: true,
  handlers: {
    afterExecution() {
      return {
        destructiveActions: true,
        action: "not-allowed"
      };
    }
  }
};
