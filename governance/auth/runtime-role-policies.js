const ROLE_POLICIES = {
  admin: {
    role: "admin",
    readonly: true,
    permissions: [
      "dashboard:access",
      "queue:read",
      "recovery:plan",
      "replay:read",
      "replication:visibility",
      "stream:admin",
      "stream:subscribe",
      "transport:visibility",
      "worker:read"
    ],
    deniedOperations: ["destructive:*", "secrets:read", "runtime:mutate"],
    safetyMode: "readonly-safe-admin"
  },
  operator: {
    role: "operator",
    readonly: true,
    permissions: [
      "dashboard:access",
      "queue:read",
      "recovery:plan",
      "stream:subscribe",
      "transport:visibility",
      "worker:read"
    ],
    deniedOperations: ["stream:admin", "destructive:*", "runtime:mutate"],
    safetyMode: "readonly-safe-operator"
  },
  observer: {
    role: "observer",
    readonly: true,
    permissions: ["dashboard:access", "stream:subscribe", "transport:visibility"],
    deniedOperations: ["replay:read", "recovery:plan", "stream:admin", "destructive:*", "runtime:mutate"],
    safetyMode: "readonly-safe-observer"
  },
  auditor: {
    role: "auditor",
    readonly: true,
    permissions: ["dashboard:access", "transport:visibility", "replication:visibility"],
    deniedOperations: ["queue:read", "replay:read", "recovery:plan", "stream:admin", "destructive:*"],
    safetyMode: "readonly-safe-auditor"
  },
  "replay-operator": {
    role: "replay-operator",
    readonly: true,
    permissions: ["dashboard:access", "replay:read", "stream:subscribe", "transport:visibility"],
    deniedOperations: ["replay:execute", "recovery:execute", "stream:admin", "destructive:*"],
    safetyMode: "readonly-safe-replay-operator"
  },
  "runtime-manager": {
    role: "runtime-manager",
    readonly: true,
    permissions: [
      "dashboard:access",
      "queue:read",
      "recovery:plan",
      "replication:visibility",
      "stream:subscribe",
      "transport:visibility",
      "worker:read"
    ],
    deniedOperations: ["runtime:mutate", "worker:execute", "queue:mutate", "destructive:*"],
    safetyMode: "readonly-safe-runtime-manager"
  }
};

function getRolePolicy(role) {
  return ROLE_POLICIES[role] || null;
}

function listRolePolicies() {
  return Object.values(ROLE_POLICIES).map((policy) => ({
    ...policy,
    permissions: [...policy.permissions],
    deniedOperations: [...policy.deniedOperations]
  }));
}

module.exports = {
  ROLE_POLICIES,
  getRolePolicy,
  listRolePolicies
};
