class DatabaseRollbackManager {
  constructor(adapter) {
    this.adapter = adapter;
  }

  createRollbackPlan(target, reason = "manual-rollback-plan") {
    return {
      rollbackId: `rollback_${Date.now()}`,
      createdAt: new Date().toISOString(),
      target,
      reason,
      steps: [
        "verify checkpoint metadata",
        "require human gate",
        "stop writers",
        "restore snapshot externally if approved",
        "run integrity check",
        "resume mirror mode"
      ],
      destructiveRollback: false,
      humanGateRequired: true,
      safetyMode: "readonly-safe-declarative-rollback"
    };
  }

  recordRollback(plan, status = "planned") {
    const init = this.adapter.ensureInitialized();
    if (!init.available) {
      return {
        ok: false,
        fallback: init.fallback
      };
    }
    this.adapter.db.prepare(`
      INSERT OR REPLACE INTO rollback_audit
      (rollback_id, created_at, status, target, rollback_plan, safety_mode)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      plan.rollbackId,
      plan.createdAt,
      status,
      JSON.stringify(plan.target),
      JSON.stringify(plan),
      plan.safetyMode
    );
    return {
      ok: true,
      rollbackId: plan.rollbackId,
      status,
      destructiveActions: false
    };
  }
}

module.exports = {
  DatabaseRollbackManager
};
