const { createDatabaseContext } = require('../../database/seed/seed-filesystem-db');
const { publicRuntimeFlags, resolveRuntimeFlags } = require('../config/api-runtime-flags');
const { readJsonHistory } = require('../server/file-store');

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function paginate(items, query = {}) {
  const offset = query.offset || 0;
  const limit = query.limit || 20;
  return items.slice(offset, offset + limit);
}

function includesCorrelation(item, correlationId) {
  if (!correlationId) {
    return true;
  }

  return asArray(item.correlationIds).includes(correlationId)
    || item.correlationId === correlationId
    || asArray(item.entries).some((entry) => entry.correlationId === correlationId);
}

function filterByWorkflowAndCorrelation(items, query = {}) {
  return items.filter((item) => {
    if (query.workflowId && item.workflowId !== query.workflowId) {
      return false;
    }

    return includesCorrelation(item, query.correlationId);
  });
}

class DashboardDataSource {
  constructor(options = {}) {
    this.flags = options.flags || resolveRuntimeFlags(process.env, options.env || {});
    this.telemetryLimit = options.telemetryLimit || 20;
  }

  readLatestTelemetry() {
    const memory = readJsonHistory('memory/telemetry', this.telemetryLimit);
    if (memory.available && memory.items.length > 0) {
      return {
        source: 'memory/telemetry',
        report: memory.items[0].data,
        sourcePath: memory.items[0].sourcePath,
        readErrors: memory.readErrors || [],
        fallback: null
      };
    }

    const runtime = readJsonHistory('runtime-data/telemetry', this.telemetryLimit);
    if (runtime.available && runtime.items.length > 0) {
      return {
        source: 'runtime-data/telemetry',
        report: runtime.items[0].data,
        sourcePath: runtime.items[0].sourcePath,
        readErrors: [
          ...(memory.readErrors || []),
          ...(runtime.readErrors || [])
        ],
        fallback: {
          safeMode: true,
          reason: 'memory-telemetry-unavailable-used-runtime-data'
        }
      };
    }

    return {
      source: 'unavailable',
      report: null,
      sourcePath: null,
      readErrors: [
        ...(memory.readErrors || []),
        ...(runtime.readErrors || [])
      ],
      fallback: {
        safeMode: true,
        reason: 'telemetry-report-unavailable',
        memoryFallback: memory.fallback || null,
        runtimeFallback: runtime.fallback || null
      }
    };
  }

  readDatabaseSummary() {
    if (!this.flags.useDatabaseRead) {
      return {
        available: false,
        records: [],
        readErrors: [],
        fallback: {
          safeMode: true,
          reason: 'database-read-disabled'
        }
      };
    }

    try {
      const database = createDatabaseContext();
      const listed = database.adapter.list('runtime_telemetry', { limit: 1 });
      return {
        available: listed.available && listed.records.length > 0,
        records: listed.records || [],
        readErrors: listed.readErrors || [],
        fallback: listed.fallback || null
      };
    } catch (error) {
      return {
        available: false,
        records: [],
        readErrors: [{ error: error.message }],
        fallback: {
          safeMode: true,
          reason: 'database-runtime-telemetry-read-failed'
        }
      };
    }
  }

  baseResponse(telemetry, database) {
    const databaseAvailable = database.available === true;
    const telemetryAvailable = Boolean(telemetry.report);
    const source = databaseAvailable ? 'database' : telemetryAvailable ? 'json-fallback' : 'unavailable';

    return {
      source,
      fallbackUsed: !databaseAvailable,
      readErrors: [
        ...(database.readErrors || []),
        ...(telemetry.readErrors || [])
      ],
      runtimeFlags: publicRuntimeFlags(this.flags),
      databaseReadEnabled: this.flags.useDatabaseRead,
      jsonFallbackEnabled: this.flags.allowJsonFallback,
      safeModeEnabled: this.flags.safeMode,
      generatedAt: telemetry.report?.generatedAt || new Date().toISOString(),
      telemetryReportId: telemetry.report?.telemetryReportId || null,
      sourcePath: telemetry.sourcePath,
      fallback: {
        safeMode: true,
        reason: databaseAvailable
          ? 'database-summary-available-with-telemetry-report'
          : telemetry.fallback?.reason || database.fallback?.reason || 'dashboard-json-fallback',
        databaseFallback: database.fallback || null,
        telemetryFallback: telemetry.fallback || null
      }
    };
  }

  unavailable(kind) {
    const telemetry = this.readLatestTelemetry();
    const database = this.readDatabaseSummary();
    return {
      ...this.baseResponse(telemetry, database),
      available: false,
      kind,
      fallback: {
        safeMode: true,
        reason: 'dashboard-data-unavailable',
        databaseFallback: database.fallback || null,
        telemetryFallback: telemetry.fallback || null
      }
    };
  }

  withReport(mapper) {
    const telemetry = this.readLatestTelemetry();
    const database = this.readDatabaseSummary();
    if (!telemetry.report) {
      return this.unavailable('dashboard');
    }

    return {
      ...this.baseResponse(telemetry, database),
      ...mapper(telemetry.report, database)
    };
  }

  readSummary() {
    return this.withReport((report, database) => ({
      summary: {
        status: report.status,
        telemetryReportId: report.telemetryReportId,
        workflowCount: report.correlation?.workflowCount || 0,
        timelineCount: report.correlation?.timelineCount || 0,
        correlatedWorkflowCount: report.correlation?.correlatedWorkflowCount || 0,
        problematicWorkflowCount: asArray(report.problemDetection?.problematicWorkflows).length,
        saturatedWorkerCount: asArray(report.problemDetection?.saturatedWorkers).length,
        unhealthyWorkerCount: report.problemDetection?.unhealthyWorkers?.count || 0,
        databaseTelemetryRecords: database.records.length
      },
      correlationId: null
    }));
  }

  readMetrics() {
    return this.withReport((report) => ({
      metrics: report.metrics || {},
      problemDetection: report.problemDetection || {},
      correlation: report.correlation || {},
      correlationId: null
    }));
  }

  readTimelines(query = {}) {
    return this.withReport((report) => {
      const filtered = filterByWorkflowAndCorrelation(asArray(report.timelines), query);
      return {
        total: filtered.length,
        returned: paginate(filtered, query).length,
        timelines: paginate(filtered, query),
        correlationId: query.correlationId || null
      };
    });
  }

  readTraces(query = {}) {
    return this.withReport((report) => {
      const filtered = filterByWorkflowAndCorrelation(asArray(report.traces), query);
      return {
        total: filtered.length,
        returned: paginate(filtered, query).length,
        traces: paginate(filtered, query),
        correlationId: query.correlationId || null
      };
    });
  }

  readProblematicWorkflows(query = {}) {
    return this.withReport((report) => {
      const filtered = filterByWorkflowAndCorrelation(asArray(report.problemDetection?.problematicWorkflows), query);
      return {
        total: filtered.length,
        returned: paginate(filtered, query).length,
        problematicWorkflows: paginate(filtered, query),
        correlationId: query.correlationId || null
      };
    });
  }

  readWorkerHealth() {
    return this.withReport((report) => ({
      workers: {
        utilization: asArray(report.metrics?.workerUtilization),
        unhealthy: report.problemDetection?.unhealthyWorkers || { count: 0, workerIds: [] },
        saturated: asArray(report.problemDetection?.saturatedWorkers)
      },
      correlationId: null
    }));
  }
}

function createDashboardDataSource(options = {}) {
  return new DashboardDataSource(options);
}

module.exports = {
  DashboardDataSource,
  createDashboardDataSource
};
