const fs = require("node:fs");
const path = require("node:path");
const { DistributedRuntimeEventBus } = require("../../event-bus/runtime-event-bus");
const { runRuntimeRecoveryDemo } = require("../../self-healing/demo/runtime-recovery-demo");
const { runWorkflowReplayDemo } = require("../replay/demo/workflow-replay-demo");
const { DistributedLeaseManager } = require("./distributed-lease-manager");
const { RuntimeClusterState } = require("./runtime-cluster-state");
const { RuntimeHeartbeatCoordinator } = require("./runtime-heartbeat-coordinator");
const { RuntimeNodeFailureDetector } = require("./runtime-node-failure-detector");
const { RuntimeNodeHealthEngine } = require("./runtime-node-health-engine");
const { RuntimeNodeRegistry } = require("./runtime-node-registry");
const { RuntimeNodeRouter } = require("./runtime-node-router");

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

class DistributedRuntimeCoordinator {
  constructor({ rootDir = process.cwd() } = {}) {
    this.rootDir = rootDir;
    this.runtimeDir = path.join(rootDir, "runtime-data", "distributed-runtime");
    this.memoryDir = path.join(rootDir, "memory", "distributed-runtime");
    this.registry = new RuntimeNodeRegistry();
    this.leaseManager = new DistributedLeaseManager({ leaseTtlMs: 5000 });
    this.heartbeatCoordinator = new RuntimeHeartbeatCoordinator({ staleAfterMs: 10_000 });
    this.healthEngine = new RuntimeNodeHealthEngine();
    this.clusterState = new RuntimeClusterState();
    this.failureDetector = new RuntimeNodeFailureDetector();
    this.router = new RuntimeNodeRouter();
    this.eventBus = new DistributedRuntimeEventBus({ rootDir, maxInMemoryEvents: 50, maxEventsPerWindow: 100 });
  }

  initialize() {
    ensureDir(this.runtimeDir);
    ensureDir(this.memoryDir);
    return {
      runtimeDir: this.runtimeDir,
      memoryDir: this.memoryDir,
      safetyMode: "readonly-safe-distributed-runtime"
    };
  }

