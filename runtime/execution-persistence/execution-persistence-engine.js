const fs = require("node:fs");
const path = require("node:path");
const { SQLiteAdapter } = require("../../database/adapters/sqlite-adapter");
const { FilesystemDbAdapter } = require("../../database/adapters/filesystem-db-adapter");

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return filePath;
}

function safeReadJson(filePath) {
  try {
    return {
      ok: true,
      data: JSON.parse(fs.readFileSync(filePath, "utf8"))
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message
    };
  }
}

class ExecutionPersistenceEngine {
  constructor({ rootDir = process.cwd(), useDatabase = true } = {}) {
    this.rootDir = rootDir;
    this.useDatabase = useDatabase;
    this.runtimeDir = path.join(rootDir, "runtime-data", "execution-persistence");
    this.memoryDir = path.join(rootDir, "memory", "execution-persistence");
    this.journalRuntimeDir = path.join(this.runtimeDir, "journal");
    this.journalMemoryDir = path.join(this.memoryDir, "journal");
    this.checkpointRuntimeDir = path.join(this.runtimeDir, "checkpoints");
    this.checkpointMemoryDir = path.join(this.memoryDir, "checkpoints");
    this.failureRuntimeDir = path.join(this.runtimeDir, "failures");
    this.failureMemoryDir = path.join(this.memoryDir, "failures");
    this.replayRuntimeDir = path.join(this.runtimeDir, "replay-metadata");
    this.replayMemoryDir = path.join(this.memoryDir, "replay-metadata");
    this.reportsRuntimeDir = this.runtimeDir;
    this.reportsMemoryDir = this.memoryDir;
    this.sqliteAdapter = null;
    this.filesystemAdapter = null;
    this.initialization = null;
  }

  initialize() {
    [
      this.runtimeDir,
      this.memoryDir,
      this.journalRuntimeDir,
      this.journalMemoryDir,
      this.checkpointRuntimeDir,
      this.checkpointMemoryDir,
      this.failureRuntimeDir,
      this.failureMemoryDir,
      this.replayRuntimeDir,
      this.replayMemoryDir
    ].forEach(ensureDir);

    const database = {
      attempted: this.useDatabase,
      available: false,
      adapter: null,
      fallback: null
    };

    if (this.useDatabase) {
      try {
        this.sqliteAdapter = new SQLiteAdapter({ rootDir: this.rootDir, readonlySafe: true });
        const sqlite = this.sqliteAdapter.initialize();
        if (sqlite.available) {
          database.available = true;
          database.adapter = "sqlite";
          database.databasePath = sqlite.databasePath;
        } else {
          this.filesystemAdapter = new FilesystemDbAdapter({ rootDir: this.rootDir });
          this.filesystemAdapter.initialize();
          database.available = true;
          database.adapter = "filesystem-db";
          database.fallback = sqlite.fallback;
        }
      } catch (error) {
        database.fallback = {
          safeMode: true,
          reason: "database-initialization-failed",
          error: error.message
        };
      }
    } else {
      database.fallback = {
        safeMode: true,
        reason: "database-disabled"
      };
    }

    this.initialization = {
      runtimeDir: this.runtimeDir,
      memoryDir: this.memoryDir,
      database,
      jsonFallback: true,
      safetyMode: "readonly-safe-execution-persistence"
    };
    return this.initialization;
  }

  persistRecord(collection, record, directories, filename) {
    if (!this.initialization) {
      this.initialize();
    }

    const runtimePath = writeJson(path.join(directories.runtimeDir, filename), record);
    const memoryPath = writeJson(path.join(directories.memoryDir, filename), record);
    const database = this.persistToDatabase(collection, record);

    return {
      runtimePath,
      memoryPath,
      database,
      fallbackUsed: !database.ok
    };
  }

  persistToDatabase(collection, record) {
    const normalized = {
      ...record,
      idempotencyKey:
        record.idempotencyKey ||
        record.journalId ||
        record.checkpointId ||
        record.failureId ||
        record.replayMetadataId ||
        record.executionId ||
        `${collection}_${Date.now()}`,
      dedupeKey:
        record.dedupeKey ||
        record.journalId ||
        record.checkpointId ||
        record.failureId ||
        record.replayMetadataId ||
        record.executionId ||
        `${collection}_${Date.now()}`
    };

    try {
      if (this.sqliteAdapter?.initialized) {
        return {
          ok: true,
          source: "sqlite",
          result: this.sqliteAdapter.upsert(collection, normalized)
        };
      }
      if (this.filesystemAdapter?.initialized) {
        return {
          ok: true,
          source: "filesystem-db",
          result: this.filesystemAdapter.upsert(collection, normalized)
        };
      }
      return {
        ok: false,
        source: "json-fallback",
        fallback: {
          safeMode: true,
          reason: "database-unavailable"
        }
      };
    } catch (error) {
      return {
        ok: false,
        source: "json-fallback",
        error: error.message,
        fallback: {
          safeMode: true,
          reason: "database-write-failed"
        }
      };
    }
  }

  readDirectory(directory) {
    if (!fs.existsSync(directory)) {
      return {
        records: [],
        readErrors: [],
        missing: true
      };
    }

    const records = [];
    const readErrors = [];
    for (const file of fs.readdirSync(directory).filter((item) => item.endsWith(".json"))) {
      const filePath = path.join(directory, file);
      const read = safeReadJson(filePath);
      if (read.ok) {
        records.push({
          ...read.data,
          sourcePath: filePath
        });
      } else {
        readErrors.push({ path: filePath, error: read.error });
      }
    }

    return { records, readErrors, missing: false };
  }

  readCollection(kind) {
    const map = {
      journal: [this.journalMemoryDir, this.journalRuntimeDir],
      checkpoints: [this.checkpointMemoryDir, this.checkpointRuntimeDir],
      failures: [this.failureMemoryDir, this.failureRuntimeDir],
      replay: [this.replayMemoryDir, this.replayRuntimeDir]
    };
    const directories = map[kind] || [];
    const byKey = new Map();
    const readErrors = [];
    const missingSources = [];

    for (const directory of directories) {
      const read = this.readDirectory(directory);
      if (read.missing) {
        missingSources.push(directory);
      }
      read.readErrors.forEach((error) => readErrors.push(error));
      for (const record of read.records) {
        const key =
          record.journalId ||
          record.checkpointId ||
          record.failureId ||
          record.replayMetadataId ||
          `${record.executionId}:${record.timestamp || record.createdAt || record.sourcePath}`;
        byKey.set(key, record);
      }
    }

    return {
      records: [...byKey.values()].sort((left, right) =>
        String(left.timestamp || left.createdAt || "").localeCompare(String(right.timestamp || right.createdAt || ""))
      ),
      readErrors,
      missingSources,
      fallback: {
        safeMode: true,
        reason: readErrors.length || missingSources.length ? "partial-execution-source-read" : "all-execution-sources-readable"
      }
    };
  }

  persistReport(prefix, report) {
    const filename = `${prefix}-${timestampForFile()}.json`;
    return {
      runtimePath: writeJson(path.join(this.reportsRuntimeDir, filename), report),
      memoryPath: writeJson(path.join(this.reportsMemoryDir, filename), report)
    };
  }
}

module.exports = {
  ExecutionPersistenceEngine,
  ensureDir,
  safeReadJson,
  timestampForFile,
  writeJson
};
