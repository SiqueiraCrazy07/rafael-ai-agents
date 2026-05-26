const DESTRUCTIVE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];
const DESTRUCTIVE_KEYS = ["execute", "delete", "mutate", "write", "secret", "deploy", "publish"];

class RuntimeRequestValidator {
  validate(request = {}, route = null) {
    const requestId = request.requestId || `gateway_request_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    const correlationId = request.correlationId || `gateway_correlation_${Date.now()}`;
    const method = (request.method || "GET").toUpperCase();
    const payload = request.payload || {};
    const payloadKeys = Object.keys(payload).map((key) => key.toLowerCase());
    const destructivePayload = payloadKeys.some((key) => DESTRUCTIVE_KEYS.some((pattern) => key.includes(pattern)));

    if (!route) {
      return this.deny({ requestId, correlationId, method, reason: "route-not-registered" });
    }
    if (DESTRUCTIVE_METHODS.includes(method)) {
      return this.deny({ requestId, correlationId, method, reason: "destructive-method-denied", route });
    }
    if (destructivePayload) {
      return this.deny({ requestId, correlationId, method, reason: "destructive-payload-denied", route });
    }
    if (request.query && typeof request.query !== "object") {
      return this.deny({ requestId, correlationId, method, reason: "invalid-query-schema", route });
    }

    return {
      valid: true,
      requestId,
      correlationId,
      method,
      routePath: route.path,
      tenantId: request.tenantId || "tenant-platform",
      warnings: [],
      readonly: true,
      safetyMode: "readonly-safe-gateway-request-validation"
    };
  }

  deny({ requestId, correlationId, method, reason, route = null }) {
    return {
      valid: false,
      requestId,
      correlationId,
      method,
      routePath: route?.path || null,
      reason,
      warnings: [reason],
      readonly: true,
      safetyMode: "readonly-safe-gateway-request-deny"
    };
  }
}

module.exports = {
  RuntimeRequestValidator
};
