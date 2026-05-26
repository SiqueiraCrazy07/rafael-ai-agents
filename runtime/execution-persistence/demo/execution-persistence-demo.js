const { DistributedRuntimeEventBus } = require("../../../event-bus/runtime-event-bus");
const { ExecutionPersistenceEngine } = require("../execution-persistence-engine");
const { ExecutionJournal } = require("../execution-journal");
const { ExecutionCheckpointStore } = require("../execution-checkpoint-store");
const { ExecutionFailureStore } = require("../execution-failure-store");
const { ExecutionReplayMetadata } = require("../execution-replay-metadata");
const { ExecutionStateReader } = require("../execution-state-reader");

function runExecutionPersistenceDemo() {
  const engine = new ExecutionPersistenceEngine({ rootDir: process.cwd(), useDatabase: true });
  const initialization = engine.initialize();
  const journal = new ExecutionJournal({ engine });
  const checkpoints = new ExecutionCheckpointStore({ engine });
  const failures = new ExecutionFailureStore({ engine });
  const replayMetadata = new ExecutionReplayMetadata({ engine });
  const stateReader = new ExecutionStateReader({ engine });

  const eventBus = new DistributedRuntimeEventBus({
    maxInMemoryEvents: 25,
    maxEventsPerWindow: 50
  });
  const eventBusInitialization = eventBus.initialize();

  const workflowId = "execution-persistence-demo-workflow";
  const workerId = "execution-persistence-worker-1";
  const executionId = `execution_persistence_${Date.now()}`;
  const correlationId = `execution_persistence_correlation_${Date.now()}`;

  const started = journal.executionStarted({
    workflowId,
    workerId,
    executionId,
    correlationId,
    metadata: {
      source: "Worker Runtime",
      schedulerPlan: "execution-persistence-demo-plan"
    }
  });

  const startEvent = eventBus.publish({
    type: "worker.execution.started",
    source: "execution-persistence-engine",
    workflowId,
    executionId,
    correlationId,
    routingKey: "worker",
    payload: {
      journalId: started.journalId,
      workerId
    }
  });

  const checkpoint = checkpoints.saveCheckpoint({
    workflowId,
    workerId,
    executionId,
    correlationId,
    status: "running",
    checkpoint: {
      step: "after-worker-assignment",
      progress: 0.5,
      retryCount: 0
    },
    reason: "demo-safe-checkpoint"
  });

  const failed = journal.executionFailed({
    workflowId,
    workerId,
    executionId,
    correlationId,
    previousStatus: "running",
    reason: "simulated-worker-timeout",
    metadata: {
      error: "worker timeout while reading telemetry"
    }
  });

  const failure = failures.recordFailure({
    workflowId,
    workerId,
    executionId,
    correlationId,
    error: new Error("worker timeout while reading telemetry"),
    recoveryRecommendation: "retry-through-scheduler-with-backoff"
  });

  const retry = journal.retryScheduled({
    workflowId,
    workerId,
    executionId,
    correlationId,
    attempt: 2,
    reason: "failure-store-marked-retry-eligible",
    metadata: {
      failureId: failure.failureId
    }
  });

  const completed = journal.executionCompleted({
    workflowId,
    workerId,
    executionId,
    correlationId,
    attempt: 2,
    previousStatus: "retrying",
    reason: "controlled-retry-completed"
  });

  const completionEvent = eventBus.publish({
    type: "worker.execution.completed",
    source: "execution-persistence-engine",
    workflowId,
    executionId,
    correlationId,
    routingKey: "worker",
    payload: {
      journalId: completed.journalId,
      retryJournalId: retry.journalId,
      checkpointId: checkpoint.checkpointId
    }
  });

  const replay = replayMetadata.prepareReplay({
    workflowId,
    executionId,
    correlationId,
    mode: "workflow-execution-correlation"
  });

  const latestCheckpoint = checkpoints.latestCheckpoint({ executionId });
  const currentState = stateReader.currentState({ executionId });
  const history = stateReader.history({ executionId });

  const report = {
    executionPersistenceDemoId: `execution_persistence_demo_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    status: currentState.status === "completed" ? "execution_persistence_ready" : "execution_persistence_attention",
    readonly: true,
    destructiveActions: false,
    initialization,
    integrations: {
      eventBus: {
        initialized: true,
        database: eventBusInitialization.database,
        eventsPublished: [startEvent, completionEvent].filter((event) => event.ok).length
      },
      workerRuntime: "journal fields align with workerId/workflowId/executionId/correlationId",
      scheduler: "retry metadata and recovery recommendation are scheduler-readable",
      autonomousOrchestrator: "state reader exposes safe current state and blockers",
      telemetry: "reports are persisted under memory/execution-persistence for collection",
      dashboard: "state, failures and checkpoints are readonly API-ready",
      database: initialization.database
    },
    journal: {
      entries: [started, failed, retry, completed].map((entry) => ({
        journalId: entry.journalId,
        status: entry.status,
        transition: entry.transition,
        databaseSource: entry.persistence.database.source,
        fallbackUsed: entry.persistence.fallbackUsed
      }))
    },
    checkpoints: {
      saved: {
        checkpointId: checkpoint.checkpointId,
        status: checkpoint.status,
        marker: checkpoint.consistencyMarker.marker,
        fallbackUsed: checkpoint.persistence.fallbackUsed
      },
      latest: latestCheckpoint.checkpoint?.checkpointId || null
    },
    failureStore: {
      failureId: failure.failureId,
      failureType: failure.failureType,
      retryEligible: failure.retryEligible,
      recoveryRecommendation: failure.recoveryRecommendation
    },
    replayMetadata: {
      replayMetadataId: replay.replayMetadataId,
      filters: replay.replayPlan.filters,
      readonly: replay.readonly
    },
    stateReader: {
      currentStatus: currentState.status,
      historyEntries: history.journal.length,
      failures: history.failures.length,
      checkpoints: history.checkpoints.length,
      readErrors: history.readErrors
    },
    fallback: {
      safeMode: true,
      jsonFallback: true,
      behavior: "database persistence is additive; JSON under runtime-data/execution-persistence and memory/execution-persistence remains authoritative fallback"
    }
  };

  report.persistence = engine.persistReport("execution-persistence-demo", report);
  return report;
}

if (require.main === module) {
  console.log(JSON.stringify(runExecutionPersistenceDemo(), null, 2));
}

module.exports = {
  runExecutionPersistenceDemo
};
