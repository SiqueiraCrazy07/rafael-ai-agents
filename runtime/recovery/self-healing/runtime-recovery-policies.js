class RuntimeRecoveryPolicies {
  constructor({ maxRecoveriesPerRun = 3, allowAutomaticRequeue = true } = {}) {
    this.maxRecoveriesPerRun = maxRecoveriesPerRun;
    this.allowAutomaticRequeue = allowAutomaticRequeue;
  }

  canRecoverLease({ staleWorker, expiredLease }) {
    if (!this.allowAutomaticRequeue) {
      return {
        allowed: false,
        reason: "automatic requeue disabled"
      };
    }

    if (!staleWorker) {
      return {
        allowed: false,
        reason: "expired lease worker is not marked stale"
      };
    }

    if (!expiredLease || expiredLease.status !== "expired") {
      return {
        allowed: false,
        reason: "lease is not expired"
      };
    }

    return {
      allowed: true,
      reason: "stale worker with expired lease is recoverable"
    };
  }
}

module.exports = {
  RuntimeRecoveryPolicies
};
