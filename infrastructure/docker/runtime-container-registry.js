class RuntimeContainerRegistry {
  constructor() {
    this.containers = [];
  }

  register(container) {
    const record = {
      containerId: container.containerId || `container_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      service: container.service,
      role: container.role,
      image: container.image,
      dockerfile: container.dockerfile,
      owner: container.owner || "rafael-ai-agents-runtime",
      serviceMapping: container.serviceMapping,
      roleMapping: container.roleMapping || container.role,
      readonly: container.readonly !== false,
      status: container.status || "declared",
      createdAt: container.createdAt || new Date().toISOString(),
      lastHeartbeatAt: container.lastHeartbeatAt || new Date().toISOString(),
      capabilities: container.capabilities || [],
      mounts: container.mounts || [],
      environment: container.environment || {},
      privileged: Boolean(container.privileged),
      externalPublic: Boolean(container.externalPublic),
      safetyMode: "readonly-safe-container-registry"
    };
    this.containers.push(record);
    return record;
  }

  list() {
    return this.containers.map((container) => ({ ...container }));
  }
}

module.exports = {
  RuntimeContainerRegistry
};
