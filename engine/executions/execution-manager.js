const crypto = require("node:crypto");
const { STATES, isValidState } = require("../state/state-machine");

function createExecutionId() {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  const suffix = crypto.randomBytes(4).toString("hex");
  return `exec_${timestamp}_${suffix}`;
}

class ExecutionManager {
  constructor({ storage } = {}) {
    this.storage = storage;
  }

  createExecutionObject(input) {
    if (!input.workflow) {
      throw new Error("workflow is required");
    }

    if (!input.project) {
      throw new Error("project is required");
    }

    const status = input.status || STATES.QUEUED;
    if (!isValidState(status)) {
      throw new Error(`Invalid execution status: ${status}`);
    }

    return {
      executionId: input.executionId || createExecutionId(),
      workflow: input.workflow,
      project: input.project,
      agents: input.agents || [],
      status,
      startedAt: new Date().toISOString(),
      completedAt: null,
      retries: {
        count: input.retries?.count || 0,
        max: input.retries?.max ?? 3
      },
      logs: [],
      checkpoints: [],
      decisions: input.decisions || [],
      outputs: input.outputs || [],
      risks: input.risks || [],
      metadata: {
        createdBy: input.createdBy || "runtime-engine-v1",
        priority: input.priority || "p2",
        criticidade: input.criticidade || "medium",
        ...input.metadata
      }
    };
  }

  addLog(execution, { level = "info", event, message, agent = null, metadata = {} }) {
    execution.logs.push({
      timestamp: new Date().toISOString(),
      level,
      event,
      agent,
      message,
      metadata
    });
  }

  markCompleted(execution, outputs = []) {
    execution.status = STATES.COMPLETED;
    execution.completedAt = new Date().toISOString();
    execution.outputs.push(...outputs);
    return execution;
  }

  markFailed(execution, error) {
    execution.status = STATES.FAILED;
    execution.completedAt = new Date().toISOString();
    this.addLog(execution, {
      level: "error",
      event: "execution_failed",
      message: error.message || String(error)
    });
    return execution;
  }

  async persist(execution) {
    if (!this.storage) {
      return execution;
    }

    return this.storage.saveExecution(execution);
  }
}

module.exports = {
  ExecutionManager,
  createExecutionId
};
