const { RuntimePermissionRegistry } = require("./runtime-permission-registry");
const { RuntimeRbacEngine } = require("./runtime-rbac-engine");
const { RuntimeSessionManager } = require("./runtime-session-manager");
const { RuntimeTenantScope } = require("./runtime-tenant-scope");
const { RuntimeTokenManager } = require("./runtime-token-manager");

class RuntimeAuthManager {
  constructor({
    tokenManager = new RuntimeTokenManager(),
    sessionManager = new RuntimeSessionManager(),
    rbacEngine = new RuntimeRbacEngine(),
    permissionRegistry = new RuntimePermissionRegistry(),
    tenantScope = new RuntimeTenantScope(),
    audit = null
  } = {}) {
    this.tokenManager = tokenManager;
    this.sessionManager = sessionManager;
    this.rbacEngine = rbacEngine;
    this.permissionRegistry = permissionRegistry;
    this.tenantScope = tenantScope;
    this.audit = audit;
  }

  authenticate({ identityId, role, tenantId, project, runtimeNodeId, scopes = [] }) {
    const scope = this.tenantScope.resolveScope({ tenantId, project, runtimeNodeId });
    const token = this.tokenManager.issueToken({
      identityId,
      role,
      tenantId: scope.tenantId,
      scopes
    });
    const session = this.sessionManager.createSession({
      identityId,
      role,
      token: token.token,
      tenantId: scope.tenantId
    });
    const auth = {
      authenticated: true,
      identity: {
        identityId,
        role,
        runtimeIdentityType: "local-runtime-identity",
        externalProvider: false,
        readonly: true
      },
      token,
      session,
      tenantScope: scope,
      reason: "local-token-authenticated-readonly",
      safetyMode: "readonly-safe-runtime-auth"
    };
    this.recordAudit({
      eventType: "auth.success",
      identityId,
      role,
      tenantId: scope.tenantId,
      status: "allowed",
      reason: auth.reason
    });
    return auth;
  }

  authorize({ token, permission, operation = permission, requestedTenantId }) {
    const validation = this.tokenManager.validateToken(token);
    if (!validation.valid) {
      const denied = {
        allowed: false,
        permission,
        operation,
        reason: validation.reason,
        tokenValidation: validation,
        safetyMode: "readonly-safe-auth-deny",
        escalationRecommendation: "reauthenticate-with-local-token"
      };
      this.recordAudit({
        eventType: "auth.denied",
        status: "denied",
        permission,
        operation,
        reason: denied.reason,
        allowed: false
      });
      return denied;
    }

    const { metadata } = validation;
    const tenantAuthorization = this.tenantScope.authorizeScope({
      sessionTenantId: metadata.tenantId,
      requestedTenantId
    });
    if (!tenantAuthorization.allowed) {
      const denied = {
        allowed: false,
        permission,
        operation,
        reason: tenantAuthorization.reason,
        tokenValidation: validation,
        tenantAuthorization,
        safetyMode: "readonly-safe-tenant-deny",
        escalationRecommendation: "cross-tenant-access-requires-governance-review"
      };
      this.recordAudit({
        eventType: "auth.denied",
        status: "denied",
        identityId: metadata.identityId,
        role: metadata.role,
        permission,
        operation,
        reason: denied.reason,
        allowed: false
      });
      return denied;
    }

    const permissionKnown = this.permissionRegistry.isKnown(permission);
    if (!permissionKnown) {
      const denied = {
        allowed: false,
        permission,
        operation,
        reason: "unknown-permission",
        tokenValidation: validation,
        tenantAuthorization,
        safetyMode: "readonly-safe-permission-deny",
        escalationRecommendation: "register-permission-before-use"
      };
      this.recordAudit({
        eventType: "auth.denied",
        status: "denied",
        identityId: metadata.identityId,
        role: metadata.role,
        permission,
        operation,
        reason: denied.reason,
        allowed: false
      });
      return denied;
    }

    const decision = this.rbacEngine.evaluate({
      role: metadata.role,
      permission,
      operation,
      tenantScope: tenantAuthorization
    });
    this.recordAudit({
      eventType: decision.allowed ? "auth.authorized" : "auth.denied",
      status: decision.allowed ? "allowed" : "denied",
      identityId: metadata.identityId,
      role: metadata.role,
      permission,
      operation,
      reason: decision.reason,
      allowed: decision.allowed,
      escalationRecommendation: decision.escalationRecommendation
    });
    return {
      ...decision,
      tokenValidation: {
        valid: validation.valid,
        reason: validation.reason,
        expiration: validation.expiration
      },
      tenantAuthorization
    };
  }

  listSessions() {
    return this.sessionManager.evaluateSessions();
  }

  recordAudit(event) {
    if (this.audit) {
      return this.audit.record(event);
    }
    return null;
  }
}

module.exports = {
  RuntimeAuthManager
};
