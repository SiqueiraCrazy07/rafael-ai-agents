const { BaseRepository } = require('./base-repository');

function normalizeWorkflowState(item) {
  const state = item.data || {};

  return {
    machineId: state.machineId || state.stateMachineId || item.fileName,
    workflowId: state.workflowId || state.workflow || state.workflowName || null,
    project: state.project || null,
    state: state.state || state.currentState || state.current || null,
    history: state.history || [],
    blockedTransitions: state.blockedTransitions || [],
    fallback: state.fallback || null,
    sourcePath: item.sourcePath,
    fileName: item.fileName,
    timestamp: state.timestamp || item.updatedAt
  };
}

class WorkflowStateRepository extends BaseRepository {
  constructor(adapter) {
    super({
      adapter,
      collection: 'workflow_state',
      sourceDirs: ['memory/state-machine', 'runtime-data/state-machine'],
      normalizer: normalizeWorkflowState
    });
  }

  findByWorkflowId(workflowId) {
    const listed = this.list({ limit: 10000 });
    const record = listed.records.find((item) => item.workflowId === workflowId);

    return {
      available: Boolean(record),
      workflowId,
      record: record || null,
      readErrors: listed.readErrors,
      fallback: record ? null : {
        safeMode: true,
        reason: listed.available ? 'workflow-state-not-found' : 'database-unavailable'
      }
    };
  }
}

module.exports = {
  WorkflowStateRepository,
  normalizeWorkflowState
};
