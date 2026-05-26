const path = require("node:path");
const fs = require("node:fs");
const { ReplayAudit, ensureDir, safeReadJson } = require("./replay-audit");
const { ReplayPlanBuilder } = require("./replay-plan-builder");
const { ReplayEventLoader } = require("./replay-event-loader");
const { ReplayCheckpointLoader } = require("./replay-checkpoint-loader");
const { ReplayValidator } = require("./replay-validator");

class WorkflowReplayEngine {
  constructor({ rootDir = process.cwd() } = {}) {
    this.rootDir = rootDir;
    this.audit = new ReplayAudit({ rootDir });
    this.planBuilder = new ReplayPlanBuilder();
    this.eventLoader = new ReplayEventLoader({ rootDir });
    this.checkpointLoader = new ReplayCheckpointLoader({ rootDir });
    this.validator = new ReplayValidator();
    this.journalMemoryDir = path.join(rootDir, "memory", "execution-persistence", "journal");
    this.journalRuntimeDir = path.join(rootDir, "runtime-data", "execution-persistence", "journal");
  }

  initialize() {
    const audit = this.audit.initialize();
    ensureDir(this.journalMemoryDir);
    ensureDir(this.journalRuntimeDir);
    return {
      ...audit,
      sources: {
        journal: [this.journalMemoryDir, this.journalRuntimeDir],
        checkpoints: [this.checkpointLoader.memoryDir, this.checkpointLoader.runtimeDir],
        events: [this.eventLoader.memoryDir, this.eventLoader.runtimeDir]
      },
      fallback: {
        safeMode: true,
        jsonFallback: true
      }
    };
  }

