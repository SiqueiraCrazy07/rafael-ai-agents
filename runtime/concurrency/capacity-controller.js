class CapacityController {
  constructor({ baseCapacity = 2, policyDecision = null } = {}) {
    this.baseCapacity = baseCapacity;
    this.policyDecision = policyDecision;
  }

  calculate() {
    const platformThrottle = (this.policyDecision?.throttlingApplied || []).find(
      (item) => item.target === "platform"
    );

    if (!platformThrottle) {
      return {
        maxConcurrentExecutions: this.baseCapacity,
        mode: "normal",
        reason: "no platform throttling policy"
      };
    }

    return {
      maxConcurrentExecutions:
        platformThrottle.throttle?.maxConcurrentExecutions || this.baseCapacity,
      mode: platformThrottle.throttle?.mode || "conservative",
      reason: platformThrottle.reason
    };
  }
}

module.exports = {
  CapacityController
};
