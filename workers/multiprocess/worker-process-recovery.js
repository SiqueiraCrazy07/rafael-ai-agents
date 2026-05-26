class WorkerProcessRecovery {
  plan(supervisorChecks = []) {
    const recommendations = supervisorChecks
      .filter((check) => check.recoveryRecommendation)
      .map((check) => ({
        recoveryPlanId: `mp_recovery_${check.processId}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
        processId: check.processId,
        workerId: check.workerId,
        action: check.recoveryRecommendation.action,
        reason: check.recoveryRecommendation.reason,
        restartRecommendation: check.crashDetected ? "restart-subprocess-after-policy-review" : null,
        rerouteRecommendation: "route-workflow-to-healthy-worker",
        replayRecommendation: "run-readonly-replay-before-real-retry",
        quarantine: check.freezeDetected || check.crashDetected,
        executeRecovery: false,
        requiresHumanGate: check.recoveryRecommendation.requiresHumanGate,
        safetyMode: "readonly-safe-multiprocess-recovery"
      }));

    return {
      recoveryPlanSetId: `mp_recovery_plan_set_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      totalRecommendations: recommendations.length,
      recommendations,
      quarantineMetadata: recommendations
        .filter((item) => item.quarantine)
        .map((item) => ({
          processId: item.processId,
          workerId: item.workerId,
          quarantineReason: item.reason,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          executeQuarantine: false,
          safetyMode: "readonly-safe-worker-quarantine"
        })),
      safetyMode: "readonly-safe-multiprocess-recovery-plan"
    };
  }
}

module.exports = {
  WorkerProcessRecovery
};
