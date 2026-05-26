class QueueSaturationProtection {
  protect({ backpressure, throttling, pressure }) {
    const collapseRisk = backpressure.severity === "high" && pressure.executionPressure >= 2;
    const blockedAssignments = collapseRisk || throttling.mode === "aggressive"
      ? Math.max(1, Math.ceil(pressure.totalQueueItems * 0.5))
      : 0;

    return {
      saturationProtectionId: `queue_saturation_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      safeMode: collapseRisk,
      collapseRisk,
      assignmentPolicy: {
        blockExcessiveAssignments: blockedAssignments > 0,
        blockedAssignments,
        reason: blockedAssignments > 0 ? "saturation-protection-active" : "capacity-within-readonly-threshold"
      },
      protectedQueuePreserved: true,
      runtimeProtection: {
        readonly: true,
        brokerMutation: false,
        destructiveActions: false
      },
      safetyMode: "readonly-safe-saturation-protection"
    };
  }
}

module.exports = {
  QueueSaturationProtection
};
