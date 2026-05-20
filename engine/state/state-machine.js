const STATES = Object.freeze({
  QUEUED: "queued",
  ROUTED: "routed",
  RUNNING: "running",
  WAITING_INPUT: "waiting_input",
  BLOCKED: "blocked",
  RETRYING: "retrying",
  VALIDATED: "validated",
  COMPLETED: "completed",
  FAILED: "failed",
  ROLLED_BACK: "rolled_back"
});

const VALID_TRANSITIONS = Object.freeze({
  [STATES.QUEUED]: [STATES.ROUTED],
  [STATES.ROUTED]: [STATES.RUNNING],
  [STATES.RUNNING]: [
    STATES.WAITING_INPUT,
    STATES.BLOCKED,
    STATES.FAILED,
    STATES.VALIDATED,
    STATES.COMPLETED
  ],
  [STATES.WAITING_INPUT]: [STATES.RUNNING, STATES.BLOCKED],
  [STATES.BLOCKED]: [STATES.WAITING_INPUT, STATES.FAILED, STATES.ROLLED_BACK],
  [STATES.FAILED]: [STATES.RETRYING, STATES.ROLLED_BACK],
  [STATES.RETRYING]: [STATES.RUNNING, STATES.FAILED],
  [STATES.VALIDATED]: [STATES.COMPLETED, STATES.RUNNING],
  [STATES.COMPLETED]: [],
  [STATES.ROLLED_BACK]: []
});

function isValidState(status) {
  return Object.values(STATES).includes(status);
}

function getValidNextStates(status) {
  if (!isValidState(status)) {
    return [];
  }

  return VALID_TRANSITIONS[status] || [];
}

function canTransition(fromStatus, toStatus) {
  return getValidNextStates(fromStatus).includes(toStatus);
}

function assertValidTransition(fromStatus, toStatus) {
  if (!isValidState(fromStatus)) {
    throw new Error(`Invalid current state: ${fromStatus}`);
  }

  if (!isValidState(toStatus)) {
    throw new Error(`Invalid next state: ${toStatus}`);
  }

  if (!canTransition(fromStatus, toStatus)) {
    throw new Error(`Invalid state transition: ${fromStatus} -> ${toStatus}`);
  }
}

module.exports = {
  STATES,
  VALID_TRANSITIONS,
  assertValidTransition,
  canTransition,
  getValidNextStates,
  isValidState
};
