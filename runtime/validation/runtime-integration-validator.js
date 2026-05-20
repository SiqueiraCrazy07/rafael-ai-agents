const fs = require("node:fs");
const path = require("node:path");

const { RuntimeDecisionEngine } = require("../decision-engine/runtime-decision-engine");
const { RuntimeEventBus, EVENT_TYPES } = require("../event-bus/runtime-event-bus");
const { StateTransitionCoordinator } = require("../state-machine/state-transition-coordinator");
const { WORKFLOW_STATES, WorkflowStateMachine } = require("../state-machine/workflow-state-machine");
const { validateGovernance } = require("../../validators/governance/governance-checklist-validator");

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

function listJsonFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const fullPath = path.join(directory, file);
      return {
        name: file,
        path: fullPath,
        mtimeMs: fs.statSync(fullPath).mtimeMs
      };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs);
}

function readLatestJson(directory) {
  const readErrors = [];
  for (const file of listJsonFiles(directory)) {
    try {
      return {
        available: true,
        path: file.path,
        data: JSON.parse(fs.readFileSync(file.path, "utf8")),
        readErrors
      };
    } catch (error) {
      readErrors.push({
        path: file.path,
        error: error.message
      });
    }
  }

  return {
    available: false,
    path: null,
    data: null,
    readErrors
  };
}

function check(name, passed, evidence = {}, severity = "error") {
  return {
    name,
    status: passed ? "passed" : "failed",
    passed,
    severity,
    evidence
  };
}

class RuntimeIntegrationValidator {
  constructor(rootDir = process.cwd(), options = {}) {
    this.rootDir = rootDir;
    this.now = options.now || new Date();
  }

  validate() {
    const checks = [
      ...this.validateCognitiveRuntime(),
      ...this.validateOperationalRuntime(),
      ...this.validateCommunicationRuntime(),
      ...this.validateGovernanceCoverage(),
      ...this.validatePersistence(),
      ...this.validateLifecycle(),
      ...this.validateEventFlow(),
      ...this.validateFallbacks()
    ];
    const failed = checks.filter((item) => !item.passed);
    const warnings = checks.filter((item) => item.severity === "warning" && !item.passed);
    const report = {
      validationId: `runtime_integration_validation_${Date.now()}`,
      generatedAt: this.now.toISOString(),
      status: failed.length === 0 ? "passed" : "failed",
      phase: "fase-1",
      summary: {
        totalChecks: checks.length,
        passed: checks.filter((item) => item.passed).length,
        failed: failed.length,
        warnings: warnings.length
      },
      readiness: this.calculateReadiness(checks),
      modulesValidated: this.modulesValidated(),
      checks,
      risks: this.remainingRisks(),
      fallback: {
        safeMode: true,
        validationOnly: true,
        productionChanged: false
      }
    };

    return report;
  }

  validateCognitiveRuntime() {
    const memory = (name) => path.join(this.rootDir, "memory", name);
    const runtime = (name) => path.join(this.rootDir, "runtime", name);
    const latestDecision = readLatestJson(memory("decisions"));
    const latestOptimization = readLatestJson(memory("optimization"));
    const latestEnforcement = readLatestJson(memory("optimization-enforcement"));
    const latestPredictive = readLatestJson(memory("predictive"));

    return [
      check("cognitive.predictive.memory", latestPredictive.available, {
        path: latestPredictive.path,
        forecastId: latestPredictive.data?.forecastId || null
      }),
      check("cognitive.optimization.memory", latestOptimization.available, {
        path: latestOptimization.path,
        optimizationId: latestOptimization.data?.optimizationId || null
      }),
      check("cognitive.enforcement.memory", latestEnforcement.available, {
        path: latestEnforcement.path,
        enforcementId: latestEnforcement.data?.enforcementId || null
      }),
      check("cognitive.decision-engine.module", fs.existsSync(runtime("decision-engine")), {
        path: runtime("decision-engine")
      }),
      check("cognitive.decision-engine.memory", latestDecision.available, {
        path: latestDecision.path,
        decisions: latestDecision.data?.decisions?.length || 0
      })
    ];
  }