  replay(input = {}) {
    const initialization = this.initialize();
    const plan = this.preparePlan(input);
    const journal = this.loadJournal(plan.filters);
    const checkpoints = this.checkpointLoader.load(plan.filters);
    const events = this.eventLoader.load(plan.filters);
    const validation = this.validator.validate({ plan, journal, checkpoints, events });
    const timeline = this.reconstructTimeline({ journal, checkpoints, events });

    const report = {
      replayId: `workflow_replay_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      generatedAt: new Date().toISOString(),
      status: validation.valid ? "workflow_replay_ready" : "workflow_replay_blocked",
      readonly: true,
      destructiveActions: false,
      reexecutionAttempted: false,
      initialization,
      plan,
      validation,
      loaded: {
        journalEntries: journal.entries.length,
        checkpoints: checkpoints.checkpoints.length,
        events: events.events.length,
        readErrors: [...journal.readErrors, ...checkpoints.readErrors, ...events.readErrors],
        missingSources: [...journal.missingSources, ...checkpoints.missingSources, ...events.missingSources]
      },
      timeline,
      checkpoints: {
        latest: checkpoints.latest
          ? {
              checkpointId: checkpoints.latest.checkpointId,
              executionId: checkpoints.latest.executionId,
              workflowId: checkpoints.latest.workflowId,
              createdAt: checkpoints.latest.createdAt,
              status: checkpoints.latest.status
            }
          : null,
        loaded: checkpoints.checkpoints.map((checkpoint) => ({
          checkpointId: checkpoint.checkpointId,
          executionId: checkpoint.executionId,
          workflowId: checkpoint.workflowId,
          createdAt: checkpoint.createdAt,
          status: checkpoint.status
        }))
      },
      events: events.events.map((event) => ({
        eventId: event.eventId,
        type: event.type,
        topic: event.topic,
        workflowId: event.workflowId,
        executionId: event.executionId,
        correlationId: event.correlationId,
        timestamp: event.timestamp,
        sequence: event.ordering?.sequence || null
      })),
      integrations: {
        executionPersistence: "journal and checkpoints loaded from execution-persistence JSON fallback",
        eventBus: "events loaded from event-bus persistent JSON streams",
        telemetry: "replay audit persisted under memory/replay for observability",
        dashboard: "timeline and validation are readonly dashboard-ready",
        autonomousOrchestrator: "validation blocks real reexecution and can be used as human-gate evidence",
        databaseLayer: "database remains additive; replay uses JSON fallback as mandatory source"
      },
      fallback: {
        safeMode: true,
        jsonFallback: true,
        behavior: "replay reconstructs state from persisted JSON without executing workflow handlers"
      }
    };

    report.audit = this.audit.record(report);
    return report;
  }

  preparePlan(input = {}) {
    const plan = this.planBuilder.build(input);
    if (!plan.filters.workflowId && !plan.filters.executionId && !plan.filters.correlationId) {
      const latest = this.loadJournal({}).entries.at(-1);
      if (latest) {
        plan.filters.workflowId = latest.workflowId || null;
        plan.filters.executionId = latest.executionId || null;
        plan.filters.correlationId = latest.correlationId || null;
        plan.reason = "latest-execution-replay";
      }
    }
    return plan;
  }

  loadJournal(filters = {}) {
    const loaded = this.readJsonDirectories([this.journalMemoryDir, this.journalRuntimeDir], "journalId");
    const entries = loaded.records
      .filter((record) => {
        if (filters.workflowId && record.workflowId !== filters.workflowId) return false;
        if (filters.executionId && record.executionId !== filters.executionId) return false;
        if (filters.correlationId && record.correlationId !== filters.correlationId) return false;
        return true;
      })
      .sort((left, right) => String(left.timestamp || "").localeCompare(String(right.timestamp || "")));

    return {
      entries,
      total: entries.length,
      readErrors: loaded.readErrors,
      missingSources: loaded.missingSources,
      fallback: loaded.fallback
    };
  }

  readJsonDirectories(directories, idField) {
    const byId = new Map();
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
        const key = read.data?.[idField] || `${filePath}:${read.data?.timestamp || ""}`;
        byId.set(key, { ...read.data, sourcePath: filePath });
      }
    }
    return {
      records: [...byId.values()],
      readErrors,
      missingSources,
      fallback: {
        safeMode: true,
        reason: readErrors.length || missingSources.length ? "partial-journal-replay-read" : "journal-replay-sources-readable"
      }
    };
  }

  reconstructTimeline({ journal, checkpoints, events }) {
    const items = [];
    for (const entry of journal.entries) {
      items.push({
        timestamp: entry.timestamp,
        kind: "journal",
        label: entry.status,
        workflowId: entry.workflowId,
        executionId: entry.executionId,
        correlationId: entry.correlationId,
        evidenceId: entry.journalId,
        detail: entry.transition
      });
    }
    for (const checkpoint of checkpoints.checkpoints) {
      items.push({
        timestamp: checkpoint.createdAt,
        kind: "checkpoint",
        label: checkpoint.status || "checkpointed",
        workflowId: checkpoint.workflowId,
        executionId: checkpoint.executionId,
        correlationId: checkpoint.correlationId,
        evidenceId: checkpoint.checkpointId,
        detail: checkpoint.consistencyMarker
      });
    }
    for (const event of events.events) {
      items.push({
        timestamp: event.timestamp,
        kind: "event",
        label: event.type,
        workflowId: event.workflowId,
        executionId: event.executionId,
        correlationId: event.correlationId,
        evidenceId: event.eventId,
        detail: {
          topic: event.topic,
          sequence: event.ordering?.sequence || null,
          routingKey: event.routingKey || null
        }
      });
    }

    const ordered = items.sort((left, right) => {
      const time = String(left.timestamp || "").localeCompare(String(right.timestamp || ""));
      if (time !== 0) return time;
      return String(left.kind).localeCompare(String(right.kind));
    });

    return {
      total: ordered.length,
      stages: ordered.map((item, index) => ({
        index: index + 1,
        ...item
      }))
    };
  }
}

module.exports = {
  WorkflowReplayEngine
};
