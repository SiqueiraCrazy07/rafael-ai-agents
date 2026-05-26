const { getRolePolicy } = require("./runtime-role-policies");

const DESTRUCTIVE_PATTERNS = [
  "destructive:",
  ":execute",
  ":mutate",
  "secrets:",
  "filesystem:write",
  "network:external"
];

class RuntimeRbacEngine {
  evaluate({ role, permission, operation = permission, tenantScope }) {
    const policy = getRolePolicy(role);
    if (!policy) {
      return this.deny({ role, permission, operation, reason: "unknown-role", tenantScope });
    }

    const destructive = DESTRUCTIVE_PATTERNS.some((pattern) => operation.includes(pattern) || permission.includes(pattern));
    if (destructive) {
      return this.deny({
        role,
        permission,
        operation,
        reason: "destructive-operation-denied",
        policy,
        tenantScope,
        escalationRecommendation: "human-gate-required-for-destructive-operation"
      });
    }

    if (!policy.permissions.includes(permission)) {
      return this.deny({
        role,
        permission,
        operation,
        reason: "permission-not-granted",
        policy,
        tenantScope,
        escalationRecommendation: "request-governance-review-before-expanding-role"
      });
    }

    return {
      allowed: true,
      role,
      permission,
      operation,
      reason: "permission-granted-readonly",
      readonly: true,
      safetyMode: policy.safetyMode,
      tenantScope
    };
  }

  deny({ role, permission, operation, reason, policy = null, tenantScope, escalationRecommendation = "deny-by-default" }) {
    return {
      allowed: false,
      role,
      permission,
      operation,
      reason,
      readonly: true,
      safetyMode: "readonly-safe-rbac-deny",
      policy: policy ? { role: policy.role, permissions: policy.permissions } : null,
      tenantScope,
      escalationRecommendation
    };
  }
}

module.exports = {
  RuntimeRbacEngine
};
