const fs = require("node:fs");
const path = require("node:path");

const WORKFLOW_STATES = Object.freeze({
  PENDING: "pending",
  QUEUED: "queued",
  PROTECTED: "protected",
  THROTTLED: "throttled",
  PAUSED: "paused",
  HUMAN_REVIEW: "human-review",
  REROUTED: "rerouted",
  RETRYING: "retrying",
  RECOVERING: "recovering",
  COMPLETED: "completed",
  FAILED: "failed",
  BLOCKED: "blocked",
  QUARANTINED: "quarantined"
});

const VALID_TRANSITIONS = Object.freeze({
  [WORKFLOW_STATES.PENDING]: [WORKFLOW_STATES.QUEUED, WORKFLOW_STATES.BLOCKED],
  [WORKFLOW_STATES.QUEUED]: [
    WORKFLOW_STATES.PROTECTED,
    WORKFLOW_STATES.THROTTLED,
    WORKFLOW_STATES.PAUSED,
    WORKFLOW_STATES.HUMAN_REVIEW,
    WORKFLOW_STATES.REROUTED,
    WORKFLOW_STATES.RETRYING,
    WORKFLOW_STATES.RECOVERING,
    WORKFLOW_STATES.COMPLETED,
    WORKFLOW_STATES.FAILED,
    WORKFLOW_STATES.BLOCKED
  ],
  [WORKFLOW_STATES.PROTECTED]: [
    WORKFLOW_STATES.HUMAN_REVIEW,
    WORKFLOW_STATES.QUEUED,
    WORKFLOW_STATES.PAUSED,
    WORKFLOW_STATES.REROUTED,
    WORKFLOW_STATES.BLOCKED
  ],
  [WORKFLOW_STATES.THROTTLED]: [
    WORKFLOW_STATES.QUEUED,
    WORKFLOW_STATES.PAUSED,
    WORKFLOW_STATES.HUMAN_REVIEW,
    WORKFLOW_STATES.BLOCKED
  ],
  [WORKFLOW_STATES.PAUSED]: [
    WORKFLOW_STATES.HUMAN_REVIEW,
    WORKFLOW_STATES.QUEUED,
    WORKFLOW_STATES.REROUTED,
    WORKFLOW_STATES.RECOVERING,
    WORKFLOW_STATES.BLOCKED,
    WORKFLOW_STATES.QUARANTINED
  ],
  [WORKFLOW_STATES.HUMAN_REVIEW]: [
    WORKFLOW_STATES.QUEUED,
    WORKFLOW_STATES.PROTECTED,
    WORKFLOW_STATES.REROUTED,
    WORKFLOW_STATES.RECOVERING,
    WORKFLOW_STATES.BLOCKED,
    WORKFLOW_STATES.QUARANTINED
  ],
  [WORKFLOW_STATES.REROUTED]: [
    WORKFLOW_STATES.QUEUED,
    WORKFLOW_STATES.RETRYING,
    WORKFLOW_STATES.RECOVERING,
    WORKFLOW_STATES.COMPLETED,
    WORKFLOW_STATES.FAILED,
    WORKFLOW_STATES.BLOCKED
  ],
  [WORKFLOW_STATES.RETRYING]: [
    WORKFLOW_STATES.QUEUED,
    WORKFLOW_STATES.REROUTED,
    WORKFLOW_STATES.RECOVERING,
    WORKFLOW_STATES.COMPLETED,
    WORKFLOW_STATES.FAILED
  ],
  [WORKFLOW_STATES.RECOVERING]: [
    WORKFLOW_STATES.QUEUED,
    WORKFLOW_STATES.REROUTED,
    WORKFLOW_STATES.RETRYING,
    WORKFLOW_STATES.COMPLETED,
    WORKFLOW_STATES.FAILED,
    WORKFLOW_STATES.QUARANTINED
  ],
  [WORKFLOW_STATES.BLOCKED]: [
    WORKFLOW_STATES.HUMAN_REVIEW,
    WORKFLOW_STATES.RECOVERING,
    WORKFLOW_STATES.QUARANTINED,
    WORKFLOW_STATES.FAILED
  ],
  [WORKFLOW_STATES.QUARANTINED]: [WORKFLOW_STATES.HUMAN_REVIEW, WORKFLOW_STATES.FAILED],
  [WORKFLOW_STATES.COMPLETED]: [],
  [WORKFLOW_STATES.FAILED]: [
    WORKFLOW_STATES.RETRYING,
    WORKFLOW_STATES.RECOVERING,
    WORKFLOW_STATES.QUARANTINED
  ]
});

const CRITICAL_STATES = Object.freeze([
  WORKFLOW_STATES.PROTECTED,
  WORKFLOW_STATES.PAUSED,
  WORKFLOW_STATES.HUMAN_REVIEW,
  WORKFLOW_STATES.RECOVERING,
  WORKFLOW_STATES.BLOCKED,
  WORKFLOW_STATES.QUARANTINED
]);

const TEMPORARY_STATES = Object.freeze([
  WORKFLOW_STATES.PROTECTED,
  WORKFLOW_STATES.THROTTLED,
  WORKFLOW_STATES.PAUSED,
  WORKFLOW_STATES.HUMAN_REVIEW,
  WORKFLOW_STATES.RETRYING,
  WORKFLOW_STATES.RECOVERING
]);

