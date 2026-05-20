const { DatabaseRuntimeReader } = require('./database-runtime-reader');
const { JsonRuntimeReader } = require('./json-runtime-reader');
const { publicRuntimeFlags, resolveRuntimeFlags } = require('../config/api-runtime-flags');

function unavailableResult(kind, flags, reason, databaseResult = null) {
  const common = {
    source: 'unavailable',
    fallbackUsed: false,
    available: false,
    readErrors: databaseResult && databaseResult.readErrors ? databaseResult.readErrors : [],
    runtimeFlags: publicRuntimeFlags(flags),
    databaseReadEnabled: flags.useDatabaseRead,
    jsonFallbackEnabled: flags.allowJsonFallback,
    safeModeEnabled: flags.safeMode,
    fallback: {
      safeMode: true,
      reason,
      kind,
      databaseFallback: databaseResult ? databaseResult.fallback || null : null,
      jsonFallback: flags.allowJsonFallback ? null : {
        safeMode: true,
        reason: 'json-fallback-disabled-by-environment'
      }
    }
  };
  const shapes = {
    events: {
      sourceDir: null,
      totalFiles: 0,
      returned: 0,
      events: []
    },
    decisions: {
      sourceDir: null,
      totalFiles: 0,
      returned: 0,
      reports: []
    },
    validation: {
      sourcePath: null,
      fileName: null,
      updatedAt: null,
      validation: null
    },
    queue: {
      sourcePath: null,
      fileName: null,
      updatedAt: null,
      metrics: null,
      queue: [],
      queueItems: [],
      retryQueue: [],
      retryItems: [],
      protectedQueue: [],
      enforcementIntegration: null,
      throttling: null,
      workers: [],
      totalQueueItems: 0,
      totalRetryItems: 0,
      protectedQueueCount: 0
    },
    runtimeStatus: {
      phase: 'phase-2',
      apiReadiness: 'environment-safe-unavailable',
      runtimeReadiness: 'unknown',
      sources: {},
      safety: {
        readonly: flags.readonlyMode,
        declarativeQueryOnly: true
      }
    }
  };

  return {
    ...common,
    ...(shapes[kind] || {})
  };
}

function withEnvironmentFields(result, flags) {
  return {
    ...result,
    runtimeFlags: publicRuntimeFlags(flags),
    databaseReadEnabled: flags.useDatabaseRead,
    jsonFallbackEnabled: flags.allowJsonFallback,
    safeModeEnabled: flags.safeMode
  };
}

function withFallback(databaseResult, jsonFallbackFactory, flags, kind) {
  if (databaseResult && databaseResult.source === 'database' && databaseResult.available !== false) {
    return withEnvironmentFields({
      ...databaseResult,
      source: 'database',
      fallbackUsed: false,
      readErrors: databaseResult.readErrors || []
    }, flags);
  }

  if (!flags.allowJsonFallback) {
    return unavailableResult(kind, flags, 'json-fallback-disabled-and-database-unavailable', databaseResult);
  }

  const jsonResult = jsonFallbackFactory();

  return withEnvironmentFields({
    ...jsonResult,
    source: 'json-fallback',
    fallbackUsed: true,
    readErrors: [
      ...((databaseResult && databaseResult.readErrors) || []),
      ...(jsonResult.readErrors || [])
    ],
    fallback: {
      safeMode: true,
      reason: databaseResult && databaseResult.fallback
        ? databaseResult.fallback.reason
        : 'database-read-unavailable',
      databaseFallback: databaseResult ? databaseResult.fallback || null : null,
      jsonFallback: jsonResult.fallback || null
    }
  }, flags);
}

class RuntimeDataSource {
  constructor(options = {}) {
    this.flags = options.flags || resolveRuntimeFlags(process.env, options.env || {});
    this.databaseReader = options.databaseReader || new DatabaseRuntimeReader(options);
    this.jsonReader = options.jsonReader || new JsonRuntimeReader();
  }

  readWithPolicy(kind, databaseRead, jsonRead) {
    if (!this.flags.useDatabaseRead) {
      if (!this.flags.allowJsonFallback) {
        return unavailableResult(kind, this.flags, 'database-read-disabled-and-json-fallback-disabled');
      }

      return withEnvironmentFields({
        ...jsonRead(),
        source: 'json-fallback',
        fallbackUsed: true,
        fallback: {
          safeMode: true,
          reason: 'database-read-disabled-used-json-fallback'
        }
      }, this.flags);
    }

    return withFallback(databaseRead(), jsonRead, this.flags, kind);
  }

  readEvents(query = {}) {
    return this.readWithPolicy(
      'events',
      () => this.databaseReader.readEvents(query),
      () => this.jsonReader.readEvents(query)
    );
  }

  readDecisions(query = {}) {
    return this.readWithPolicy(
      'decisions',
      () => this.databaseReader.readDecisions(query),
      () => this.jsonReader.readDecisions(query)
    );
  }

  readValidation() {
    return this.readWithPolicy(
      'validation',
      () => this.databaseReader.readValidation(),
      () => this.jsonReader.readValidation()
    );
  }

  readQueue() {
    return this.readWithPolicy(
      'queue',
      () => this.databaseReader.readQueue(),
      () => this.jsonReader.readQueue()
    );
  }

  readRuntimeStatus() {
    if (!this.flags.useDatabaseRead) {
      if (!this.flags.allowJsonFallback) {
        return unavailableResult('runtimeStatus', this.flags, 'database-read-disabled-and-json-fallback-disabled');
      }

      return withEnvironmentFields({
        ...this.jsonReader.readRuntimeStatus(),
        source: 'json-fallback',
        fallbackUsed: true,
        fallback: {
          safeMode: true,
          reason: 'database-read-disabled-used-json-fallback'
        }
      }, this.flags);
    }

    const databaseStatus = this.databaseReader.readRuntimeStatus();

    if (databaseStatus.source === 'database') {
      const queue = this.readQueue();
      return withEnvironmentFields({
        ...databaseStatus,
        sources: {
          ...databaseStatus.sources,
          queue
        },
        fallbackUsed: databaseStatus.fallbackUsed || queue.fallbackUsed,
        readErrors: [
          ...(databaseStatus.readErrors || []),
          ...(queue.readErrors || [])
        ]
      }, this.flags);
    }

    return withFallback(databaseStatus, () => this.jsonReader.readRuntimeStatus(), this.flags, 'runtimeStatus');
  }
}

function createRuntimeDataSource(options = {}) {
  return new RuntimeDataSource(options);
}

module.exports = {
  RuntimeDataSource,
  createRuntimeDataSource
};
