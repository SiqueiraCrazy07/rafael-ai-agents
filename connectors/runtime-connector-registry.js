function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function validateConnector(connector) {
  const errors = [];

  if (!connector || typeof connector !== "object") {
    return {
      valid: false,
      errors: ["connector must be an object"]
    };
  }

  if (!connector.connectorId || typeof connector.connectorId !== "string") {
    errors.push("connectorId is required");
  }

  if (asArray(connector.capabilities).length === 0) {
    errors.push("capabilities are required");
  }

  if (connector.readonly !== true) {
    errors.push("connector must be readonly=true");
  }

  if (typeof connector.enabled !== "boolean") {
    errors.push("enabled boolean is required");
  }

  if (typeof connector.authRequired !== "boolean") {
    errors.push("authRequired boolean is required");
  }

  if (!["healthy", "degraded", "unhealthy", "disabled"].includes(connector.healthStatus)) {
    errors.push("healthStatus must be healthy, degraded, unhealthy or disabled");
  }

  if (!connector.version || typeof connector.version !== "string") {
    errors.push("version is required");
  }

  if (!connector.metadata || typeof connector.metadata !== "object") {
    errors.push("metadata object is required");
  }

  if (connector.destructiveActions === true) {
    errors.push("destructive connector actions are not allowed");
  }

  if (connector.authRequired === false && connector.metadata.governed !== true) {
    errors.push("connectors without auth must declare metadata.governed=true");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

class RuntimeConnectorRegistry {
  constructor() {
    this.connectors = new Map();
    this.rejected = [];
  }

  register(connector, sourcePath = null) {
    const validation = validateConnector(connector);
    if (!validation.valid) {
      const rejected = {
        connectorId: connector && connector.connectorId ? connector.connectorId : "unknown-connector",
        sourcePath,
        errors: validation.errors,
        fallback: {
          safeMode: true,
          reason: "connector-validation-failed"
        }
      };
      this.rejected.push(rejected);
      return {
        registered: false,
        connector: null,
        validation,
        rejected
      };
    }

    const normalized = {
      ...connector,
      sourcePath,
      loadedAt: new Date().toISOString()
    };
    this.connectors.set(normalized.connectorId, normalized);

    return {
      registered: true,
      connector: normalized,
      validation
    };
  }

  list(options = {}) {
    const connectors = [...this.connectors.values()];
    if (options.enabledOnly) {
      return connectors.filter((connector) => connector.enabled === true);
    }
    return connectors;
  }

  unhealthyConnectors() {
    return this.list().filter((connector) => connector.healthStatus === "unhealthy" || connector.enabled === false);
  }

  rejectedConnectors() {
    return this.rejected;
  }
}

module.exports = {
  RuntimeConnectorRegistry,
  validateConnector
};
