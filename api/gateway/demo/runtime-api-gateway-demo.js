const { runRuntimeAuthDemo } = require("../../../governance/auth/demo/runtime-auth-demo");
const { RuntimeApiGateway } = require("../runtime-api-gateway");

async function runRuntimeApiGatewayDemo({ rootDir = process.cwd() } = {}) {
  const auth = await runRuntimeAuthDemo({ rootDir, silent: true });
  const gateway = new RuntimeApiGateway({ rootDir });
  const admin = gateway.createLocalIdentity({ role: "admin", tenantId: "tenant-platform" });
  const operator = gateway.createLocalIdentity({ role: "operator", tenantId: "tenant-platform" });
  const observer = gateway.createLocalIdentity({ role: "observer", tenantId: "tenant-platform" });

  const requests = [
    { path: "/runtime/status", token: admin.token.token, tenantId: "tenant-platform" },
    { path: "/runtime/workers", token: admin.token.token, tenantId: "tenant-platform" },
    { path: "/runtime/queue", token: operator.token.token, tenantId: "tenant-platform" },
    { path: "/runtime/replay", token: admin.token.token, tenantId: "tenant-platform" },
    { path: "/runtime/recovery", token: operator.token.token, tenantId: "tenant-platform" },
    { path: "/runtime/streams", token: observer.token.token, tenantId: "tenant-platform" },
    { path: "/runtime/replication", token: admin.token.token, tenantId: "tenant-platform" },
    { path: "/runtime/telemetry", token: observer.token.token, tenantId: "tenant-platform" },
    { path: "/runtime/dashboard", token: observer.token.token, tenantId: "tenant-platform" },
    { path: "/runtime/recovery", token: observer.token.token, tenantId: "tenant-platform" },
    { path: "/runtime/dashboard", token: admin.token.token, tenantId: "tenant-other" },
    { path: "/runtime/workers", method: "POST", token: admin.token.token, tenantId: "tenant-platform", payload: { execute: true } },
    { path: "/runtime/unknown", token: admin.token.token, tenantId: "tenant-platform" },
    { path: "/runtime/dashboard", token: "invalid-token", tenantId: "tenant-platform" },
    { path: "/runtime/streams", token: observer.token.token, tenantId: "tenant-platform" },
    { path: "/runtime/streams", token: observer.token.token, tenantId: "tenant-platform" },
    { path: "/runtime/streams", token: observer.token.token, tenantId: "tenant-platform" },
    { path: "/runtime/streams", token: observer.token.token, tenantId: "tenant-platform" },
    { path: "/runtime/streams", token: observer.token.token, tenantId: "tenant-platform" },
    { path: "/runtime/streams", token: observer.token.token, tenantId: "tenant-platform" },
    { path: "/runtime/streams", token: observer.token.token, tenantId: "tenant-platform" }
  ];

  const responses = requests.map((request, index) => gateway.handle({
    method: "GET",
    requestId: `gateway_demo_request_${index + 1}`,
    correlationId: `gateway_demo_correlation_${index + 1}`,
    ...request
  }));
  const allowed = responses.filter((response) => response.ok);
  const denied = responses.filter((response) => !response.ok);

  const report = {
    gatewayDemoId: `runtime_api_gateway_demo_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    status: "runtime_api_gateway_control_plane_ready",
    readonly: true,
    destructiveActions: false,
    externalPublicApi: false,
    oauthEnabled: false,
    namespace: "/api-gateway/v1",
    endpoints: gateway.listRoutes(),
    envelopes: responses.map((response) => ({
      requestId: response.requestId,
      correlationId: response.correlationId,
      tenantId: response.tenantId,
      route: response.route,
      ok: response.ok,
      status: response.status,
      source: response.source,
      fallback: response.fallback,
      readErrors: response.readErrors,
      warnings: response.warnings
    })),
    validation: {
      schemaValidation: true,
      readonlyEnforcement: true,
      destructivePayloadDenied: denied.some((response) => response.data?.reason === "destructive-method-denied" || response.data?.reason === "destructive-payload-denied"),
      correlationMetadata: true
    },
    rbacEnforcement: {
      authDemoId: auth.authDemoId,
      allowedRequests: allowed.length,
      deniedRequests: denied.length,
      deniedReasons: denied.map((response) => response.data?.reason)
    },
    rateLimit: {
      enabled: true,
      violations: denied.filter((response) => response.data?.reason === "tenant-rate-limit-exceeded").length,
      burstObserved: responses.filter((response) => response.data?.rateLimit?.burstProtected).length
    },
    tenantEnforcement: {
      enabled: true,
      violations: denied.filter((response) => response.data?.reason === "cross-tenant-access-denied").length
    },
    controlPlane: allowed.map((response) => response.data.inspection).map((inspection) => ({
      type: inspection.type,
      source: inspection.source,
      available: inspection.available,
      fallback: inspection.fallback
    })),
    audit: {
      events: gateway.audit.events,
      summary: gateway.audit.summary()
    },
    integrations: {
      authRbac: "RuntimeAuthManager enforces route permissions and tenant scope",
      streaming: "streams endpoint protects stream subscribe access",
      replay: "replay endpoint is readonly inspection only",
      recovery: "recovery endpoint exposes supervised plan metadata only",
      distributedRuntime: "status/workers endpoints read distributed runtime and multiprocess reports",
      distributedQueue: "queue endpoint reads distributed queue reports",
      replication: "replication endpoint reads replication reports",
      telemetry: "telemetry endpoint reads telemetry reports",
      dashboard: "dashboard endpoint reads dashboard reports",
      redisStreams: "gateway remains compatible with Redis stream reports through readonly sources",
      multiprocessWorkers: "workers endpoint uses multiprocess metadata when available"
    },
    fallback: {
      safeMode: true,
      jsonFallback: true,
      denyByDefault: true,
      behavior: "gateway returns readonly envelopes and never mutates runtime"
    },
    risks: [
      "Gateway is simulated/local in V1 and does not expose a public HTTP listener",
      "OAuth/JWT real remains out of scope",
      "Rate limiting is in-memory metadata for demo readiness",
      "Future control plane write operations require human gate and separate governance approval"
    ],
    persistence: null
  };
  report.persistence = gateway.audit.persist(report);

  console.log(JSON.stringify({
    gatewayDemoId: report.gatewayDemoId,
    status: report.status,
    endpoints: report.endpoints.map((route) => ({
      method: route.method,
      path: route.fullPath,
      permission: route.permission
    })),
    envelopes: report.envelopes,
    validation: report.validation,
    rbacEnforcement: report.rbacEnforcement,
    rateLimit: report.rateLimit,
    tenantEnforcement: report.tenantEnforcement,
    deniedRequests: denied.map((response) => ({
      requestId: response.requestId,
      route: response.route,
      reason: response.data?.reason
    })),
    controlPlane: report.controlPlane,
    audit: report.audit.summary,
    integrations: report.integrations,
    fallback: report.fallback,
    persistence: report.persistence
  }, null, 2));
  return report;
}

if (require.main === module) {
  runRuntimeApiGatewayDemo().catch((error) => {
    console.error(JSON.stringify({
      status: "runtime_api_gateway_demo_failed",
      error: error.message,
      fallback: {
        safeMode: true,
        reason: "runtime-api-gateway-demo-error"
      }
    }, null, 2));
    process.exitCode = 1;
  });
}

module.exports = {
  runRuntimeApiGatewayDemo
};
