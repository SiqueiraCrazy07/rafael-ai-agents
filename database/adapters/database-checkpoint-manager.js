const fs = require("node:fs");
const path = require("node:path");

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

class DatabaseCheckpointManager {
  constructor(adapter, options = {}) {
    this.adapter = adapter;
    this.rootDir = options.rootDir || process.cwd();
    this.checkpointDir = options.checkpointDir || path.join(this.rootDir, "runtime-data", "database", "checkpoints");
  }

  createCheckpoint(reason = "manual-checkpoint") {
    const init = this.adapter.ensureInitialized();
    if (!init.available) {
      return {
        ok: false,
        fallback: init.fallback
      };
    }
    ensureDir(this.checkpointDir);
    const checkpointId = `checkpoint_${Date.now()}`;
    const snapshotPath = path.join(this.checkpointDir, `${checkpointId}-${timestampForFile()}.sqlite`);
    let copied = false;
    try {
      if (fs.existsSync(this.adapter.databasePath)) {
        fs.copyFileSync(this.adapter.databasePath, snapshotPath);
        copied = true;
      }
    } catch (error) {
      return {
        ok: false,
        checkpointId,
        fallback: {
          safeMode: true,
          reason: `checkpoint-copy-failed: ${error.message}`
        }
      };
    }

    const marker = {
      reason,
      copied,
      recordCount: this.adapter.db.prepare("SELECT COUNT(*) AS total FROM records").get().total,
      migrationVersion: this.adapter.db.prepare("SELECT MAX(version) AS version FROM schema_migrations").get().version || 0
    };
    const restoreMetadata = {
      restoreMode: "declarative",
      destructiveRestore: false,
      requiresHumanGate: true
    };
    this.adapter.db.prepare(`
      INSERT INTO checkpoints
      (checkpoint_id, created_at, database_path, snapshot_path, consistency_marker, restore_metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      checkpointId,
      new Date().toISOString(),
      this.adapter.databasePath,
      copied ? snapshotPath : null,
      JSON.stringify(marker),
      JSON.stringify(restoreMetadata)
    );

    return {
      ok: true,
      checkpointId,
      snapshotPath: copied ? snapshotPath : null,
      consistencyMarker: marker,
      restoreMetadata
    };
  }

  listCheckpoints() {
    const init = this.adapter.ensureInitialized();
    if (!init.available) {
      return {
        available: false,
        checkpoints: [],
        fallback: init.fallback
      };
    }
    return {
      available: true,
      checkpoints: this.adapter.db
        .prepare("SELECT * FROM checkpoints ORDER BY created_at DESC")
        .all()
        .map((row) => ({
          checkpointId: row.checkpoint_id,
          createdAt: row.created_at,
          databasePath: row.database_path,
          snapshotPath: row.snapshot_path,
          consistencyMarker: JSON.parse(row.consistency_marker),
          restoreMetadata: JSON.parse(row.restore_metadata)
        }))
    };
  }
}

module.exports = {
  DatabaseCheckpointManager
};