  runDemo() {
    const initialization = this.initialize();
    const eventBusInitialization = this.eventBus.initialize();
    const replay = runWorkflowReplayDemo();
    const selfHealing = runRuntimeRecoveryDemo();
    this.seedCluster();

    const nodes = this.registry.listNodes();
    const leases = this.seedLeases(replay.seededExecution);
    const heartbeatStatus = this.heartbeatCoordinator.evaluate(nodes);
    const nodeHealth = this.healthEngine.evaluate({ nodes, heartbeatStatus, leases });
    const staleLeases = this.leaseManager.detectStaleLeases(new Date());
    const clusterState = this.clusterState.build({ nodes, nodeHealth, leases, selfHealing, replay });
    const failures = this.failureDetector.detect({ nodes, heartbeatStatus, nodeHealth, staleLeases, clusterState });
    const route = this.router.route({
      nodes,
      nodeHealth,
      capability: "runtime-read",
      avoidNodeIds: failures.filter((failure) => failure.type === "node-offline").map((failure) => failure.evidence.nodeId)
    });
    const balance = this.buildBalancePlan({ nodes, nodeHealth, route, failures });
    const event = this.eventBus.publish({
      type: "scheduler.plan.created",
      source: "distributed-runtime-coordinator",
      workflowId: replay.seededExecution.workflowId,
      executionId: replay.seededExecution.executionId,
      correlationId: replay.seededExecution.correlationId,
      routingKey: "scheduler",
      payload: {
        route,
        balance,
        clusterStateId: clusterState.clusterStateId
      },
      safetyMode: "readonly-safe-distributed-runtime"
    });

    const report = {
      distributedRuntimeDemoId: `distributed_runtime_demo_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      status: "distributed_runtime_coordinator_ready",
      readonly: true,
      destructiveActions: false,
      multiProcessExecution: false,
      initialization,
      eventBus: {
        initialization: eventBusInitialization.database,
        eventPublished: event.ok,
        eventId: event.event?.eventId || null
      },
      clusterState,
      nodes: nodes.map((node) => ({
        nodeId: node.nodeId,
        status: node.status,
        capabilities: node.capabilities,
        workers: node.workers.map((worker) => ({
          workerId: worker.workerId,
          capabilities: worker.capabilities,
          healthStatus: worker.healthStatus,
          activeExecutions: worker.activeExecutions,
          concurrencyLimit: worker.concurrencyLimit
        }))
      })),
      leases,
      heartbeat: heartbeatStatus,
      nodeHealth,
      failuresDetected: failures,
      routing: route,
      balancing: balance,
      recoveryRecommendations: failures.map((failure) => ({
        failureId: failure.failureId,
        type: failure.type,
        recommendation: failure.recoveryRecommendation,
        evidence: failure.evidence
      })),
      integrations: {
        workers: "workers registered by runtime node",
        scheduler: "routing output is scheduler-readable",
        eventBus: "coordination event published as readonly signal",
        selfHealing: "recovery recommendations consumed from failure detector",
        replay: "seeded replay provides workflow/execution/correlation context",
        persistence: "report persisted in runtime-data and memory",
        telemetry: "memory/distributed-runtime is telemetry-readable",
        dashboard: "cluster state is dashboard-ready"
      },
      fallback: {
        safeMode: true,
        jsonFallback: true,
        behavior: "no multi-process execution; coordinator produces readonly plan and audit only"
      }
    };
    report.persistence = this.persistReport(report);
    return report;
  }

  seedCluster() {
    const nodeA = this.registry.registerNode({
      nodeId: "runtime-node-a",
      capabilities: ["runtime-read", "queue-read", "telemetry-read"]
    });
    const nodeB = this.registry.registerNode({
      nodeId: "runtime-node-b",
      capabilities: ["runtime-read", "dashboard-read", "connector-read"]
    });
    const nodeC = this.registry.registerNode({
      nodeId: "runtime-node-c",
      status: "degraded",
      capabilities: ["runtime-read", "replay-read"]
    });

    this.registry.registerWorker(nodeA.nodeId, {
      workerId: "node-a-worker-1",
      capabilities: ["runtime-read", "queue-read"],
      concurrencyLimit: 2,
      activeExecutions: 1
    });
    this.registry.registerWorker(nodeA.nodeId, {
      workerId: "node-a-worker-2",
      capabilities: ["telemetry-read"],
      concurrencyLimit: 1,
      activeExecutions: 1
    });
    this.registry.registerWorker(nodeB.nodeId, {
      workerId: "node-b-worker-1",
      capabilities: ["runtime-read", "dashboard-read"],
      concurrencyLimit: 2,
      activeExecutions: 0
    });
    this.registry.registerWorker(nodeC.nodeId, {
      workerId: "node-c-worker-1",
      capabilities: ["runtime-read", "replay-read"],
      concurrencyLimit: 1,
      activeExecutions: 1,
      healthStatus: "unhealthy"
    });

    const now = Date.now();
    this.heartbeatCoordinator.recordHeartbeat({
      nodeId: nodeA.nodeId,
      timestamp: new Date(now).toISOString(),
      metrics: { queueDepth: 2, activeExecutions: 2 }
    });
    this.heartbeatCoordinator.recordHeartbeat({
      nodeId: nodeB.nodeId,
      timestamp: new Date(now).toISOString(),
      metrics: { queueDepth: 1, activeExecutions: 0 }
    });
    this.heartbeatCoordinator.recordHeartbeat({
      nodeId: nodeC.nodeId,
      status: "degraded",
      timestamp: new Date(now - 60_000).toISOString(),
      metrics: { queueDepth: 5, activeExecutions: 1 }
    });
  }

  seedLeases(seededExecution) {
    this.leaseManager.createLease({
      workflowId: seededExecution.workflowId,
      executionId: seededExecution.executionId,
      nodeId: "runtime-node-a",
      workerId: "node-a-worker-1",
      ownerId: "runtime-node-a"
    });
    this.leaseManager.createLease({
      workflowId: "stale-distributed-workflow",
      executionId: "stale-distributed-execution",
      nodeId: "runtime-node-c",
      workerId: "node-c-worker-1",
      ownerId: "runtime-node-c",
      createdAt: new Date(Date.now() - 60_000)
    });
    return this.leaseManager.listLeases();
  }

  buildBalancePlan({ nodes, nodeHealth, route, failures }) {
    return {
      balancePlanId: `distributed_balance_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      readonly: true,
      executeRebalance: false,
      selectedNodeId: route.selectedNodeId,
      avoidNodes: failures.filter((failure) => ["node-offline", "stale-heartbeat"].includes(failure.type)).map((failure) => failure.evidence.nodeId),
      saturatedNodes: nodeHealth.filter((node) => node.saturated).map((node) => node.nodeId),
      recommendations: [
        "route new runtime-read work to highest healthy capacity node",
        "avoid stale heartbeat nodes",
        "expire stale leases before real reassignment",
        "require human gate before multi-process recovery"
      ],
      candidateNodeCount: nodes.length,
      safetyMode: "readonly-safe-distributed-balancing"
    };
  }

  persistReport(report) {
    const filename = `distributed-runtime-${timestampForFile()}-${report.distributedRuntimeDemoId}.json`;
    return {
      runtimePath: writeJson(path.join(this.runtimeDir, filename), report),
      memoryPath: writeJson(path.join(this.memoryDir, filename), report)
    };
  }
}

module.exports = {
  DistributedRuntimeCoordinator
};