  validateOperationalRuntime() {
    const memory = (name) => path.join(this.rootDir, "memory", name);
    const runtime = (name) => path.join(this.rootDir, "runtime", name);
    const engine = (name) => path.join(this.rootDir, "engine", name);

    return [
      check("operational.queue.memory", readLatestJson(memory("queue")).available, {
        path: readLatestJson(memory("queue")).path
      }),
      check("operational.router.memory", readLatestJson(memory("routing-decisions")).available, {
        path: readLatestJson(memory("routing-decisions")).path
      }),
      check("operational.recovery.memory", readLatestJson(memory("recovery")).available, {
        path: readLatestJson(memory("recovery")).path
      }),
      check("operational.state-machine.module", fs.existsSync(runtime("state-machine")), {
        path: runtime("state-machine")
      }),
      check("operational.state-machine.memory", readLatestJson(memory("state-machine")).available, {
        path: readLatestJson(memory("state-machine")).path
      }),
      check("operational.transition-coordinator.memory", readLatestJson(memory("state-transitions")).available, {
        path: readLatestJson(memory("state-transitions")).path
      }),
      check("operational.router.module", fs.existsSync(engine("runtime")), {
        path: engine("runtime")
      })
    ];
  }

  validateCommunicationRuntime() {
    const eventBusPath = path.join(this.rootDir, "runtime", "event-bus", "runtime-event-bus.js");
    const eventSource = readLatestJson(path.join(this.rootDir, "memory", "events"));
    const bus = new RuntimeEventBus({ rootDir: this.rootDir, persistOnPublish: false });
    const received = [];
    const subscriptionId = bus.subscribe(EVENT_TYPES.WORKFLOW_QUEUED, (event) => {
      received.push(event.eventId);
    });
    const publication = bus.publish({
      type: EVENT_TYPES.WORKFLOW_QUEUED,
      source: "runtime-integration-validator",
      workflowId: "validation-workflow",
      project: "platform",
      correlationId: "validation-communication",
      payload: {
        validation: true
      },
      safetyMode: "validation"
    });
    const unsubscribed = bus.unsubscribe(subscriptionId);
    const replayed = bus.replay({
      correlationId: "validation-communication",
      includePersisted: false
    });

    return [
      check("communication.event-bus.module", fs.existsSync(eventBusPath), { path: eventBusPath }),
      check("communication.publish", Boolean(publication.event.eventId), {
        eventId: publication.event.eventId,
        type: publication.event.type
      }),
      check("communication.subscribers", received.length === 1, { received }),
      check("communication.unsubscribe", unsubscribed, { subscriptionId }),
      check("communication.replay", replayed.length === 1, {
        count: replayed.length,
        correlationId: "validation-communication"
      }),
      check("communication.event-persistence", eventSource.available, {
        path: eventSource.path,
        type: eventSource.data?.type || null
      })
    ];
  }

  validateGovernanceCoverage() {
    const governance = validateGovernance(this.rootDir);
    const principles = fs.readFileSync(
      path.join(this.rootDir, "governance", "platform-architecture-principles.md"),
      "utf8"
    );
    const gates = fs.readFileSync(
      path.join(this.rootDir, "governance", "runtime-quality-gates.md"),
      "utf8"
    );

    return [
      check("governance.validate", governance.valid, {
        errors: governance.errors
      }),
      check("governance.quality-gates", gates.includes("Fallback Gate") && gates.includes("Validation Gate"), {
        required: ["Fallback Gate", "Validation Gate"]
      }),
      check("governance.fallback-coverage", principles.includes("Fonte ausente") && principles.includes("Relatorio invalido"), {
        required: ["Fonte ausente", "Relatorio invalido"]
      })
    ];
  }

