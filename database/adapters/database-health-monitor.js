class DatabaseHealthMonitor {
  constructor(adapter) {
    this.adapter = adapter;
  }

  check() {
    const started = Date.now();
    const baseHealth = this.adapter.health();
    if (!baseHealth.available) {
      return {
        ...baseHealth,
        status: "unavailable",
        latencyMs: Date.now() - started
      };
    }

    let lockedDatabaseDetected = false;
    let writeProbe = "not-run";
    try {
      this.adapter.db.exec("BEGIN IMMEDIATE TRANSACTION");
      this.adapter.db.exec("ROLLBACK");
      writeProbe = "lock-probe-ok";
    } catch (error) {
      lockedDatabaseDetected = true;
      writeProbe = error.message;
      try {
        this.adapter.db.exec("ROLLBACK");
      } catch (_) {
        // noop: rollback is best-effort after failed lock probe.
      }
    }

    const collectionCounts = this.adapter.db
      .prepare("SELECT collection, COUNT(*) AS total FROM records GROUP BY collection ORDER BY collection ASC")
      .all();

    return {
      ...baseHealth,
      status: baseHealth.corruptionDetected || lockedDatabaseDetected ? "attention-required" : "healthy",
      lockedDatabaseDetected,
      writeProbe,
      collectionCounts,
      latencyMs: Date.now() - started,
      fallback: baseHealth.corruptionDetected || lockedDatabaseDetected ? {
        safeMode: true,
        reason: "sqlite-health-attention-required"
      } : null
    };
  }
}

module.exports = {
  DatabaseHealthMonitor
};
