class PredictiveRecoveryTrigger {
  enforce(forecast) {
    const triggers = [];

    for (const worker of forecast.saturatedWorkers || []) {
      if (worker.forecast === "critical" || worker.staleSignals > 0) {
        triggers.push({
          type: "predictive-recovery-trigger",
          status: "triggered",
          targetType: "worker",
          target: worker.workerId,
          action: "preflight-heartbeat-and-lease-scan",
          reason: `saturationScore=${worker.saturationScore}; staleSignals=${worker.staleSignals || 0}`
        });
      }
    }

    if (forecast.runtimeRisk?.status === "critical") {
      triggers.push({
        type: "predictive-recovery-trigger",
        status: "triggered",
        targetType: "runtime",
        target: "platform",
        action: "run-preventive-recovery-scan",
        reason: `runtimeRisk=${forecast.runtimeRisk.riskScore}`
      });
    }

    return triggers;
  }
}

module.exports = {
  PredictiveRecoveryTrigger
};
