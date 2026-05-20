const { PredictiveHumanGateEnforcer } = require("../gates/predictive-human-gate-enforcer");
const { PredictiveRecoveryTrigger } = require("../recovery/predictive-recovery-trigger");
const { PredictiveRoutingEnforcer } = require("../routing/predictive-routing-enforcer");
const { PredictiveWorkflowBlocker } = require("../routing/predictive-workflow-blocker");
const { PredictiveThrottlingEnforcer } = require("../throttling/predictive-throttling-enforcer");

class RuntimeEnforcementCoordinator {
  constructor() {
    this.throttlingEnforcer = new PredictiveThrottlingEnforcer();
    this.routingEnforcer = new PredictiveRoutingEnforcer();
    this.workflowBlocker = new PredictiveWorkflowBlocker();
    this.humanGateEnforcer = new PredictiveHumanGateEnforcer();
    this.recoveryTrigger = new PredictiveRecoveryTrigger();
  }

  coordinate({ forecast, policy }) {
    return [
      ...(policy.allowAutomaticThrottling ? this.throttlingEnforcer.enforce(forecast) : []),
      ...(policy.allowPreventiveRerouting ? this.routingEnforcer.enforce(forecast) : []),
      ...(policy.allowWorkflowBlocking ? this.workflowBlocker.enforce(forecast) : []),
      ...(policy.requireHumanGate ? this.humanGateEnforcer.enforce(forecast) : []),
      ...(policy.allowPreventiveRecovery ? this.recoveryTrigger.enforce(forecast) : [])
    ];
  }
}

module.exports = {
  RuntimeEnforcementCoordinator
};
