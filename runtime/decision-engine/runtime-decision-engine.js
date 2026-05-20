const fs = require("node:fs");
const path = require("node:path");

const MEMORY_SOURCES = Object.freeze({
  optimizationEnforcement: "optimization-enforcement",
  enforcementIntegration: "enforcement-integration",
  predictive: "predictive",
  proactive: "proactive",
  recovery: "recovery",
  health: "health",
  queue: "queue",
  learning: "learning"
});

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

function readJsonFiles(directory) {
  if (!fs.existsSync(directory)) {
    return {
      files: [],
      errors: []
    };
  }

  const files = [];
  const errors = [];

  for (const file of fs.readdirSync(directory).filter((candidate) => candidate.endsWith(".json"))) {
    const fullPath = path.join(directory, file);
    try {
      files.push({
        path: fullPath,
        name: file,
        mtimeMs: fs.statSync(fullPath).mtimeMs,
        data: JSON.parse(fs.readFileSync(fullPath, "utf8"))
      });
    } catch (error) {
      errors.push({
        path: fullPath,
        name: file,
        error: error.message
      });
    }
  }

  return {
    files: files.sort((left, right) => right.mtimeMs - left.mtimeMs),
    errors
  };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

class RuntimeDecisionEngine {
  constructor(rootDir = process.cwd(), options = {}) {
    this.rootDir = rootDir;
    this.now = options.now || new Date();
    this.ttlMs = options.ttlMs || 30 * 60 * 1000;
  }

  loadSources() {
    const loaded = {};

    for (const [key, directoryName] of Object.entries(MEMORY_SOURCES)) {
      const directory = path.join(this.rootDir, "memory", directoryName);
      const { files, errors } = readJsonFiles(directory);
      loaded[key] = {
        directory,
        available: files.length > 0,
        latest: files[0] || null,
        recent: files.slice(0, key === "enforcementIntegration" ? 6 : 3),
        readErrors: errors
      };
    }

    return loaded;
  }

  evaluate() {
    const sources = this.loadSources();
    const decisions = [
      ...this.decideCriticalWorkflowPause(sources),
      ...this.decideReroute(sources),
      ...this.decideConcurrencyReduction(sources),
      ...this.decideThrottling(sources),
      ...this.decideProtectedQueue(sources),
      ...this.decideRetryStrategy(sources),
      ...this.decidePreventiveRecovery(sources),
      ...this.decideHumanGate(sources)
    ];

    if (decisions.length === 0) {
      decisions.push(this.createDecision({
        type: "normal-execution",
        severity: "low",
        source: ["runtime-decision-engine"],
        evidence: {
          availableSources: this.availableSourceNames(sources),
          missingSources: this.missingSourceNames(sources)
        },
        action: "maintain-normal-execution",
        reason: "No high risk, throttling, recovery, gated queue, or rerouting signal was found.",
        safetyMode: "observe-only"
      }));
    }

    const report = {
      decisionReportId: `runtime_decision_report_${Date.now()}`,
      generatedAt: this.now.toISOString(),
      status: decisions.length > 0 ? "runtime_decisions_generated" : "no_runtime_decisions",
      safety: {
        productionChanged: false,
        destructiveActions: false,
        appliesRuntimePlanOnly: true
      },
      sources: this.summarizeSources(sources),
      decisions,
      coordination: this.buildCoordination(decisions),
      fallback: this.buildFallback(sources, decisions)
    };

    return report;
  }

  decideCriticalWorkflowPause(sources) {
    const predictive = sources.predictive.latest?.data;
    const proactive = sources.proactive.latest?.data;
    const decisions = [];
    const criticalWorkflows = asArray(predictive?.criticalWorkflows).filter(
      (workflow) => workflow.forecast === "critical" || workflow.failureProbability >= 90
    );
    const blockedWorkflows = asArray(proactive?.actions).filter(
      (action) => action.type === "predictive-workflow-block"
    );
    const workflows = new Map();

    for (const workflow of criticalWorkflows) {
      workflows.set(workflow.workflow, {
        workflow: workflow.workflow,
        failureProbability: workflow.failureProbability,
        forecast: workflow.forecast,
        incidents: workflow.incidents
      });
    }

    for (const action of blockedWorkflows) {
      workflows.set(action.workflow, {
        workflow: action.workflow,
        failureProbability: action.failureProbability,
        forecast: "critical",
        blockMode: action.blockMode
      });
    }

    for (const workflow of workflows.values()) {
      decisions.push(this.createDecision({
        type: "pause-critical-workflow",
        severity: "critical",
        source: ["memory/predictive", "memory/proactive"],
        evidence: workflow,
        action: `pause ${workflow.workflow} until human gate and healthy worker are available`,
        reason: `Workflow ${workflow.workflow} is forecast as critical.`,
        safetyMode: "soft-block-declarative"
      }));
    }

    return decisions;
  }

  decideReroute(sources) {
    const predictive = sources.predictive.latest?.data;
    const optimization = sources.optimizationEnforcement.latest?.data;
    const routerIntegration = sources.enforcementIntegration.recent
      .map((file) => file.data)
      .find((report) => report.integrationId?.startsWith("router_"));
    const saturatedWorkers = asArray(predictive?.saturatedWorkers)
      .filter((worker) => worker.forecast === "critical" || worker.saturationScore >= 60)
      .map((worker) => worker.workerId);
    const avoidedWorkers = asArray(optimization?.decisions)
      .filter((decision) => decision.type === "worker-avoidance")
      .map((decision) => decision.avoidWorker);
    const integrationWorkers = asArray(routerIntegration?.optimizationEnforcement?.avoidedWorkers);
    const workers = unique([...saturatedWorkers, ...avoidedWorkers, ...integrationWorkers]);

    if (workers.length === 0) {
      return [];
    }

    return [
      this.createDecision({
        type: "reroute-agent-worker",
        severity: workers.length >= 3 ? "high" : "medium",
        source: ["memory/predictive", "memory/optimization-enforcement", "memory/enforcement-integration"],
        evidence: {
          workersToAvoid: workers,
          avoidedAgents: asArray(routerIntegration?.optimizationEnforcement?.avoidedAgents),
          routerApplied: routerIntegration?.optimizationEnforcement?.fallback === null
        },
        action: "route new work away from avoided workers and mapped agents",
        reason: `${workers.length} worker(s) are saturated, stale, or already avoided by enforcement.`,
        safetyMode: "declarative-routing-constraint"
      })
    ];
  }

  decideConcurrencyReduction(sources) {
    const optimization = sources.optimizationEnforcement.latest?.data;
    const queue = sources.queue.latest?.data;
    const concurrency = asArray(optimization?.decisions).find(
      (decision) => decision.type === "concurrency-limit"
    );
    const maxConcurrentExecutions =
      concurrency?.recommendedLimit ?? queue?.metrics?.throttling?.maxConcurrentExecutions ?? null;

    if (!maxConcurrentExecutions || maxConcurrentExecutions > 1) {
      return [];
    }

    return [
      this.createDecision({
        type: "reduce-concurrency",
        severity: "high",
        source: ["memory/optimization-enforcement", "memory/queue"],
        evidence: {
          recommendedLimit: maxConcurrentExecutions,
          queueAppliedLimit: queue?.metrics?.throttling?.maxConcurrentExecutions || null,
          mode: concurrency?.mode || queue?.metrics?.throttling?.mode || null
        },
        action: `set maxConcurrentExecutions=${maxConcurrentExecutions}`,
        reason: "Optimization and queue telemetry indicate the runtime should stay at a protective minimum.",
        safetyMode: "declarative-capacity-limit"
      })
    ];
  }

  decideThrottling(sources) {
    const optimization = sources.optimizationEnforcement.latest?.data;
    const predictive = sources.predictive.latest?.data;
    const throttling = asArray(optimization?.decisions).find(
      (decision) => decision.type === "throttling-mode"
    );
    const predictiveThrottle = predictive?.recommendations?.throttling;

    if (!throttling && !predictiveThrottle?.recommended) {
      return [];
    }

    return [
      this.createDecision({
        type: "apply-throttling",
        severity: "high",
        source: ["memory/optimization-enforcement", "memory/predictive"],
        evidence: {
          mode: throttling?.mode || predictiveThrottle?.mode,
          maxConcurrentExecutions:
            throttling?.maxConcurrentExecutions || predictiveThrottle?.maxConcurrentExecutions,
          runtimeRisk: predictive?.runtimeRisk?.riskScore ?? null,
          predictedHealth: predictive?.predictiveHealth?.predictedHealthScore ?? null
        },
        action: `apply ${throttling?.mode || predictiveThrottle?.mode} throttling`,
        reason: throttling?.reason || predictiveThrottle?.reason || "Predictive risk requires throttling.",
        safetyMode: "declarative-throttle"
      })
    ];
  }

  decideProtectedQueue(sources) {
    const optimization = sources.optimizationEnforcement.latest?.data;
    const queueIntegration = sources.enforcementIntegration.recent
      .map((file) => file.data)
      .find((report) => report.integrationId?.startsWith("queue_"));
    const gated = asArray(optimization?.decisions).filter(
      (decision) =>
        decision.type === "queue-priority" &&
        String(decision.recommendedPriority || "").includes("gated")
    );
    const protectedItems = asArray(queueIntegration?.effects?.protectedQueue);
    const workflows = unique([
      ...gated.map((decision) => decision.workflow),
      ...protectedItems.map((item) => item.workflow)
    ]);

    if (workflows.length === 0) {
      return [];
    }

    return workflows.map((workflow) =>
      this.createDecision({
        type: "protected-queue",
        severity: "high",
        source: ["memory/optimization-enforcement", "memory/enforcement-integration"],
        evidence: {
          workflow,
          gatedPriority: gated.find((decision) => decision.workflow === workflow)?.recommendedPriority || null,
          protectedQueueStatus: protectedItems.find((item) => item.workflow === workflow)?.status || null
        },
        action: `send ${workflow} to protected queue`,
        reason: `Workflow ${workflow} requires a gated priority lane.`,
        safetyMode: "queue-gate-declarative"
      })
    );
  }

  decideRetryStrategy(sources) {
    const optimization = sources.optimizationEnforcement.latest?.data;
    const retry = asArray(optimization?.decisions).filter(
      (decision) => decision.type === "retry-strategy"
    );

    if (retry.length === 0) {
      return [];
    }

    return [
      this.createDecision({
        type: "retry-strategy",
        severity: "medium",
        source: ["memory/optimization-enforcement"],
        evidence: {
          strategies: retry.map((decision) => ({
            workflow: decision.workflow || "default",
            strategy: decision.strategy || {
              maxRetries: decision.recommendedMaxRetries,
              backoff: decision.backoff
            }
          }))
        },
        action: "apply recommended retry strategy to new queue items",
        reason: "Optimization enforcement generated a retry strategy for runtime execution.",
        safetyMode: "declarative-retry-policy"
      })
    ];
  }

  decidePreventiveRecovery(sources) {
    const proactive = sources.proactive.latest?.data;
    const recovery = sources.recovery.latest?.data;
    const proactiveTriggers = asArray(proactive?.actions).filter(
      (action) => action.type === "predictive-recovery-trigger"
    );
    const staleWorkers = asArray(recovery?.staleWorkers);
    const expiredLeases = asArray(recovery?.expiredLeases);

    if (proactiveTriggers.length === 0 && staleWorkers.length === 0 && expiredLeases.length === 0) {
      return [];
    }

    return [
      this.createDecision({
        type: "preventive-recovery",
        severity: expiredLeases.length > 0 || staleWorkers.length > 0 ? "high" : "medium",
        source: ["memory/proactive", "memory/recovery"],
        evidence: {
          triggers: proactiveTriggers.map((trigger) => ({
            targetType: trigger.targetType,
            target: trigger.target,
            action: trigger.action,
            reason: trigger.reason
          })),
          staleWorkers: staleWorkers.map((worker) => worker.workerId),
          expiredLeases: expiredLeases.map((lease) => lease.leaseId)
        },
        action: "run preventive recovery scan before releasing gated or high-risk work",
        reason: "Recovery signals or proactive triggers indicate stale worker and lease risk.",
        safetyMode: "preventive-recovery-declarative"
      })
    ];
  }

  decideHumanGate(sources) {
    const proactive = sources.proactive.latest?.data;
    const predictive = sources.predictive.latest?.data;
    const proactiveGates = asArray(proactive?.actions).filter(
      (action) => action.type === "predictive-human-gate"
    );
    const guardedWorkflows = asArray(predictive?.recommendations?.routing?.guardedWorkflows);

    if (proactiveGates.length === 0 && guardedWorkflows.length === 0) {
      return [];
    }

    return [
      this.createDecision({
        type: "human-gate",
        severity: "critical",
        source: ["memory/proactive", "memory/predictive"],
        evidence: {
          gates: proactiveGates.map((gate) => ({
            scope: gate.scope,
            workflow: gate.workflow || null,
            gate: gate.gate,
            reason: gate.reason
          })),
          guardedWorkflows
        },
        action: "require human validation before critical execution",
        reason: "Predictive health and proactive policy require human validation for critical paths.",
        safetyMode: "human-approval-required"
      })
    ];
  }

  buildCoordination(decisions) {
    return {
      router: decisions
        .filter((decision) => decision.type === "reroute-agent-worker")
        .map((decision) => decision.action),
      queue: decisions
        .filter((decision) =>
          ["reduce-concurrency", "apply-throttling", "protected-queue", "retry-strategy"].includes(decision.type)
        )
        .map((decision) => decision.action),
      recovery: decisions
        .filter((decision) => decision.type === "preventive-recovery")
        .map((decision) => decision.action),
      supervisor: decisions
        .filter((decision) => ["pause-critical-workflow", "human-gate"].includes(decision.type))
        .map((decision) => decision.action)
    };
  }

  buildFallback(sources, decisions) {
    return {
      safeMode: true,
      missingSources: this.missingSourceNames(sources),
      behavior:
        decisions.length === 1 && decisions[0].type === "normal-execution"
          ? "normal execution is allowed because no elevated risk signal was available"
          : "decisions are declarative and require explicit integration before changing production execution"
    };
  }

  availableSourceNames(sources) {
    return Object.entries(sources)
      .filter(([, source]) => source.available)
      .map(([key]) => `memory/${MEMORY_SOURCES[key]}`);
  }

  missingSourceNames(sources) {
    return Object.entries(sources)
      .filter(([, source]) => !source.available)
      .map(([key]) => `memory/${MEMORY_SOURCES[key]}`);
  }

  summarizeSources(sources) {
    return Object.fromEntries(
      Object.entries(sources).map(([key, source]) => [
        key,
        {
          directory: `memory/${MEMORY_SOURCES[key]}`,
          available: source.available,
          latestPath: source.latest?.path || null,
          recentFiles: source.recent.map((file) => file.name),
          readErrors: source.readErrors
        }
      ])
    );
  }

  createDecision({ type, severity, source, evidence, action, reason, safetyMode }) {
    return {
      decisionId: `decision_${type}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      type,
      severity,
      source,
      evidence,
      action,
      reason,
      safetyMode,
      expiresAt: new Date(this.now.getTime() + this.ttlMs).toISOString()
    };
  }

  persist(report) {
    const runtimeDir = path.join(this.rootDir, "runtime-data", "decisions");
    const memoryDir = path.join(this.rootDir, "memory", "decisions");
    ensureDirectory(runtimeDir);
    ensureDirectory(memoryDir);

    const filename = `runtime-decisions-${timestampForFile(this.now)}.json`;
    const runtimePath = path.join(runtimeDir, filename);
    const memoryPath = path.join(memoryDir, filename);

    fs.writeFileSync(runtimePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(memoryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

    return {
      runtimePath,
      memoryPath
    };
  }
}

module.exports = {
  RuntimeDecisionEngine
};
