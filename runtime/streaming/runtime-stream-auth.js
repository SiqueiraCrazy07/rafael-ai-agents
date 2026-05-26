class RuntimeStreamAuth {
  constructor({ token = "local-readonly-stream-token" } = {}) {
    this.token = token;
  }

  authorize(request = {}) {
    const requestedToken = request.token || request.headers?.["x-stream-token"] || request.headers?.authorization?.replace("Bearer ", "");
    const destructiveCommand = Boolean(request.command && !["subscribe", "replay-snapshot", "ping"].includes(request.command));
    if (destructiveCommand) {
      return {
        authorized: false,
        reason: "destructive-stream-command-denied",
        readonly: true,
        permissions: [],
        safetyMode: "readonly-safe-stream-auth"
      };
    }
    if (requestedToken !== this.token) {
      return {
        authorized: false,
        reason: "invalid-local-stream-token",
        readonly: true,
        permissions: [],
        safetyMode: "readonly-safe-stream-auth"
      };
    }
    return {
      authorized: true,
      reason: "local-readonly-token-accepted",
      readonly: true,
      permissions: ["runtime:read", "telemetry:read", "dashboard:read"],
      safetyMode: "readonly-safe-stream-auth"
    };
  }
}

module.exports = {
  RuntimeStreamAuth
};
