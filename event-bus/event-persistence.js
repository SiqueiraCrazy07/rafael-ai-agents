const fs = require("node:fs");
const path = require("node:path");
const { SQLiteAdapter } = require("../database/adapters/sqlite-adapter");
const { FilesystemDbAdapter } = require("../database/adapters/filesystem-db-adapter");

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
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

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return filePath;
}

class EventPersistence {
  constructor({ rootDir = process.cwd(), useDatabase = true } = {}) {
    this.rootDir = rootDir;
    this.useDatabase = useDatabase;
    this.runtimeDir = path.join(rootDir, "runtime-data", "event-bus");
    this.memoryDir = path.join(rootDir, "memory", "event-bus");
    this.eventsRuntimeDir = path.join(this.runtimeDir, "events");
    this.eventsMemoryDir = path.join(this.memoryDir, "events");
    this.reportsRuntimeDir = this.runtimeDir;
    this.reportsMemoryDir = this.memoryDir;
    this.sqliteAdapter = null;
    this.filesystemAdapter = null;
  }

  initialize() {
    ensureDir(this.eventsRuntimeDir);
    ensureDir(this.eventsMemoryDir);
    ensureDir(this.reportsRuntimeDir);
    ensureDir(this.reportsMemoryDir);

    const initialization = {
      runtimeDir: this.runtimeDir,
      memoryDir: this.memoryDir,
      database: {
        attempted: this.useDatabase,
        available: false,
        adapter: null,
        fallback: null
      }
    };

    if (!this.useDatabase) {
      initialization.database.fallback = {
        safeMode: true,
        reason: "database-persistence-disabled"
      };
      return initialization;
    }

    this.sqliteAdapter = new SQLiteAdapter({ rootDir: this.rootDir, readonlySafe: true });
    const sqliteInit = this.sqliteAdapter.initialize();
    if (sqliteInit.available) {
      initialization.database = {
        attempted: true,
        available: true,
        adapter: "sqlite",
        databasePath: sqliteInit.databasePath,
        fallback: null
      };
      return initialization;
    }

    this.filesystemAdapter = new FilesystemDbAdapter({ rootDir: this.rootDir });
    this.filesystemAdapter.initialize();
    initialization.database = {
      attempted: true,
      available: true,
      adapter: "filesystem-db",
      fallback: sqliteInit.fallback
    };
    return initialization;
  }

  persistEvent(event) {
    const filename = `${String(event.ordering.sequence).padStart(8, "0")}-${timestampForFile(
      new Date(event.timestamp)
    )}-${event.topic}-${event.eventId}.json`;
    const runtimePath = writeJson(path.join(this.eventsRuntimeDir, filename), event);
    const memoryPath = writeJson(path.join(this.eventsMemoryDir, filename), event);

    const databaseResult = this.persistEventToDatabase(event);
    return {
      runtimePath,
      memoryPath,
      database: databaseResult,
      fallbackUsed: !databaseResult.ok
    };
  }

  persistEventToDatabase(event) {
    const record = {
      ...event,
      distributedEventId: event.eventId,
      idempotencyKey: event.eventId,
      dedupeKey: event.eventId
    };

    try {
      if (this.sqliteAdapter?.initialized) {
        return {
          ok: true,
          source: "sqlite",
          result: this.sqliteAdapter.upsert("distributed_events", record)
        };
      }
      if (this.filesystemAdapter?.initialized) {
        return {
          ok: true,
          source: "filesystem-db",
          result: this.filesystemAdapter.upsert("distributed_events", record)
        };
      }
      return {
        ok: false,
        source: "json-fallback",
        fallback: {
          safeMode: true,
          reason: "database-adapter-unavailable"
        }
      };
    } catch (error) {
      return {
        ok: false,
        source: "json-fallback",
        error: error.message,
        fallback: {
          safeMode: true,
          reason: "database-persist-failed"
        }
      };
    }
  }

  loadEvents({ includeRuntime = true, includeMemory = true } = {}) {
    const directories = [];
    if (includeMemory) {
      directories.push(this.eventsMemoryDir);
    }
    if (includeRuntime) {
      directories.push(this.eventsRuntimeDir);
    }

    const eventsById = new Map();
    const readErrors = [];
    const missingSources = [];

    for (const directory of directories) {
      if (!fs.existsSync(directory)) {
        missingSources.push(directory);
        continue;
      }
      for (const file of fs.readdirSync(directory).filter((item) => item.endsWith(".json"))) {
        const filePath = path.join(directory, file);
        const read = safeReadJson(filePath);
        if (!read.ok) {
          readErrors.push({ path: filePath, error: read.error });
          continue;
        }
        if (read.data?.eventId) {
          eventsById.set(read.data.eventId, {
            ...read.data,
            sourcePath: filePath
          });
        }
      }
    }

    const events = [...eventsById.values()].sort((left, right) => {
      const leftSequence = left.ordering?.sequence || 0;
      const rightSequence = right.ordering?.sequence || 0;
      if (leftSequence !== rightSequence) {
        return leftSequence - rightSequence;
      }
      return String(left.timestamp).localeCompare(String(right.timestamp));
    });

    return {
      events,
      readErrors,
      missingSources,
      fallback: {
        safeMode: true,
        reason: readErrors.length || missingSources.length ? "partial-event-source-read" : "all-event-sources-readable"
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
  EventPersistence,
  ensureDir,
  safeReadJson,
  timestampForFile,
  writeJson
};