const DECISION_STATE_MAP = Object.freeze({
  "pause-critical-workflow": WORKFLOW_STATES.PAUSED,
  "reroute-agent-worker": WORKFLOW_STATES.REROUTED,
  "reduce-concurrency": WORKFLOW_STATES.THROTTLED,
  "apply-throttling": WORKFLOW_STATES.THROTTLED,
  "protected-queue": WORKFLOW_STATES.PROTECTED,
  "retry-strategy": WORKFLOW_STATES.RETRYING,
  "preventive-recovery": WORKFLOW_STATES.RECOVERING,
  "human-gate": WORKFLOW_STATES.HUMAN_REVIEW,
  "normal-execution": WORKFLOW_STATES.QUEUED
});

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

function isValidState(state) {
  return Object.values(WORKFLOW_STATES).includes(state);
}

function getValidNextStates(state) {
  return isValidState(state) ? VALID_TRANSITIONS[state] || [] : [];
}

function canTransition(fromState, toState) {
  return getValidNextStates(fromState).includes(toState);
}

function isCriticalState(state) {
  return CRITICAL_STATES.includes(state);
}

function isTemporaryState(state) {
  return TEMPORARY_STATES.includes(state);
}

class WorkflowStateMachine {
  constructor({ workflow, project = "platform", initialState = WORKFLOW_STATES.PENDING, now = new Date() } = {}) {
    if (!workflow) {
      throw new Error("workflow is required");
    }
    if (!isValidState(initialState)) {
      throw new Error(`Invalid initial state: ${initialState}`);
    }

    this.machineId = `workflow_state_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    this.workflow = workflow;
    this.project = project;
    this.state = initialState;
    this.createdAt = now.toISOString();
    this.updatedAt = this.createdAt;
    this.history = [
      {
        transitionId: `transition_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
        from: null,
        to: initialState,
        accepted: true,
        reason: "workflow state machine initialized",
        safetyMode: "initial-state",
        expiresAt: null,
        source: "workflow-state-machine",
        transitionedAt: this.createdAt
      }
    ];
    this.blockedTransitions = [];
  }

  transition(toState, options = {}) {
    const attemptedAt = (options.now || new Date()).toISOString();
    const validation = this.validateTransition(this.state, toState, options);
    const event = {
      transitionId: `transition_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      from: this.state,
      to: toState,
      accepted: validation.valid,
      reason: options.reason || null,
      safetyMode: options.safetyMode || null,
      expiresAt: options.expiresAt || null,
      source: options.source || "manual",
      evidence: options.evidence || null,
      errors: validation.errors,
      transitionedAt: attemptedAt
    };

    if (!validation.valid) {
      this.blockedTransitions.push(event);
      return {
        accepted: false,
        state: this.state,
        event
      };
    }

    this.state = toState;
    this.updatedAt = attemptedAt;
    this.history.push(event);
    return {
      accepted: true,
      state: this.state,
      event
    };
  }

  transitionFromDecision(decision, options = {}) {
    const targetState = DECISION_STATE_MAP[decision.type] || null;
    if (!targetState) {
      return this.transition(this.state, {
        ...options,
        source: "runtime-decision-engine",
        reason: `No state mapping for decision type ${decision.type}`,
        evidence: decision
      });
    }

    return this.transition(targetState, {
      now: options.now,
      reason: decision.reason,
      safetyMode: decision.safetyMode,
      expiresAt: isTemporaryState(targetState) ? decision.expiresAt : null,
      source: "runtime-decision-engine",
      evidence: {
        decisionId: decision.decisionId,
        type: decision.type,
        severity: decision.severity,
        action: decision.action
      }
    });
  }

  validateTransition(fromState, toState, options = {}) {
    const errors = [];

    if (!isValidState(fromState)) {
      errors.push(`Invalid current state: ${fromState}`);
    }

    if (!isValidState(toState)) {
      errors.push(`Invalid target state: ${toState}`);
    }

    if (errors.length === 0 && !canTransition(fromState, toState)) {
      errors.push(`Invalid transition: ${fromState} -> ${toState}`);
    }

    if (isCriticalState(toState) && !options.reason) {
      errors.push(`reason is required for critical state: ${toState}`);
    }

    if (isCriticalState(toState) && !options.safetyMode) {
      errors.push(`safetyMode is required for critical state: ${toState}`);
    }

    if (isTemporaryState(toState) && !options.expiresAt) {
      errors.push(`expiresAt is required for temporary state: ${toState}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  snapshot() {
    return {
      machineId: this.machineId,
      workflow: this.workflow,
      project: this.project,
      state: this.state,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      history: this.history,
      blockedTransitions: this.blockedTransitions
    };
  }

  persist(rootDir = process.cwd()) {
    const runtimeDir = path.join(rootDir, "runtime-data", "state-machine");
    const memoryDir = path.join(rootDir, "memory", "state-machine");
    ensureDirectory(runtimeDir);
    ensureDirectory(memoryDir);

    const filename = `workflow-state-${timestampForFile()}-${this.workflow}.json`;
    const report = this.snapshot();
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
  CRITICAL_STATES,
  DECISION_STATE_MAP,
  TEMPORARY_STATES,
  VALID_TRANSITIONS,
  WORKFLOW_STATES,
  WorkflowStateMachine,
  canTransition,
  getValidNextStates,
  isCriticalState,
  isTemporaryState,
  isValidState
};
