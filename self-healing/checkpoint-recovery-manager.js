const path = require("node:path");
const { readJsonDir } = require("./recovery-audit");

class CheckpointRecoveryManager {
  constructor({ rootDir = process.cwd() } = {}) {
    this.rootDir = rootDir;
    this.memoryDir = path.join(rootDir, "memory", "execution-persistence", "checkpoints");
    this.runtimeDir = path.join(rootDir, "runtime-data", "execution-persistence", "checkpoints");
  }

  locateLatestValidCheckpoint(filters = {}) {
    const records = [
      ...readJsonDir(this.memoryDir, "checkpointId").records,
      ...readJsonDir(this.runtimeDir, "checkpointId").records
    ];
    const byId = new Map(records.map((record) => [record.checkpointId, record]));
    const matches = [...byId.values()]
      .filter((checkpoint) => this.matches(checkpoint, filters))
      .sort((left, right) => String(left.createdAt || "").localeCompare(String(right.createdAt || "")));
    const valid = matches.filter((checkpoint) => this.validateCheckpoint(checkpoint).valid);
    const latest = valid.at(-1) || null;
    return {
      latest,
      totalCandidates: matches.length,
      validCandidates: valid.length,
      validation: latest ? this.validateCheckpoint(latest) : { valid: false, errors: ["no-valid-checkpoint-found"] },
      recoveryPlan: latest ? this.prepareRecoveryPlan(latest) : null,
      fallback: {
        safeMode: true,
        reason: latest ? "checkpoint-recovery-plan-ready" : "checkpoint-recovery-unavailable"
      }
    };
  }

  matches(checkpoint, { workflowId = null, executionId = null, correlationId = null } = {}) {
    if (workflowId && checkpoint.workflowId !== workflowId) return false;
    if (executionId && checkpoint.executionId !== executionId) return false;
    if (correlationId && checkpoint.correlationId !== correlationId) return false;
    return true;
  }

  validateCheckpoint(checkpoint) {
    const errors = [];
    if (!checkpoint?.checkpointId) errors.push("checkpointId-missing");
    if (!checkpoint?.executionId) errors.push("executionId-missing");
    if (!checkpoint?.consistencyMarker) errors.push("consistency-marker-missing");
    if (checkpoint?.consistencyMarker && checkpoint.consistencyMarker.readonly !== true) {
      errors.push("checkpoint-not-readonly-safe");
    }
    return {
      valid: errors.length === 0,
      errors,
      safetyMode: "readonly-safe-checkpoint-validation"
    };
  }

  prepareRecoveryPlan(checkpoint) {
    return {
      recoveryPlanId: `checkpoint_recovery_plan_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      checkpointId: checkpoint.checkpointId,
      workflowId: checkpoint.workflowId,
      executionId: checkpoint.executionId,
      correlationId: checkpoint.correlationId,
      readonly: true,
      destructiveActions: false,
      executeRecovery: false,
      steps: [
        "verify checkpoint consistency marker",
        "reconstruct execution context",
        "prepare supervised recovery metadata",
        "require human gate before any real recovery",
        "do not mutate workflow state in V1"
      ],
      safetyMode: "readonly-safe-checkpoint-recovery"
    };
  }
}

module.exports = {
  CheckpointRecoveryManager
};