  validatePersistence() {
    const requiredDirectories = [
      "memory",
      "runtime-data",
      "memory/events",
      "runtime-data/events",
      "memory/decisions",
      "runtime-data/decisions",
      "memory/state-transitions",
      "runtime-data/state-transitions",
      "memory/runtime-validation",
      "runtime-data/runtime-validation"
    ];

    return requiredDirectories.map((directory) => {
      const fullPath = path.join(this.rootDir, directory);
      if (directory.endsWith("runtime-validation")) {
        ensureDirectory(fullPath);
      }

      return check(`persistence.${directory}`, fs.existsSync(fullPath), {
        path: fullPath,
        jsonFiles: listJsonFiles(fullPath).length
      });
    });
  }

  validateLifecycle() {
    const machine = new WorkflowStateMachine({
      workflow: "validation-workflow",
      project: "platform"
    });
    const queued = machine.transition(WORKFLOW_STATES.QUEUED, {
      reason: "validation lifecycle start",
      safetyMode: "validation",
      source: "runtime-integration-validator"
    });
    const invalid = machine.transition(WORKFLOW_STATES.BLOCKED, {
      source: "runtime-integration-validator"
    });
    const completed = machine.transition(WORKFLOW_STATES.COMPLETED, {
      reason: "validation lifecycle complete",
      safetyMode: "validation",
      source: "runtime-integration-validator"
    });

    return [
      check("lifecycle.valid-transition", queued.accepted && completed.accepted, {
        finalState: machine.state,
        acceptedTransitions: machine.history.length - 1
      }),
      check("lifecycle.invalid-transition-blocked", !invalid.accepted && machine.blockedTransitions.length === 1, {
        blockedTransitions: machine.blockedTransitions
      }),
      check("lifecycle.workflow-lifecycle-valid", machine.state === WORKFLOW_STATES.COMPLETED, {
        state: machine.state
      })
    ];
  }

  validateEventFlow() {
    const eventFiles = listJsonFiles(path.join(this.rootDir, "memory", "events"));
    const events = eventFiles
      .map((file) => {
        const read = readLatestSpecific(file.path);
        return read.ok ? read.data : null;
      })
      .filter(Boolean);
    const hasDecisionEvent = events.some((event) => event.type === EVENT_TYPES.DECISION_CREATED);
    const hasTransitionEvent = events.some((event) =>
      [
        EVENT_TYPES.WORKFLOW_PAUSED,
        EVENT_TYPES.WORKFLOW_REROUTED,
        EVENT_TYPES.WORKFLOW_THROTTLED,
        EVENT_TYPES.WORKFLOW_RECOVERING,
        EVENT_TYPES.ENFORCEMENT_APPLIED
      ].includes(event.type)
    );
    const bus = new RuntimeEventBus({ rootDir: this.rootDir, persistOnPublish: false });
    const correlationId = `validation-event-flow-${Date.now()}`;
    bus.publish({
      type: EVENT_TYPES.DECISION_CREATED,
      source: "runtime-integration-validator",
      workflowId: "validation-workflow",
      project: "platform",
      correlationId,
      safetyMode: "validation",
      payload: {
        validation: true
      }
    });
    bus.publish({
      type: EVENT_TYPES.WORKFLOW_THROTTLED,
      source: "runtime-integration-validator",
      workflowId: "validation-workflow",
      project: "platform",
      correlationId,
      safetyMode: "validation",
      payload: {
        validation: true
      }
    });
    const replayed = bus.replay({ correlationId, includePersisted: false });

    return [
      check("event-flow.decision-generates-event", hasDecisionEvent, {
        decisionEvents: events.filter((event) => event.type === EVENT_TYPES.DECISION_CREATED).length
      }),
      check("event-flow.transition-generates-event", hasTransitionEvent, {
        transitionEvents: events.filter((event) => event.type?.startsWith("workflow-") || event.type === EVENT_TYPES.ENFORCEMENT_APPLIED).length
      }),
      check("event-flow.replay-works", replayed.length === 2, {
        correlationId,
        replayed: replayed.map((event) => event.type)
      }),
      check("event-flow.correlation-preserved", replayed.every((event) => event.correlationId === correlationId), {
        correlationId
      })
    ];
  }

