const fs = require("node:fs");
const path = require("node:path");
const { DistributedRuntimeEventBus } = require("../../event-bus/runtime-event-bus");
const { DistributedRuntimeCoordinator } = require("../distributed/distributed-runtime-coordinator");
const { DistributedQueueRuntime } = require("../queue/distributed-queue-runtime");
const { RuntimeConsensusEngine } = require("./runtime-consensus-engine");
const { RuntimeNodeSyncEngine } = require("./runtime-node-sync-engine");
const { RuntimeReplicationAudit } = require("./runtime-replication-audit");
const { RuntimeSnapshotManager } = require("./runtime-snapshot-manager");
const { RuntimeStateReconciliation } = require("./runtime-state-reconciliation");

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function safeReadJson(filePath) {
  try {
    return { ok: true, data: JSON.parse(fs.readFileSync(filePath, "utf8")) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function readLatestJson(rootDir, relativeDir) {
  const directory = path.join(rootDir, relativeDir);
  if (!fs.existsSync(directory)) {
    return {
      available: false,
      sourcePath: null,
      data: null,
      readErrors: [],
      fallback: { safeMode: true, reason: "directory-unavailable" }
    };
  }

  const readErrors = [];
  const files = fs.readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const sourcePath = path.join(directory, file);
      return { sourcePath, mtimeMs: fs.statSync(sourcePath).mtimeMs };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs);

  for (const file of files) {
    const read = safeReadJson(file.sourcePath);
    if (read.ok) {
      return {
        available: true,
        sourcePath: file.sourcePath,
        data: read.data,
        readErrors,
        fallback: null
      };
    }
    readErrors.push({ sourcePath: file.sourcePath, error: read.error });
  }

  return {
    available: false,
    sourcePath: null,
    data: null,
    readErrors,
    fallback: { safeMode: true, reason: "no-readable-json-files" }
  };
}

class RuntimeStateReplicator {
  constructor({ rootDir = process.cwd() } = {}) {
    this.rootDir = rootDir;
    this.runtimeDir = path.join(rootDir, "runtime-data", "replication");
    this.memoryDir = path.join(rootDir, "memory", "replication");
    this.snapshotManager = new RuntimeSnapshotManager();
    this.consensusEngine = new RuntimeConsensusEngine();
    this.reconciliation = new RuntimeStateReconciliation();
    this.syncEngine = new RuntimeNodeSyncEngine();
    this.audit = new RuntimeReplicationAudit({ rootDir });
    this.eventBus = new DistributedRuntimeEventBus({ rootDir, maxInMemoryEvents: 50, maxEventsPerWindow: 100 });
  }

  initialize() {
    ensureDir(this.runtimeDir);
    ensureDir(this.memoryDir);
    return {
      runtimeDir: this.runtimeDir,
      memoryDir: this.memoryDir,
      safetyMode: "readonly-safe-runtime-replication"
    };
  }

  loadSources() {
    return {
      distributedRuntime: readLatestJson(this.rootDir, "memory/distributed-runtime"),
      distributedQueue: readLatestJson(this.rootDir, "memory/distributed-queue"),
      replay: readLatestJson(this.rootDir, "memory/replay"),
      selfHealing: readLatestJson(this.rootDir, "memory/self-healing"),
      eventBus: readLatestJson(this.rootDir, "memory/event-bus"),
      scheduler: readLatestJson(this.rootDir, "memory/worker-scheduler"),
      telemetry: readLatestJson(this.rootDir, "memory/telemetry"),
      dashboard: readLatestJson(this.rootDir, "memory/dashboard-web")
    };
  }

  runDemo() {
    const initialization = this.initialize();
    const distributedRuntime = new DistributedRuntimeCoordinator({ rootDir: this.rootDir }).runDemo();
    const distributedQueue = new DistributedQueueRuntime({ rootDir: this.rootDir }).runDemo();
    const sources = this.loadSources();
    const replay = sources.replay.data || null;
    const selfHealing = sources.selfHealing.data || null;
    const snapshots = this.snapshotManager.createSnapshots({
      distributedRuntime,
      distributedQueue,
      replay,
      selfHealing
    });
    const consensus = this.consensusEngine.evaluate({ snapshots, distributedRuntime });
    const reconciliation = this.reconciliation.reconcile({
      snapshots,
      distributedRuntime,
      distributedQueue,
      consensus
    });
    const nodeSync = this.syncEngine.evaluate({ snapshots, consensus });
    const replicationState = this.buildReplicationState({ snapshots, consensus, reconciliation, nodeSync });
    const eventBus = this.publishReplicationEvent({ replicationState, consensus, reconciliation, nodeSync });

    const report = {
      replicationReportId: `runtime_replication_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      status: "runtime_state_replication_consensus_ready",
      readonly: true,
      destructiveActions: false,
      realConsensus: false,
      realNodeMutation: false,
      initialization,
      sources: Object.fromEntries(Object.entries(sources).map(([key, source]) => [
        key,
        {
          available: source.available,
          sourcePath: source.sourcePath,
          readErrors: source.readErrors,
          fallback: source.fallback
        }
      ])),
      snapshots,
      replicationState,
      consensus,
      reconciliation,
      nodeSync,
      integrations: {
        distributedRuntime: "cluster state, leases, heartbeat and node health replicated as snapshots",
        distributedQueue: "queue partitions and pressure metadata replicated",
        replay: "replay validation metadata included in snapshots",
        selfHealing: "recovery metadata included in snapshots",
        eventBus: "replication event published as readonly signal",
        scheduler: "scheduler source checked for replication context",
        telemetry: "memory/replication is telemetry-readable",
        dashboard: "replication report is dashboard-ready"
      },
      eventBus,
      fallback: {
        safeMode: true,
        jsonFallback: true,
        behavior: "replication produces snapshots, consensus metadata and reconciliation plans only",
        missingSources: Object.entries(sources).filter(([, source]) => !source.available).map(([key]) => key)
      },
      persistence: null
    };
    report.persistence = this.audit.persist(report);
    return report;
  }

  buildReplicationState({ snapshots, consensus, reconciliation, nodeSync }) {
    return {
      replicationStateId: `replication_state_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      generatedAt: new Date().toISOString(),
      replicatedNodes: snapshots.length,
      snapshotVersions: snapshots.map((snapshot) => ({
        nodeId: snapshot.nodeId,
        snapshotId: snapshot.snapshotId,
        versionId: snapshot.version.versionId,
        hash: snapshot.version.recordHash
      })),
      majorityAchieved: consensus.clusterMajority.achieved,
      splitBrainDetected: consensus.splitBrain.detected,
      reconciliationRequired: reconciliation.status === "reconciliation-required",
      staleReplicationNodes: nodeSync.replicationLag.staleNodes,
      executeReplication: false,
      safetyMode: "readonly-safe-replication-state"
    };
  }

  publishReplicationEvent(payload) {
    try {
      this.eventBus.initialize();
      const publication = this.eventBus.publish({
        type: "scheduler.plan.created",
        source: "runtime-state-replication-consensus",
        workflowId: "runtime-state-replication",
        correlationId: `runtime_replication_${Date.now()}`,
        routingKey: "scheduler",
        payload,
        safetyMode: "readonly-safe-runtime-replication"
      });
      return {
        eventPublished: publication.ok,
        eventId: publication.event?.eventId || null,
        status: publication.status,
        fallback: publication.fallback
      };
    } catch (error) {
      return {
        eventPublished: false,
        error: error.message,
        fallback: {
          safeMode: true,
          reason: "event-publication-failed"
        }
      };
    }
  }
}

module.exports = {
  RuntimeStateReplicator,
  readLatestJson
};
