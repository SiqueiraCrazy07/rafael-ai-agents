class RuntimeContainerHealth {
  constructor({ staleAfterMs = 60_000 } = {}) {
    this.staleAfterMs = staleAfterMs;
  }

  evaluate(containers = []) {
    const now = Date.now();
    return containers.map((container) => {
      const lastHeartbeatAt = new Date(container.lastHeartbeatAt || container.createdAt || 0).getTime();
      const stale = now - lastHeartbeatAt > this.staleAfterMs;
      const unhealthy = stale || container.status === "unhealthy" || container.policy?.allowed === false;
      return {
        containerId: container.containerId,
        service: container.service,
        role: container.role,
        status: unhealthy ? "unhealthy" : "healthy",
        stale,
        unhealthy,
        reason: unhealthy
          ? stale
            ? "stale-container-heartbeat"
            : container.policy?.allowed === false
              ? "container-policy-violation"
              : "container-unhealthy"
          : "container-healthy",
        restartRecommendation: unhealthy
          ? {
              action: "restart-after-policy-review",
              executeRestart: false,
              requiresHumanGate: true
            }
          : null,
        safetyMode: "readonly-safe-container-health"
      };
    });
  }
}

module.exports = {
  RuntimeContainerHealth
};
