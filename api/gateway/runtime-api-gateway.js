const { RuntimeAuthAudit } = require("../../governance/auth/runtime-auth-audit");
const { RuntimeAuthManager } = require("../../governance/auth/runtime-auth-manager");
const { RuntimeApiAudit } = require("./runtime-api-audit");
const { RuntimeApiRateLimit } = require("./runtime-api-rate-limit");
const { RuntimeApiVersioning } = require("./runtime-api-versioning");
const { RuntimeControlPlane } = require("./runtime-control-plane");
const { RuntimeRequestValidator } = require("./runtime-request-validator");
const { RuntimeResponseEnvelope } = require("./runtime-response-envelope");
const { RuntimeRouteRegistry } = require("./runtime-route-registry");

class RuntimeApiGateway {
  constructor({
    rootDir = process.cwd(),
    routeRegistry = new RuntimeRouteRegistry(),
    requestValidator = new RuntimeRequestValidator(),
    responseEnvelope = new RuntimeResponseEnvelope(),
    controlPlane = new RuntimeControlPlane({ rootDir }),
    audit = new RuntimeApiAudit({ rootDir }),
    rateLimit = new RuntimeApiRateLimit(),
    versioning = new RuntimeApiVersioning(),
    authManager = null
  } = {}) {
    this.rootDir = rootDir;
    this.routeRegistry = routeRegistry;
    this.requestValidator = requestValidator;
    this.responseEnvelope = responseEnvelope;
    this.controlPlane = controlPlane;
    this.audit = audit;
    this.rateLimit = rateLimit;
    this.versioning = versioning;
    this.authManager = authManager || new RuntimeAuthManager({ audit: new RuntimeAuthAudit({ rootDir }) });
  }

  createLocalIdentity({ role = "admin", tenantId = "tenant-platform" } = {}) {
    return this.authManager.authenticate({
      identityId: `gateway-${role}-identity`,
      role,
      tenantId,
      project: "platform",
      runtimeNodeId: "api-gateway-local",
      scopes: ["readonly-runtime-gateway"]
    });
  }

  handle(request = {}) {
    const route = this.routeRegistry.resolve(request.path);
    const validation = this.requestValidator.validate(request, route);
    const auditBase = {
      type: "request",
      requestId: validation.requestId,
      correlationId: validation.correlationId,
      tenantId: validation.tenantId,
      path: request.path,
      routePath: route?.path || null
    };

    if (!validation.valid) {
      this.audit.record({ ...auditBase, status: "denied", reason: validation.reason });
      return this.responseEnvelope.denied({ request: validation, route, reason: validation.reason });
    }

    const rateLimit = this.rateLimit.check({ tenantId: validation.tenantId, routePath: route.path });
    if (!rateLimit.allowed) {
      this.audit.record({ ...auditBase, status: "denied", reason: rateLimit.reason });
      return this.responseEnvelope.denied({ request: validation, route, reason: rateLimit.reason, rateLimit });
    }

    const authorization = this.authManager.authorize({
      token: request.token,
      permission: route.permission,
      operation: route.permission,
      requestedTenantId: validation.tenantId
    });
    if (!authorization.allowed) {
      this.audit.record({ ...auditBase, status: "denied", reason: authorization.reason, authorization });
      return this.responseEnvelope.denied({ request: validation, route, reason: authorization.reason, authorization, rateLimit });
    }

    const inspection = this.controlPlane.inspect(route);
    const version = this.versioning.metadata(route);
    const response = this.responseEnvelope.build({
      request: validation,
      route,
      source: inspection.source,
      data: {
        version,
        route: {
          path: route.path,
          fullPath: route.fullPath,
          permission: route.permission,
          controlPlane: route.controlPlane
        },
        authorization: {
          allowed: authorization.allowed,
          role: authorization.role,
          permission: authorization.permission,
          reason: authorization.reason
        },
        rateLimit,
        inspection
      },
      fallback: inspection.fallback,
      readErrors: inspection.readErrors,
      warnings: validation.warnings
    });
    this.audit.record({ ...auditBase, status: "allowed", reason: "gateway-request-served", source: inspection.source });
    return response;
  }

  listRoutes() {
    return this.routeRegistry.listRoutes();
  }
}

module.exports = {
  RuntimeApiGateway
};
