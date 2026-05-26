const { runWorkflowReplayDemo } = require("../../runtime/replay/demo/workflow-replay-demo");
const { RuntimeRecoveryEngine } = require("../runtime-recovery-engine");

function runRuntimeRecoveryDemo() {
  const seededReplay = runWorkflowReplayDemo();
  const engine = new RuntimeRecoveryEngine({ rootDir: process.cwd() });
  const report = engine.run({
    executionId: seededReplay.seededExecution.executionId
  });

  return {
    runtimeRecoveryDemoId: `runtime_recovery_demo_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    status: "runtime_recovery_self_healing_ready",
    readonly: true,
    destructiveActions: false,
    seededExecution: seededReplay.seededExecution,
    failuresDetected: report.health.signals.map((signal) => ({
      signalId: signal.signalId,
      type: signal.type,
      severity: signal.severity,
      reason: signal.reason,
      evidence: signal.evidence
    })),
    classification: report.classifications.map((classification) => ({
      classificationId: classification.classificationId,
      failureType: classification.failureType,
      severity: classification.severity,
      retryEligible: classification.retryEligible,
      reason: classification.reason
    })),
    recoveryPlan: {
      checkpointRecoveryPlan: report.checkpointRecovery.recoveryPlan,
      selfHealingPlanId: report.selfHealingPlan.selfHealingPlanId,
      humanGateRequired: report.selfHealingPlan.humanGateRequired,
      recoveryExecuted: report.recoveryExecuted
    },
    selfHealingRecommendations: report.selfHealingPlan.recommendations,
    checkpointsRestorable: {
      latest: report.checkpointRecovery.latest
        ? {
            checkpointId: report.checkpointRecovery.latest.checkpointId,
            executionId: report.checkpointRecovery.latest.executionId,
            valid: report.checkpointRecovery.validation.valid
          }
        : null,
      validCandidates: report.checkpointRecovery.validCandidates
    },
    recoveryMetadata: report.recoveryMetadata,
    executionContext: report.executionContext,
    audit: report.audit,
    risks: [
      "recovery is plan-only in V1",
      "real workflow mutation remains blocked",
      "classification quality depends on persisted reports and correlation ids"
    ],
    fallback: report.fallback
  };
}

if (require.main === module) {
  console.log(JSON.stringify(runRuntimeRecoveryDemo(), null, 2));
}

module.exports = {
  runRuntimeRecoveryDemo
};
