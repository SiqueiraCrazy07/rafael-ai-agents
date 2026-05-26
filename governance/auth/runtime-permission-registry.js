const PERMISSIONS = {
  replay: {
    permission: "replay:read",
    description: "Read replay plans, timelines and replay metadata without executing workflows.",
    destructive: false
  },
  recovery: {
    permission: "recovery:plan",
    description: "Read recovery recommendations and create supervised recovery metadata.",
    destructive: false
  },
  streamSubscribe: {
    permission: "stream:subscribe",
    description: "Subscribe to readonly runtime streams and snapshot fallback channels.",
    destructive: false
  },
  streamAdmin: {
    permission: "stream:admin",
    description: "Manage stream metadata and readonly subscriber registry.",
    destructive: false,
    highRisk: true
  },
  queueOperations: {
    permission: "queue:read",
    description: "Inspect queue pressure, partitions and retry metadata.",
    destructive: false
  },
  workerOperations: {
    permission: "worker:read",
    description: "Inspect worker health, leases and execution metadata.",
    destructive: false
  },
  dashboardAccess: {
    permission: "dashboard:access",
    description: "Read dashboard summaries, telemetry, traces and timelines.",
    destructive: false
  },
  transportVisibility: {
    permission: "transport:visibility",
    description: "Read transport envelopes, deliveries, ack/nack and DLQ metadata.",
    destructive: false
  },
  replicationVisibility: {
    permission: "replication:visibility",
    description: "Read replication, consensus, snapshot and reconciliation metadata.",
    destructive: false
  }
};

class RuntimePermissionRegistry {
  constructor({ permissions = PERMISSIONS } = {}) {
    this.permissions = permissions;
  }

  listPermissions() {
    return Object.values(this.permissions).map((permission) => ({ ...permission }));
  }

  resolve(permission) {
    return this.listPermissions().find((entry) => entry.permission === permission) || null;
  }

  isKnown(permission) {
    return Boolean(this.resolve(permission));
  }
}

module.exports = {
  PERMISSIONS,
  RuntimePermissionRegistry
};
