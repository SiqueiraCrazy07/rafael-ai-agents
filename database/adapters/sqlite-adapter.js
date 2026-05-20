const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { DatabaseAdapter } = require("./database-adapter");
const { logicalKeyFor, stableSerialize } = require("./filesystem-db-adapter");

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function hashRecord(record) {
  return crypto.createHash("sha256").update(stableSerialize(record)).digest("hex");
}

function loadNativeSqlite() {
  try {
    return require("node:sqlite");
  } catch (error) {
    return null;
  }
}

class SQLiteAdapter extends DatabaseAdapter {
  constructor(options = {}) {
    super(options);
    this.rootDir = options.rootDir || process.cwd();
    this.runtimeDir = options.runtimeDir || path.join(this.rootDir, "runtime-data", "database");
    this.memoryDir = options.memoryDir || path.join(this.rootDir, "memory", "database");
    this.sqliteDir = options.sqliteDir || path.join(this.runtimeDir, "sqlite");
    this.databasePath = options.databasePath || path.join(this.sqliteDir, "rafael-ai-agents.sqlite");
    this.readonlySafe = options.readonlySafe !== false;
    this.busyTimeoutMs = options.busyTimeoutMs || 1000;
    this.db = null;
    this.nativeSqlite = null;
    this.initialized = false;
    this.available = options.available !== false;
    this.transactionOpen = false;
  }

  initialize() {
    ensureDir(this.runtimeDir);
    ensureDir(this.memoryDir);
    ensureDir(this.sqliteDir);

    this.nativeSqlite = loadNativeSqlite();
    if (!this.nativeSqlite || !this.nativeSqlite.DatabaseSync || !this.available) {
      this.initialized = false;
      return {
        available: false,
        adapter: "sqlite",
        databasePath: this.databasePath,
        fallback: {
          safeMode: true,
          reason: this.available ? "node-sqlite-unavailable" : "sqlite-adapter-disabled"
        }
      };
    }

    this.db = new this.nativeSqlite.DatabaseSync(this.databasePath);
    this.db.exec(`PRAGMA busy_timeout=${this.busyTimeoutMs}`);
    this.db.exec("PRAGMA journal_mode=WAL");
    this.db.exec("PRAGMA foreign_keys=ON");
    this.initializeSchema();
    this.initialized = true;

    return {
      available: true,
      adapter: "sqlite",
      databasePath: this.databasePath,
      readonlySafe: this.readonlySafe,
      nativeSqlite: true
    };
  }

  initializeSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS records (
        collection TEXT NOT NULL,
        record_id TEXT,
        dedupe_key TEXT,
        record_hash TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        adapter TEXT NOT NULL,
        PRIMARY KEY (collection, dedupe_key)
      );

      CREATE INDEX IF NOT EXISTS idx_records_collection_created_at
        ON records(collection, created_at);

