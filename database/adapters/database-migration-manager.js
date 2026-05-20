class DatabaseMigrationManager {
  constructor(adapter) {
    this.adapter = adapter;
  }

  currentVersion() {
    const init = this.adapter.ensureInitialized();
    if (!init.available) {
      return {
        available: false,
        version: 0,
        fallback: init.fallback
      };
    }
    const row = this.adapter.db.prepare("SELECT MAX(version) AS version FROM schema_migrations").get();
    return {
      available: true,
      version: row.version || 0
    };
  }

  applyMigrations(migrations = this.defaultMigrations()) {
    const applied = [];
    const skipped = [];
    const errors = [];
    const current = this.currentVersion();
    if (!current.available) {
      return {
        status: "migration-fallback",
        applied,
        skipped,
        errors,
        fallback: current.fallback
      };
    }

    for (const migration of migrations) {
      const existing = this.adapter.db
        .prepare("SELECT version FROM schema_migrations WHERE version = ?")
        .get(migration.version);
      if (existing) {
        skipped.push({
          version: migration.version,
          name: migration.name,
          reason: "already-applied"
        });
        continue;
      }

      try {
        if (migration.sql) {
          this.adapter.db.exec(migration.sql);
        }
        this.adapter.db.prepare(`
          INSERT INTO schema_migrations (version, name, applied_at, rollback_metadata)
          VALUES (?, ?, ?, ?)
        `).run(
          migration.version,
          migration.name,
          new Date().toISOString(),
          JSON.stringify(migration.rollbackMetadata || {
            mode: "declarative",
            destructiveRollback: false
          })
        );
        applied.push({
          version: migration.version,
          name: migration.name
        });
      } catch (error) {
        errors.push({
          version: migration.version,
          name: migration.name,
          error: error.message
        });
      }
    }

    return {
      status: errors.length === 0 ? "migrations-applied" : "migrations-with-errors",
      currentVersion: this.currentVersion().version,
      applied,
      skipped,
      errors,
      fallback: errors.length > 0 ? {
        safeMode: true,
        reason: "one-or-more-migrations-failed"
      } : null
    };
  }

  listMigrations() {
    const init = this.adapter.ensureInitialized();
    if (!init.available) {
      return {
        available: false,
        migrations: [],
        fallback: init.fallback
      };
    }
    return {
      available: true,
      migrations: this.adapter.db
        .prepare("SELECT version, name, applied_at, rollback_metadata FROM schema_migrations ORDER BY version ASC")
        .all()
        .map((row) => ({
          ...row,
          rollback_metadata: JSON.parse(row.rollback_metadata)
        }))
    };
  }

  defaultMigrations() {
    return [
      {
        version: 1,
        name: "sqlite-transactional-records-v1",
        sql: "",
        rollbackMetadata: {
          rollbackType: "declarative",
          destructiveRollback: false,
          reason: "base schema is initialized by adapter"
        }
      },
      {
        version: 2,
        name: "sqlite-integration-metadata-v1",
        sql: `
          CREATE TABLE IF NOT EXISTS integration_metadata (
            integration_id TEXT PRIMARY KEY,
            source TEXT NOT NULL,
            status TEXT NOT NULL,
            payload TEXT NOT NULL,
            created_at TEXT NOT NULL
          );
        `,
        rollbackMetadata: {
          rollbackType: "declarative",
          table: "integration_metadata",
          destructiveRollback: false
        }
      }
    ];
  }
}

module.exports = {
  DatabaseMigrationManager
};
