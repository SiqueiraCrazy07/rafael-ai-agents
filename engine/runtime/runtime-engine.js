const { CheckpointManager } = require("../checkpoints/checkpoint-manager");
const { EventBus, EVENT_TYPES } = require("../events/event-bus");
const { ExecutionManager } = require("../executions/execution-manager");
const { ExecutionHistoryManager } = require("../history/execution-history-manager");
const { assertValidTransition, STATES } = require("../state/state-machine");
const { FileRuntimeStorage } = require("../storage/file-runtime-storage");
const { RuntimeTelemetry } = require("../telemetry/runtime-telemetry");

class RuntimeEngine {
  constructor({ storage } = {}) {
    this.storage = storage || new FileRuntimeStorage();
    this.eventBus = new EventBus({ storage: this.storage });
    this.executions = new ExecutionManager({ storage: this.storage });
    this.checkpoints = new CheckpointManager({ storage: this.storage });
    this.history = new ExecutionHistoryManager({ storage: this.storage });
    this.telemetry = new RuntimeTelemetry();
  }

  async startExecution(input) {
    const execution = this.executions.createExecutionObject(input);

    this.executions.addLog(execution, {
      event: EVENT_TYPES.EXECUTION_STARTED,
      message: `Execution started for workflow ${execution.workflow}`
    });

    await this.executions.persist(execution);
    await this.eventBus.emit(EVENT_TYPES.EXECUTION_STARTED, {
      executionId: execution.executionId,
      project: execution.project,
      workflow: execution.workflow,
      agents: execution.agents,
      status: execution.status
    });

    return execution;
  }

  async transition(execution, nextStatus, metadata = {}) {
    const previousStatus = execution.status;
    assertValidTransition(previousStatus, nextStatus);

    execution.status = nextStatus;
    this.executions.addLog(execution, {
      event: EVENT_TYPES.STATE_TRANSITION,
      message: `State transitioned: ${previousStatus} -> ${nextStatus}`,
      metadata: {
        previousStatus,
        nextStatus,
        ...metadata
      }
    });

    await this.executions.persist(execution);
    await this.eventBus.emit(EVENT_TYPES.STATE_TRANSITION, {
      executionId: execution.executionId,
      project: execution.project,
      workflow: execution.workflow,
      previousStatus,
      nextStatus,
      status: execution.status,
      metadata
    });

    return execution;
  }

  async createCheckpoint(execution, checkpointInput) {
    const checkpoint = await this.checkpoints.saveCheckpoint(execution, checkpointInput);

    this.executions.addLog(execution, {
      event: EVENT_TYPES.CHECKPOINT_CREATED,
      message: `Checkpoint created: ${checkpoint.checkpointId}`,
      metadata: {
        checkpointId: checkpoint.checkpointId
      }
    });

    await this.executions.persist(execution);
    await this.eventBus.emit(EVENT_TYPES.CHECKPOINT_CREATED, {
      executionId: execution.executionId,
      project: execution.project,
      workflow: execution.workflow,
      checkpointId: checkpoint.checkpointId,
      status: execution.status
    });

    return checkpoint;
  }

  async startRetry(execution, reason = "retry requested") {
    if (execution.retries.count >= execution.retries.max) {
      throw new Error("Retry limit exceeded");
    }

    await this.transition(execution, STATES.RETRYING, { reason });
    execution.retries.count += 1;

    this.executions.addLog(execution, {
      event: EVENT_TYPES.RETRY_STARTED,
      message: `Retry started: ${execution.retries.count}/${execution.retries.max}`,
      metadata: { reason }
    });

    await this.executions.persist(execution);
    await this.eventBus.emit(EVENT_TYPES.RETRY_STARTED, {
      executionId: execution.executionId,
      project: execution.project,
      workflow: execution.workflow,
      attempt: execution.retries.count,
      maxAttempts: execution.retries.max,
      reason
    });

    return execution;
  }

  async rollback(execution, reason = "rollback requested") {
    await this.transition(execution, STATES.ROLLED_BACK, { reason });

    await this.eventBus.emit(EVENT_TYPES.ROLLBACK_TRIGGERED, {
      executionId: execution.executionId,
      project: execution.project,
      workflow: execution.workflow,
      reason,
      status: execution.status
    });

    return this.finishExecution(execution, {
      status: STATES.ROLLED_BACK,
      eventType: EVENT_TYPES.ROLLBACK_TRIGGERED,
      message: reason
    });
  }

  async completeExecution(execution, outputs = []) {
    if (execution.status !== STATES.COMPLETED) {
      await this.transition(execution, STATES.COMPLETED, { reason: "completion requested" });
    }

    execution.completedAt = new Date().toISOString();
    execution.outputs.push(...outputs);

    return this.finishExecution(execution, {
      status: STATES.COMPLETED,
      eventType: EVENT_TYPES.EXECUTION_COMPLETED,
      message: "Execution completed"
    });
  }

  async failExecution(execution, error) {
    if (execution.status !== STATES.FAILED) {
      await this.transition(execution, STATES.FAILED, { error: error.message || String(error) });
    }

    execution.completedAt = new Date().toISOString();

    return this.finishExecution(execution, {
      status: STATES.FAILED,
      eventType: EVENT_TYPES.EXECUTION_FAILED,
      message: error.message || String(error)
    });
  }

  async finishExecution(execution, { eventType, message }) {
    this.executions.addLog(execution, {
      event: eventType,
      level: eventType === EVENT_TYPES.EXECUTION_FAILED ? "error" : "info",
      message
    });

    await this.executions.persist(execution);
    const history = await this.history.saveHistory(execution);
    const telemetry = this.telemetry.summarizeExecution(execution);

    await this.eventBus.emit(eventType, {
      executionId: execution.executionId,
      project: execution.project,
      workflow: execution.workflow,
      status: execution.status,
      telemetry
    });

    return {
      execution,
      history,
      telemetry
    };
  }
}

module.exports = {
  RuntimeEngine
};