      CREATE INDEX IF NOT EXISTS idx_records_record_id
        ON records(collection, record_id);

      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL,
        rollback_metadata TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS transaction_audit (
        transaction_id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        reason TEXT,
        safety_mode TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS checkpoints (
        checkpoint_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        database_path TEXT NOT NULL,
        snapshot_path TEXT,
        consistency_marker TEXT NOT NULL,
        restore_metadata TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS rollback_audit (
        rollback_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        status TEXT NOT NULL,
        target TEXT NOT NULL,
        rollback_plan TEXT NOT NULL,
        safety_mode TEXT NOT NULL
      );
    `);
  }

  ensureInitialized() {
    if (!this.initialized) {
      const init = this.initialize();
      if (!init.available) {
        return init;
      }
    }
    return { available: true };
  }

  prepare(sql) {
    const init = this.ensureInitialized();
    if (!init.available) {
      return {
        available: false,
        fallback: init.fallback
      };
    }
    return {
      available: true,
      statement: this.db.prepare(sql),
      sql
    };
  }

  beginTransaction(transactionId = `tx_${Date.now()}`) {
    const init = this.ensureInitialized();
    if (!init.available) {
      return {
        ok: false,
        transactionId,
        fallback: init.fallback
      };
    }
    if (this.transactionOpen) {
      return {
        ok: false,
        transactionId,
        fallback: {
          safeMode: true,
          reason: "transaction-already-open"
        }
      };
    }
    const startedAt = new Date().toISOString();
    this.db.exec("BEGIN IMMEDIATE TRANSACTION");
    this.transactionOpen = true;
    this.db.prepare(`
      INSERT OR REPLACE INTO transaction_audit
      (transaction_id, status, started_at, completed_at, reason, safety_mode)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(transactionId, "started", startedAt, null, "transaction-begin", "readonly-safe-transaction");
    return {
      ok: true,
      transactionId,
      startedAt
    };
  }

  commit(transactionId, reason = "transaction-commit") {
    if (!this.transactionOpen) {
      return {
        ok: false,
        transactionId,
        fallback: {
          safeMode: true,
          reason: "no-open-transaction"
        }
      };
    }
    this.db.exec("COMMIT");
    this.transactionOpen = false;
    const completedAt = new Date().toISOString();
    this.db.prepare(`
      UPDATE transaction_audit
      SET status = ?, completed_at = ?, reason = ?
      WHERE transaction_id = ?
    `).run("committed", completedAt, reason, transactionId);
    return {
      ok: true,
      transactionId,
      completedAt
    };
  }

  rollback(transactionId, reason = "transaction-rollback") {
    if (!this.transactionOpen) {
      return {
        ok: false,
        transactionId,
        fallback: {
          safeMode: true,
          reason: "no-open-transaction"
        }
      };
    }
    this.db.exec("ROLLBACK");
    this.transactionOpen = false;
    const completedAt = new Date().toISOString();
    this.db.prepare(`
      INSERT OR REPLACE INTO transaction_audit
      (transaction_id, status, started_at, completed_at, reason, safety_mode)
      VALUES (?, ?, COALESCE((SELECT started_at FROM transaction_audit WHERE transaction_id = ?), ?), ?, ?, ?)
    `).run(
      transactionId,
      "rolled-back",
      transactionId,
      completedAt,
      completedAt,
      reason,
      "readonly-safe-transaction"
    );
    return {
      ok: true,
      transactionId,
      completedAt
    };
  }

  insert(collection, record) {
    return this.upsert(collection, record, {
      dedupeKey: `${collection}:append:${Date.now()}:${Math.random().toString(16).slice(2, 8)}`,
      appendOnly: true
    });
  }

  upsert(collection, record, options = {}) {
    const init = this.ensureInitialized();
    if (!init.available) {
      return {
        ok: false,
        operation: "fallback",
        fallback: init.fallback
      };
    }

    const now = new Date().toISOString();
    const dedupeKey = options.dedupeKey || logicalKeyFor(collection, record) || `${collection}:append:${now}`;
    const recordHash = hashRecord(record);
    const recordId = record.eventId
      || record.decisionId
      || record.decisionReportId
      || record.transitionId
      || record.transitionReportId
      || record.validationId
      || record.auditId
      || record.machineId
      || record.queueReportId
      || record.executionId
      || dedupeKey;
    const existing = this.db.prepare(`
      SELECT collection, record_id, dedupe_key, record_hash, payload, created_at, updated_at
      FROM records
      WHERE collection = ? AND dedupe_key = ?
    `).get(collection, dedupeKey);

    if (existing && existing.record_hash === recordHash) {
      return {
        ok: true,
        operation: "skipped-duplicate",
        collection,
        record: JSON.parse(existing.payload),
        idempotencyKey: dedupeKey,
        dedupeKey,
        recordHash,
        sourcePath: this.databasePath
      };
    }

    const dbRecord = {
      ...record,
      idempotencyKey: dedupeKey,
      dedupeKey,
      recordHash,
      _db: {
        collection,
        adapter: "sqlite",
        mirroredAt: existing ? existing.created_at : now,
        updatedAt: now,
        readonlySafe: this.readonlySafe
      }
    };

    this.db.prepare(`
      INSERT INTO records
      (collection, record_id, dedupe_key, record_hash, payload, created_at, updated_at, adapter)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(collection, dedupe_key) DO UPDATE SET
        record_id = excluded.record_id,
        record_hash = excluded.record_hash,
        payload = excluded.payload,
        updated_at = excluded.updated_at,
        adapter = excluded.adapter
    `).run(collection, recordId, dedupeKey, recordHash, JSON.stringify(dbRecord), existing ? existing.created_at : now, now, "sqlite");

    return {
      ok: true,
      operation: existing ? "updated" : "inserted",
      collection,
      record: dbRecord,
      idempotencyKey: dedupeKey,
      dedupeKey,
      recordHash,
      sourcePath: this.databasePath
    };
  }

  list(collection, query = {}) {
    const init = this.ensureInitialized();
    if (!init.available) {
      return {
        available: false,
        collection,
        records: [],
        total: 0,
        readErrors: [],
        fallback: init.fallback
      };
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;
    const rows = this.db.prepare(`
      SELECT payload
      FROM records
      WHERE collection = ?
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
    `).all(collection, limit, offset);
    const records = rows.map((row) => JSON.parse(row.payload));

    return {
      available: true,
      collection,
      sourcePath: this.databasePath,
      total: this.db.prepare("SELECT COUNT(*) AS total FROM records WHERE collection = ?").get(collection).total,
      records,
      readErrors: [],
      fallback: null
    };
  }

  findById(collection, id, idField = "id") {
    const listed = this.list(collection, { limit: 10000 });
    const record = listed.records.find((item) => item[idField] === id || item.recordId === id);
    return {
      available: Boolean(record),
      collection,
      id,
      idField,
      record: record || null,
      readErrors: listed.readErrors || [],
      fallback: record ? null : {
        safeMode: true,
        reason: listed.available ? "record-not-found" : "sqlite-database-unavailable"
      }
    };
  }

  persistReport(reportName, payload) {
    ensureDir(this.runtimeDir);
    ensureDir(this.memoryDir);
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const filename = `${reportName}-${stamp}.json`;
    const runtimePath = path.join(this.runtimeDir, filename);
    const memoryPath = path.join(this.memoryDir, filename);
    fs.writeFileSync(runtimePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    fs.writeFileSync(memoryPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    return {
      runtimePath,
      memoryPath
    };
  }

  health() {
    const init = this.ensureInitialized();
    if (!init.available) {
      return {
        adapter: "sqlite",
        available: false,
        initialized: false,
        databasePath: this.databasePath,
        fallback: init.fallback
      };
    }
    const startedAt = Date.now();
    let integrity = "unknown";
    let quickCheck = "unknown";
    let corruptionDetected = false;
    try {
      integrity = this.db.prepare("PRAGMA integrity_check").get().integrity_check;
      quickCheck = this.db.prepare("PRAGMA quick_check").get().quick_check;
      corruptionDetected = integrity !== "ok" || quickCheck !== "ok";
    } catch (error) {
      integrity = error.message;
      quickCheck = error.message;
      corruptionDetected = true;
    }
    return {
      adapter: "sqlite",
      available: true,
      initialized: this.initialized,
      databasePath: this.databasePath,
      readonlySafe: this.readonlySafe,
      nativeSqlite: true,
      integrityCheck: integrity,
      quickCheck,
      corruptionDetected,
      lockedDatabaseDetected: false,
      latencyMs: Date.now() - startedAt,
      preparedStatements: true,
      transactions: true,
      mirrorModeCompatible: true,
      jsonFallbackPreserved: true
    };
  }
}

module.exports = {
  SQLiteAdapter,
  hashRecord
};
