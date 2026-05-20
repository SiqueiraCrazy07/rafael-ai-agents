const fs = require("node:fs");
const path = require("node:path");

const {
  DECISION_STATE_MAP,
  WORKFLOW_STATES,
  WorkflowStateMachine
} = require("./workflow-state-machine");
const { EVENT_TYPES, RuntimeEventBus } = require("../event-bus/runtime-event-bus");

const DECISION_WORKFLOW_FALLBACK = "runtime-operational-workflow";

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

function readLatestJson(directory) {
  if (!fs.existsSync(directory)) {
    return {
      available: false,
      sourcePath: null,
      data: null,
      readErrors: []
    };
  }

  const readErrors = [];
  const files = fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const fullPath = path.join(directory, file);
      return {
        path: fullPath,
        mtimeMs: fs.statSync(fullPath).mtimeMs
      };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs);

  for (const file of files) {
    try {
      return {
        available: true,
        sourcePath: file.path,
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
    sourcePath: null,
    data: null,
    readErrors
  };
}

function workflowFromDecision(decision) {
  return (
    decision.evidence?.workflow ||
    decision.evidence?.guardedWorkflows?.[0]?.workflow ||
    decision.evidence?.gates?.find((gate) => gate.workflow)?.workflow ||
    DECISION_WORKFLOW_FALLBACK
  );
}

class StateTransitionCoordinator {
  constructor(rootDir = process.cwd(), options = {}) {
    this.rootDir = rootDir;
    this.now = options.now || new Date();
    this.eventBus = options.eventBus || new RuntimeEventBus({ rootDir });
  }

  consumeLatestDecisions() {
    return readLatestJson(path.join(this.rootDir, "memory", "decisions"));
  }

  coordinate(options = {}) {
    const decisionSource = options.decisionSource || this.consumeLatestDecisions();
    const decisions = Array.isArray(decisionSource.data?.decisions) ? decisionSource.data.decisions : [];
    const appliedTransitions = [];
    const blockedTransitions = [];
    const ignoredDecisions = [];
    const machines = [];
    const publishedEvents = [];

    for (const decision of decisions) {
      const targetState = DECISION_STATE_MAP[decision.type] || null;
      if (!targetState) {
        ignoredDecisions.push({
          decisionId: decision.decisionId,
          type: decision.type,
          reason: "decision type has no workflow state mapping"
        });
        continue;
      }

      const workflow = workflowFromDecision(decision);
      const machine = new WorkflowStateMachine({
        workflow,
        project: "platform",
        now: this.now
      });

      const queued = machine.transition(WORKFLOW_STATES.QUEUED, {
        now: this.now,
        reason: "state transition coordinator accepted decision for evaluation",
        safetyMode: "coordinator-bootstrap",
        source: "state-transition-coordinator",
        evidence: {
          decisionReportId: decisionSource.data?.decisionReportId || null,
          decisionId: decision.decisionId
        }
      });
      const transition = machine.transitionFromDecision(decision, {
        now: this.now
      });

      if (queued.accepted && transition.accepted) {
        const eventPublication = this.publishTransitionEvent({
          decision,
          workflow,
          transition: transition.event,
          decisionReportId: decisionSource.data?.decisionReportId || null
        });
        if (eventPublication) {
          publishedEvents.push({
            eventId: eventPublication.event.eventId,
            type: eventPublication.event.type,
            workflowId: eventPublication.event.workflowId,
            persistence: eventPublication.persistence
          });
        }

        appliedTransitions.push({
          decisionId: decision.decisionId,
          decisionType: decision.type,
          workflow,
          from: transition.event.from,
          to: transition.event.to,
          source: transition.event.source,
          evidence: transition.event.evidence,
          reason: transition.event.reason,
          safetyMode: transition.event.safetyMode,
          expiresAt: transition.event.expiresAt
        });
      }

      for (const blocked of machine.blockedTransitions) {
        blockedTransitions.push({
          decisionId: decision.decisionId,
          decisionType: decision.type,
          workflow,
          from: blocked.from,
          to: blocked.to,
          source: blocked.source,
          evidence: blocked.evidence,
          reason: blocked.reason,
          safetyMode: blocked.safetyMode,
          errors: blocked.errors
        });
      }

      machines.push(machine.snapshot());
    }

    const missingDecisionSource = !decisionSource.available;
    const emptyDecisionSet = decisionSource.available && decisions.length === 0;
    const report = {
      transitionReportId: `state_transition_report_${Date.now()}`,
      generatedAt: this.now.toISOString(),
      status:
        appliedTransitions.length > 0
          ? "state_transitions_applied"
          : "no_state_transitions_applied",
      safety: {
        productionChanged: false,
        destructiveActions: false,
        appliesRuntimePlanOnly: true
      },
      decisionSource: {
        available: decisionSource.available,
        sourcePath: decisionSource.sourcePath,
        decisionReportId: decisionSource.data?.decisionReportId || null,
        readErrors: decisionSource.readErrors
      },
      consumedDecisions: decisions.map((decision) => ({
        decisionId: decision.decisionId,
        type: decision.type,
        severity: decision.severity,
        targetState: DECISION_STATE_MAP[decision.type] || null
      })),
      appliedTransitions,
      blockedTransitions,
      ignoredDecisions,
      publishedEvents,
      machines,
      fallback: {
        safeMode: true,
        missingDecisionSource,
        emptyDecisionSet,
        behavior: missingDecisionSource
          ? "no transitions applied because memory/decisions has no readable report"
          : "only valid mapped transitions are applied; invalid transitions are recorded without changing state"
      }
    };

    return report;
  }

  publishTransitionEvent({ decision, workflow, transition, decisionReportId }) {
    const eventTypeByState = {
      [WORKFLOW_STATES.PAUSED]: EVENT_TYPES.WORKFLOW_PAUSED,
      [WORKFLOW_STATES.REROUTED]: EVENT_TYPES.WORKFLOW_REROUTED,
      [WORKFLOW_STATES.THROTTLED]: EVENT_TYPES.WORKFLOW_THROTTLED,
      [WORKFLOW_STATES.RECOVERING]: EVENT_TYPES.WORKFLOW_RECOVERING,
      [WORKFLOW_STATES.PROTECTED]: EVENT_TYPES.ENFORCEMENT_APPLIED,
      [WORKFLOW_STATES.RETRYING]: EVENT_TYPES.ENFORCEMENT_APPLIED,
      [WORKFLOW_STATES.HUMAN_REVIEW]: EVENT_TYPES.ENFORCEMENT_APPLIED,
      [WORKFLOW_STATES.QUARANTINED]: EVENT_TYPES.WORKFLOW_QUARANTINED,
      [WORKFLOW_STATES.COMPLETED]: EVENT_TYPES.WORKFLOW_COMPLETED,
      [WORKFLOW_STATES.FAILED]: EVENT_TYPES.WORKFLOW_FAILED
    };
    const eventType = eventTypeByState[transition.to] || null;
    if (!eventType) {
      return null;
    }

    return this.eventBus.publish({
      type: eventType,
      source: "state-transition-coordinator",
      workflowId: workflow,
      project: "platform",
      correlationId: decisionReportId || decision.decisionId,
      safetyMode: transition.safetyMode || decision.safetyMode,
      payload: {
        decisionId: decision.decisionId,
        decisionType: decision.type,
        from: transition.from,
        to: transition.to,
        reason: transition.reason,
        evidence: transition.evidence
      }
    });
  }

  persist(report) {
    const runtimeDir = path.join(this.rootDir, "runtime-data", "state-transitions");
    const memoryDir = path.join(this.rootDir, "memory", "state-transitions");
    ensureDirectory(runtimeDir);
    ensureDirectory(memoryDir);

    const filename = `state-transitions-${timestampForFile(this.now)}.json`;
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
  StateTransitionCoordinator,
  readLatestJson
};
