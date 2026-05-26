class RuntimeTenantScope {
  constructor({ defaultTenantId = "default-runtime-tenant" } = {}) {
    this.defaultTenantId = defaultTenantId;
  }

  resolveScope({ tenantId, project = "platform", runtimeNodeId = "local-runtime-node" } = {}) {
    const resolvedTenantId = tenantId || this.defaultTenantId;
    return {
      tenantId: resolvedTenantId,
      project,
      runtimeNodeId,
      isolated: true,
      crossTenantAccess: false,
      dataBoundary: `tenant:${resolvedTenantId}:project:${project}`,
      futureMultiTenantReady: true,
      safetyMode: "readonly-safe-tenant-scope"
    };
  }

  authorizeScope({ sessionTenantId, requestedTenantId }) {
    const allowed = !requestedTenantId || sessionTenantId === requestedTenantId;
    return {
      allowed,
      reason: allowed ? "tenant-scope-matched" : "cross-tenant-access-denied",
      sessionTenantId,
      requestedTenantId: requestedTenantId || sessionTenantId,
      readonly: true
    };
  }
}

module.exports = {
  RuntimeTenantScope
};