  validateFallbacks() {
    const tempRoot = path.join(
      this.rootDir,
      "runtime-data",
      "runtime-validation",
      `fallback-${timestampForFile(this.now)}`
    );
    ensureDirectory(path.join(tempRoot, "memory", "decisions"));
    fs.writeFileSync(path.join(tempRoot, "memory", "decisions", "invalid.json"), "{ invalid json", "utf8");

    const absentDecisionEngine = new RuntimeDecisionEngine(tempRoot).evaluate();
    const invalidDecisionSource = new StateTransitionCoordinator(tempRoot).consumeLatestDecisions();
    const invalidTransitionMachine = new WorkflowStateMachine({
      workflow: "fallback-validation",
      project: "platform"
    });
    const invalidTransition = invalidTransitionMachine.transition(WORKFLOW_STATES.BLOCKED, {
      source: "runtime-integration-validator"
    });
    const bus = new RuntimeEventBus({ rootDir: this.rootDir, persistOnPublish: false });
    bus.subscribe(EVENT_TYPES.WORKFLOW_QUEUED, () => {
      throw new Error("subscriber failure validation");
    }, { subscriptionId: "validation-failing-subscriber" });
    const publication = bus.publish({
      type: EVENT_TYPES.WORKFLOW_QUEUED,
      source: "runtime-integration-validator",
      workflowId: "fallback-validation",
      project: "platform",
      correlationId: "fallback-validation",
      payload: {},
      safetyMode: "validation"
    });

    return [
      check("fallback.absent-directory", absentDecisionEngine.fallback.safeMode, {
        status: absentDecisionEngine.status,
        missingSources: absentDecisionEngine.fallback.missingSources
      }),
      check("fallback.invalid-json", !invalidDecisionSource.available && invalidDecisionSource.readErrors.length === 1, {
        readErrors: invalidDecisionSource.readErrors
      }),
      check("fallback.failing-subscriber", publication.event.eventId && bus.deliveryErrors.length === 1, {
        deliveryErrors: bus.deliveryErrors
      }),
      check("fallback.invalid-transition", !invalidTransition.accepted, {
        errors: invalidTransition.event.errors
      })
    ];
  }

  calculateReadiness(checks) {
    const failedErrors = checks.filter((item) => !item.passed && item.severity === "error");
    if (failedErrors.length === 0) {
      return "fase-1-ready";
    }

    return "not-ready";
  }

  modulesValidated() {
    return {
      cognitive: ["predictive", "optimization", "enforcement", "decision-engine"],
      operational: ["queue", "router", "recovery", "state-machine", "transition-coordinator"],
      communication: ["event-bus", "replay", "subscribers", "event-persistence"],
      governance: ["governance-validator", "quality-gates", "fallback-coverage"],
      persistence: ["memory", "runtime-data", "events", "decisions", "transitions"]
    };
  }

  remainingRisks() {
    return [
      "Event Bus ainda e local ao processo.",
      "Queue, Router e Recovery ainda nao publicam eventos diretamente em todos os fluxos reais.",
      "Learning demo ainda nao persiste snapshot em memory/learning.",
      "Nao ha schema validator dedicado por tipo de evento.",
      "Nao ha registry unico de estado atual por workflow."
    ];
  }

  persist(report) {
    const runtimeDir = path.join(this.rootDir, "runtime-data", "runtime-validation");
    const memoryDir = path.join(this.rootDir, "memory", "runtime-validation");
    ensureDirectory(runtimeDir);
    ensureDirectory(memoryDir);

    const filename = `runtime-integration-validation-${timestampForFile(this.now)}.json`;
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

function readLatestSpecific(filePath) {
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

module.exports = {
  RuntimeIntegrationValidator
};
