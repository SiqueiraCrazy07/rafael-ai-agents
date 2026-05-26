const { WorkflowReplayEngine } = require("../runtime/replay/workflow-replay-engine");
const { RuntimeHealthMonitor } = require("./runtime-health-monitor");
const { FailureClassificationEngine } = require("./failure-classification-engine");
const { CheckpointRecoveryManager } = require("./checkpoint-recovery-manager");
const { SelfHealingPlanner } = require("./self-healing-planner");
const { RecoveryAudit } = require("./recovery-audit");

class RuntimeRecoveryEngine {
  constructor({ rootDir = process.cwd() } = {}) {
    this.rootDir = rootDir;
    this.healthMonitor = new RuntimeHealthMonitor({ rootDir });
    this.classifier = new FailureClassificationEngine();
    this.checkpointRecovery = new CheckpointRecoveryManager({ rootDir });
    this.selfHealingPlanner = new SelfHealingPlanner();
    this.replayEngine = new WorkflowReplayEngine({ rootDir });
    this.audit = new RecoveryAudit({ rootDir });
  }

  run(input = {}) {
    const auditInit = this.audit.initialize();
    const replay = this.replayEngine.replay(input);
    const filters = {
      workflowId: replay.plan.filters.workflowId || input.workflowId || replay.seededWorkflowId || null,
      executionId: replay.plan.filters.executionId || input.executionId || null,
      correlationId: replay.plan.filters.correlationId || input.correlationId || null
    };
    const health = this.healthMonitor.scan();
    const classifications = this.classifier.classifyMany(health.signals);
    const checkpointRecovery = this.checkpointRecovery.locateLatestValidCheckpoint(filters);
    const plan = this.selfHealingPlanner.buildPlan({ classifications, checkpointRecovery, replay });
    const executionContext = this.restoreExecutionContext({ replay, checkpointRecovery, classifications });

    const report = {
      recoverySessionId: `runtime_recovery_session_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      generatedAt: new Date().toISOString(),
      status: "runtime_recovery_plan_ready",
      readonly: true,
      destructiveActions: false,
      recoveryExecuted: false,
      initialization: auditInit,
      filters,
      health,
      classifications,
      checkpointRecovery,
      selfHealingPlan: plan,
      executionContext,
      replay: {
        replayId: replay.replayId,
        status: replay.status,
        timelineItems: replay.timeline.total,
        validation: replay.validation,
        audit: replay.audit
      },
      recoveryMetadata: {
        recoveryMode: "supervised-readonly-plan",
        requiresHumanGate: plan.humanGateRequired,
        safeToExecuteAutomatically: false,
        reason: "V1 blocks real recovery and only prepares recovery metadata"
      },
      integrations: {
        workflowReplay: "used to reconstruct execution state",
        executionPersistence: "journal/checkpoint/failure data used through replay and health scan",
        eventBus: "event stream gaps and replay events used as evidence",
        workers: "unhealthy workers and stalled workflows detected from worker reports",
        scheduler: "retry and protected queue pressure used as recovery signal",
        telemetry: "audit persisted under memory/self-healing",
        dashboard: "report is readonly dashboard-ready",
        autonomousOrchestrator: "human gate and supervised plan are machine-readable"
      },
      fallback: {
        safeMode: true,
        jsonFallback: true,
        behavior: "no recovery action is executed; plan and audit are persisted only"
      }
    };

    report.audit = this.audit.record(report);
    return report;
  }

  restoreExecutionContext({ replay, checkpointRecovery, classifications }) {
    const latestTimeline = replay.timeline.stages.at(-1) || null;
    return {
      restored: true,
      readonly: true,
      destructiveActions: false,
      workflowId: latestTimeline?.workflowId || checkpointRecovery.latest?.workflowId || null,
      executionId: latestTimeline?.executionId || checkpointRecovery.latest?.executionId || null,
      correlationId: latestTimeline?.correlationId || checkpointRecovery.latest?.correlationId || null,
      lastKnownStage: latestTimeline?.label || "unknown",
      latestCheckpointId: checkpointRecovery.latest?.checkpointId || null,
      failureTypes: [...new Set(classifications.map((item) => item.failureType))],
      safetyMode: "readonly-safe-execution-context-restore"
    };
  }
}

module.exports = {
  RuntimeRecoveryEngine
};
