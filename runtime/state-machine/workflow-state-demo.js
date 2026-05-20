const fs = require("node:fs");
const path = require("node:path");

const {
  VALID_TRANSITIONS,
  WORKFLOW_STATES,
  WorkflowStateMachine
} = require("./workflow-state-machine");
const { StateTransitionCoordinator } = require("./state-transition-coordinator");
const { EVENT_TYPES, RuntimeEventBus } = require("../event-bus/runtime-event-bus");

function readLatestJson(directory) {
  if (!fs.existsSync(directory)) {
    return {
      available: false,
      path: null,
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

function runWorkflowStateDemo() {
  const eventBus = new RuntimeEventBus();
  const decisionSource = readLatestJson(path.join(process.cwd(), "memory", "decisions"));
  const decisions = decisionSource.data?.decisions || [];
  const machine = new WorkflowStateMachine({
    workflow: "runtime-v1-rollback-demo",
    project: "platform"
  });

  const transitionResults = [];
  transitionResults.push(
    machine.transition(WORKFLOW_STATES.QUEUED, {
      reason: "workflow accepted by runtime state demo",
      safetyMode: "normal-runtime",
      source: "runtime:state-demo"
    })
  );
  transitionResults.push(
    machine.transition(WORKFLOW_STATES.BLOCKED, {
      source: "runtime:state-demo"
    })
  );

  const preferredDecisionOrder = [
    "protected-queue",
    "human-gate",
    "reroute-agent-worker",
    "preventive-recovery"
  ];

  for (const decisionType of preferredDecisionOrder) {
    const decision = decisions.find((candidate) => candidate.type === decisionType);
    if (decision) {
      transitionResults.push(machine.transitionFromDecision(decision));
    }
  }

  transitionResults.push(
    machine.transition(WORKFLOW_STATES.COMPLETED, {
      reason: "demo completes workflow after preventive recovery path",
      safetyMode: "normal-runtime",
      source: "runtime:state-demo"
    })
  );
  transitionResults.push(
    machine.transition(WORKFLOW_STATES.FAILED, {
      reason: "blocked transition demo after completed attempt",
      safetyMode: "demo-invalid-transition",
      source: "runtime:state-demo"
    })
  );

  const persistence = machine.persist();
  const stateEventMap = {
    [WORKFLOW_STATES.QUEUED]: EVENT_TYPES.WORKFLOW_QUEUED,
    [WORKFLOW_STATES.PAUSED]: EVENT_TYPES.WORKFLOW_PAUSED,
    [WORKFLOW_STATES.REROUTED]: EVENT_TYPES.WORKFLOW_REROUTED,
    [WORKFLOW_STATES.THROTTLED]: EVENT_TYPES.WORKFLOW_THROTTLED,
    [WORKFLOW_STATES.RECOVERING]: EVENT_TYPES.WORKFLOW_RECOVERING,
    [WORKFLOW_STATES.COMPLETED]: EVENT_TYPES.WORKFLOW_COMPLETED,
    [WORKFLOW_STATES.FAILED]: EVENT_TYPES.WORKFLOW_FAILED,
    [WORKFLOW_STATES.QUARANTINED]: EVENT_TYPES.WORKFLOW_QUARANTINED
  };
  const stateEvents = machine.history.map((event) => {
    const eventType =
      event.from === null ? EVENT_TYPES.WORKFLOW_CREATED : stateEventMap[event.to] || null;
    if (!eventType) {
      return null;
    }

    return eventBus.publish({
      type: eventType,
      source: "workflow-state-machine",
      workflowId: machine.workflow,
      project: machine.project,
      correlationId: machine.machineId,
      safetyMode: event.safetyMode || "state-transition",
      payload: {
        machineId: machine.machineId,
        from: event.from,
        to: event.to,
        reason: event.reason,
        evidence: event.evidence
      }
    });
  }).filter(Boolean);
  const coordinator = new StateTransitionCoordinator();
  const coordinationReport = coordinator.coordinate({ decisionSource });
  const coordinationPersistence = coordinator.persist(coordinationReport);

  console.log(
    JSON.stringify(
      {
        machine: {
          machineId: machine.machineId,
          workflow: machine.workflow,
          project: machine.project,
          currentState: machine.state
        },
        decisionIntegration: {
          available: decisionSource.available,
          sourcePath: decisionSource.path,
          readErrors: decisionSource.readErrors,
          consumedDecisionTypes: transitionResults
            .map((result) => result.event.evidence?.type)
            .filter(Boolean)
        },
        states: Object.values(WORKFLOW_STATES),
        validTransitions: VALID_TRANSITIONS,
        acceptedTransitions: machine.history.slice(1).map((event) => ({
          from: event.from,
          to: event.to,
          source: event.source,
          reason: event.reason,
          safetyMode: event.safetyMode,
          expiresAt: event.expiresAt
        })),
        blockedTransitions: machine.blockedTransitions.map((event) => ({
          from: event.from,
          to: event.to,
          source: event.source,
          errors: event.errors
        })),
        fallback: {
          safeMode: true,
          behavior: decisionSource.available
            ? "state transitions consume declarative decisions when valid"
            : "state demo uses manual queued transition and records missing decision source"
        },
        transitionCoordinator: {
          transitionReportId: coordinationReport.transitionReportId,
          status: coordinationReport.status,
          applied: coordinationReport.appliedTransitions.length,
          blocked: coordinationReport.blockedTransitions.length,
          ignored: coordinationReport.ignoredDecisions.length,
          persistence: coordinationPersistence
        },
        events: {
          published: stateEvents.map((publication) => ({
            eventId: publication.event.eventId,
            type: publication.event.type,
            workflowId: publication.event.workflowId,
            persistence: publication.persistence
          }))
        },
        persistence
      },
      null,
      2
    )
  );
}

runWorkflowStateDemo();
