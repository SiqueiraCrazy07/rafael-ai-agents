class RuntimeResponseEnvelope {
  build({ request, route, status = "ok", source, data = null, fallback = null, readErrors = [], warnings = [] }) {
    return {
      ok: status === "ok",
      status,
      requestId: request.requestId,
      correlationId: request.correlationId,
      tenantId: request.tenantId,
      route: route ? route.fullPath : null,
      source,
      timestamp: new Date().toISOString(),
      fallback: fallback || { used: false, reason: null },
      readErrors,
      warnings,
      data,
      readonly: true,
      safetyMode: "readonly-safe-gateway-response-envelope"
    };
  }

  denied({ request, route = null, reason, authorization = null, rateLimit = null }) {
    return this.build({
      request: {
        requestId: request.requestId,
        correlationId: request.correlationId,
        tenantId: request.tenantId || "unknown-tenant"
      },
      route,
      status: "denied",
      source: "api-gateway",
      data: {
        reason,
        authorization,
        rateLimit
      },
      fallback: { used: true, reason: "deny-readonly" },
      warnings: [reason]
    });
  }
}

module.exports = {
  RuntimeResponseEnvelope
};
