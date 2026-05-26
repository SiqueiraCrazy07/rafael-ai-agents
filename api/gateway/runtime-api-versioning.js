class RuntimeApiVersioning {
  constructor({ currentVersion = "v1", namespace = "/api-gateway/v1" } = {}) {
    this.currentVersion = currentVersion;
    this.namespace = namespace;
  }

  metadata(route = {}) {
    return {
      version: this.currentVersion,
      namespace: this.namespace,
      route: route.fullPath || route.path || null,
      deprecated: Boolean(route.deprecated),
      futureCompatibility: {
        additiveFieldsOnly: true,
        readonlyContract: true,
        destructiveRoutesBlocked: true
      },
      safetyMode: "readonly-safe-api-versioning"
    };
  }
}

module.exports = {
  RuntimeApiVersioning
};
