const ROUTES = [
  { path: "/runtime/status", permission: "dashboard:access", source: "memory/distributed-runtime", controlPlane: "runtime-inspection" },
  { path: "/runtime/workers", permission: "worker:read", source: "memory/multiprocess-workers", controlPlane: "worker-inspection" },
  { path: "/runtime/queue", permission: "queue:read", source: "memory/distributed-queue", controlPlane: "queue-inspection" },
  { path: "/runtime/replay", permission: "replay:read", source: "memory/replay", controlPlane: "replay-inspection" },
  { path: "/runtime/recovery", permission: "recovery:plan", source: "memory/self-healing", controlPlane: "recovery-inspection" },
  { path: "/runtime/streams", permission: "stream:subscribe", source: "memory/streaming", controlPlane: "stream-inspection" },
  { path: "/runtime/replication", permission: "replication:visibility", source: "memory/replication", controlPlane: "replication-inspection" },
  { path: "/runtime/telemetry", permission: "dashboard:access", source: "memory/telemetry", controlPlane: "telemetry-inspection" },
  { path: "/runtime/dashboard", permission: "dashboard:access", source: "memory/dashboard-web", controlPlane: "dashboard-inspection" }
];

class RuntimeRouteRegistry {
  constructor({ routes = ROUTES, namespace = "/api-gateway/v1" } = {}) {
    this.namespace = namespace;
    this.routes = routes.map((route) => ({
      ...route,
      method: "GET",
      readonly: true,
      tenantScoped: true,
      rbacRequired: true,
      fullPath: `${namespace}${route.path}`,
      deprecated: false,
      safetyMode: "readonly-safe-gateway-route"
    }));
  }

  listRoutes() {
    return this.routes.map((route) => ({ ...route }));
  }

  resolve(path) {
    return this.routes.find((route) => route.path === path || route.fullPath === path) || null;
  }
}

module.exports = {
  ROUTES,
  RuntimeRouteRegistry
};
