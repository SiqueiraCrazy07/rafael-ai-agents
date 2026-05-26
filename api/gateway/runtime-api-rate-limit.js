class RuntimeApiRateLimit {
  constructor({ maxRequestsPerTenant = 6, maxBurst = 3 } = {}) {
    this.maxRequestsPerTenant = maxRequestsPerTenant;
    this.maxBurst = maxBurst;
    this.counters = new Map();
  }

  check({ tenantId = "default-runtime-tenant", routePath, timestamp = new Date() }) {
    const key = `${tenantId}:${routePath}`;
    const current = this.counters.get(key) || { count: 0, firstSeenAt: timestamp.toISOString() };
    current.count += 1;
    current.lastSeenAt = timestamp.toISOString();
    this.counters.set(key, current);

    const limited = current.count > this.maxRequestsPerTenant;
    const burstProtected = current.count > this.maxBurst;
    return {
      allowed: !limited,
      tenantId,
      routePath,
      count: current.count,
      maxRequestsPerTenant: this.maxRequestsPerTenant,
      burstProtected,
      streamProtection: routePath.includes("streams") ? { enabled: true, reason: "stream-route-burst-protection" } : null,
      reason: limited ? "tenant-rate-limit-exceeded" : burstProtected ? "burst-protection-observed" : "within-limit",
      readonly: true,
      safetyMode: "readonly-safe-api-rate-limit"
    };
  }
}

module.exports = {
  RuntimeApiRateLimit
};
