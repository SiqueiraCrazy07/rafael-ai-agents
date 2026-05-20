const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseAdapter } = require('./database-adapter');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function toIsoFileStamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function safeJsonParse(line, sourcePath, lineNumber) {
  try {
    return {
      ok: true,
      data: JSON.parse(line)
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        sourcePath,
        lineNumber,
        error: error.message
      }
    };
  }
}

function stableSerialize(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .filter((key) => !['_db', 'sourcePath', 'fileName'].includes(key))
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function hashRecord(record) {
  return crypto
    .createHash('sha256')
    .update(stableSerialize(record))
    .digest('hex');
}

function compactParts(parts) {
  return parts
    .filter((part) => part !== null && part !== undefined && part !== '')
    .map((part) => String(part));
}

function firstQueueItemIdentity(record) {
  const candidates = [
    ...(Array.isArray(record.queueItems) ? record.queueItems : []),
    ...(Array.isArray(record.retryItems) ? record.retryItems : []),
    ...(Array.isArray(record.protectedQueue) ? record.protectedQueue : [])
  ];
  const item = candidates[0] || {};

  return item.workflowId || item.workflow || item.queueItemId || item.id || null;
}

function logicalKeyFor(collection, record) {
  switch (collection) {
    case 'events':
      return record.eventId || null;
    case 'decisions':
      return record.decisionId || record.decisionReportId || record.reportId || null;
    case 'transitions': {
      if (record.transitionId) {
        return record.transitionId;
      }

      if (record.transitionReportId) {
        return record.transitionReportId;
      }

      const transition = (record.appliedTransitions && record.appliedTransitions[0])
        || (record.blockedTransitions && record.blockedTransitions[0])
        || {};
      const parts = compactParts([
        record.workflowId || transition.workflowId || transition.workflow,
        transition.toState || transition.to,
        record.timestamp
      ]);
      return parts.length >= 2 ? parts.join(':') : null;
    }
    case 'runtime_validation':
      return record.validationId || record.reportId || null;
    case 'api_governance_audit': {
      const parts = compactParts([record.requestId, record.timestamp]);
      return parts.length === 2 ? parts.join(':') : null;
    }
    case 'workflow_state': {
      const parts = compactParts([
        record.machineId,
        record.workflowId || record.workflow,
        record.updatedAt || record.timestamp
      ]);
      return parts.length >= 2 ? parts.join(':') : null;
    }
    case 'queue': {
      const parts = compactParts([
        record.simulationId || record.queueReportId || record.reportId,
        record.workflowId || firstQueueItemIdentity(record)
      ]);
      return parts.length > 0 ? parts.join(':') : null;
    }
    case 'worker_executions':
      return record.executionId || null;
    case 'worker_leases':
      return record.leaseId || null;
    case 'worker_rebalances':
      return record.rebalanceId || null;
    case 'runtime_telemetry':
      return record.telemetryReportId || null;
    default:
      return null;
  }
}

class FilesystemDbAdapter extends DatabaseAdapter {
  constructor(options = {}) {
    super(options);
    this.rootDir = options.rootDir || ROOT_DIR;
    this.runtimeDir = options.runtimeDir || path.join(this.rootDir, 'runtime-data', 'database');
    this.memoryDir = options.memoryDir || path.join(this.rootDir, 'memory', 'database');
    this.tablesDir = path.join(this.runtimeDir, 'tables');
    this.initialized = false;
    this.available = options.available !== false;
  }

  initialize() {
    if (!this.available) {
      return {
        available: false,
        fallback: {
          safeMode: true,
          reason: 'filesystem-db-adapter-disabled'
        }
      };
    }

    ensureDir(this.runtimeDir);
    ensureDir(this.memoryDir);
    ensureDir(this.tablesDir);
    this.initialized = true;

    return {
      available: true,
      runtimeDir: this.runtimeDir,
      memoryDir: this.memoryDir,
      tablesDir: this.tablesDir
    };
  }

  tablePath(collection) {
    return path.join(this.tablesDir, `${collection}.jsonl`);
  }

  insert(collection, record) {
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.available) {
      return {
        ok: false,
        fallback: {
          safeMode: true,
          reason: 'database-unavailable'
        }
      };
    }

    const tablePath = this.tablePath(collection);
    const dbRecord = {
      ...record,
      _db: {
        collection,
        mirroredAt: new Date().toISOString(),
        adapter: 'filesystem-db'
      }
    };

    fs.appendFileSync(tablePath, `${JSON.stringify(dbRecord)}\n`);

    return {
      ok: true,
      collection,
      sourcePath: tablePath,
      record: dbRecord
    };
  }

  upsert(collection, record, options = {}) {
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.available) {
      return {
        ok: false,
        operation: 'fallback',
        fallback: {
          safeMode: true,
          reason: 'database-unavailable'
        }
      };
    }

    const tablePath = this.tablePath(collection);
    const dedupeKey = options.dedupeKey || logicalKeyFor(collection, record);
    const recordHash = hashRecord(record);

    if (!dedupeKey) {
      const inserted = this.insert(collection, {
        ...record,
        idempotencyKey: null,
        dedupeKey: null,
        recordHash
      });

      return {
        ...inserted,
        operation: inserted.ok ? 'inserted' : 'fallback',
        idempotencyKey: null,
        dedupeKey: null,
        recordHash,
        idempotent: false,
        fallback: inserted.fallback || {
          safeMode: true,
          reason: 'no-reliable-logical-key-used-append-only'
        }
      };
    }

    ensureDir(this.tablesDir);

    const lines = fs.existsSync(tablePath)
      ? fs.readFileSync(tablePath, 'utf8').split(/\r?\n/).filter(Boolean)
      : [];
    const records = [];
    const readErrors = [];

    lines.forEach((line, index) => {
      const parsed = safeJsonParse(line, tablePath, index + 1);
      if (parsed.ok) {
        records.push(parsed.data);
      } else {
        readErrors.push(parsed.error);
      }
    });

    const existingIndex = records.findIndex((item) => item.dedupeKey === dedupeKey || item.idempotencyKey === dedupeKey);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const existing = records[existingIndex];

      if (existing.recordHash === recordHash) {
        return {
          ok: true,
          operation: 'skipped-duplicate',
          collection,
          sourcePath: tablePath,
          record: existing,
          idempotencyKey: dedupeKey,
          dedupeKey,
          recordHash,
          readErrors
        };
      }

      const updatedRecord = {
        ...record,
        idempotencyKey: dedupeKey,
        dedupeKey,
        recordHash,
        _db: {
          ...(existing._db || {}),
          collection,
          adapter: 'filesystem-db',
          mirroredAt: existing._db && existing._db.mirroredAt ? existing._db.mirroredAt : now,
          updatedAt: now,
          upserted: true
        }
      };

      records[existingIndex] = updatedRecord;
      fs.writeFileSync(tablePath, `${records.map((item) => JSON.stringify(item)).join('\n')}\n`);

      return {
        ok: true,
        operation: 'updated',
        collection,
        sourcePath: tablePath,
        record: updatedRecord,
        idempotencyKey: dedupeKey,
        dedupeKey,
        recordHash,
        readErrors
      };
    }

    const insertedRecord = {
      ...record,
      idempotencyKey: dedupeKey,
      dedupeKey,
      recordHash,
      _db: {
        collection,
        mirroredAt: now,
        adapter: 'filesystem-db',
        upserted: true
      }
    };

    fs.appendFileSync(tablePath, `${JSON.stringify(insertedRecord)}\n`);

    return {
      ok: true,
      operation: 'inserted',
      collection,
      sourcePath: tablePath,
      record: insertedRecord,
      idempotencyKey: dedupeKey,
      dedupeKey,
      recordHash,
      readErrors
    };
  }

  list(collection, query = {}) {
    if (!this.initialized) {
      this.initialize();
    }

    const tablePath = this.tablePath(collection);
    const limit = query.limit || 50;
    const offset = query.offset || 0;
    const readErrors = [];

    if (!this.available || !fs.existsSync(tablePath)) {
      return {
        available: false,
        collection,
        sourcePath: tablePath,
        records: [],
        total: 0,
        readErrors,
        fallback: {
          safeMode: true,
          reason: this.available ? 'collection-not-found' : 'database-unavailable'
        }
      };
    }

    const lines = fs.readFileSync(tablePath, 'utf8')
      .split(/\r?\n/)
      .filter(Boolean);
    const records = [];

    lines.forEach((line, index) => {
      const parsed = safeJsonParse(line, tablePath, index + 1);
      if (parsed.ok) {
        records.push(parsed.data);
      } else {
        readErrors.push(parsed.error);
      }
    });

    const filtered = records.filter((record) => {
      if (query.workflowId && record.workflowId !== query.workflowId) {
        return false;
      }

      if (query.correlationId && record.correlationId !== query.correlationId) {
        return false;
      }

      if (query.type && record.type !== query.type) {
        return false;
      }

      return true;
    });

    return {
      available: true,
      collection,
      sourcePath: tablePath,
      total: filtered.length,
      records: filtered.slice(offset, offset + limit),
      readErrors,
      fallback: null
    };
  }

  findById(collection, id, idField = 'id') {
    const listed = this.list(collection, { limit: 10000 });
    const record = listed.records.find((item) => item[idField] === id);

    return {
      available: Boolean(record),
      collection,
      id,
      idField,
      record: record || null,
      readErrors: listed.readErrors,
      fallback: record ? null : {
        safeMode: true,
        reason: listed.available ? 'record-not-found' : 'database-unavailable'
      }
    };
  }

  persistReport(reportName, payload) {
    if (!this.initialized) {
      this.initialize();
    }

    ensureDir(this.runtimeDir);
    ensureDir(this.memoryDir);

    const fileName = `${reportName}-${toIsoFileStamp()}.json`;
    const runtimePath = path.join(this.runtimeDir, fileName);
    const memoryPath = path.join(this.memoryDir, fileName);
    const body = JSON.stringify(payload, null, 2);

    fs.writeFileSync(runtimePath, body);
    fs.writeFileSync(memoryPath, body);

    return {
      runtimePath,
      memoryPath
    };
  }

  health() {
    return {
      adapter: 'filesystem-db',
      available: this.available,
      initialized: this.initialized,
      runtimeDir: this.runtimeDir,
      memoryDir: this.memoryDir,
      tablesDir: this.tablesDir,
      idempotency: {
        upsert: true,
        logicalDedupeKeys: true,
        recordHash: 'sha256'
      },
      preparedFor: ['sqlite', 'postgresql']
    };
  }
}

module.exports = {
  FilesystemDbAdapter,
  hashRecord,
  logicalKeyFor,
  stableSerialize
};
