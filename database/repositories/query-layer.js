const { readJsonHistory } = require('./json-source-reader');

function jsonFallback(repository, query = {}) {
  const readErrors = [];
  const records = [];

  for (const sourceDir of repository.sourceDirs) {
    const history = readJsonHistory(sourceDir, query.limit || 50);
    readErrors.push(...history.readErrors);

    for (const item of history.items || []) {
      try {
        records.push(repository.normalizer(item));
      } catch (error) {
        readErrors.push({
          sourcePath: item.sourcePath,
          error: error.message
        });
      }
    }
  }

  return {
    source: 'json-fallback',
    available: records.length > 0,
    collection: repository.collection,
    total: records.length,
    records: records.slice(query.offset || 0, (query.offset || 0) + (query.limit || 50)),
    readErrors,
    fallback: {
      safeMode: true,
      reason: 'database-unavailable-used-json-source'
    }
  };
}

function listWithFallback(repository, query = {}) {
  const listed = repository.list(query);

  if (listed.available) {
    return {
      source: 'database',
      ...listed
    };
  }

  return jsonFallback(repository, query);
}

function createQueryLayer(repositories) {
  return {
    listEvents(query = {}) {
      return listWithFallback(repositories.events, query);
    },
    listDecisions(query = {}) {
      return listWithFallback(repositories.decisions, query);
    },
    listTransitions(query = {}) {
      return listWithFallback(repositories.transitions, query);
    },
    getWorkflowState(workflowId) {
      const result = repositories.workflowState.findByWorkflowId(workflowId);

      if (result.available) {
        return {
          source: 'database',
          ...result
        };
      }

      const fallback = jsonFallback(repositories.workflowState, { limit: 1000 });
      const record = fallback.records.find((item) => item.workflowId === workflowId);

      return {
        source: 'json-fallback',
        available: Boolean(record),
        workflowId,
        record: record || null,
        readErrors: fallback.readErrors,
        fallback: record ? fallback.fallback : {
          safeMode: true,
          reason: 'workflow-state-not-found'
        }
      };
    },
    listAuditTrail(query = {}) {
      return listWithFallback(repositories.apiGovernanceAudit, query);
    },
    listRuntimeValidation(query = {}) {
      return listWithFallback(repositories.runtimeValidation, query);
    },
    listWorkflowStates(query = {}) {
      return listWithFallback(repositories.workflowState, query);
    },
    getQueueStatus() {
      const result = repositories.queue.latest();

      if (result.available) {
        return {
          source: 'database',
          available: true,
          collection: repositories.queue.collection,
          sourcePath: result.sourcePath,
          total: result.total,
          record: result.record,
          records: [result.record],
          readErrors: result.readErrors,
          fallback: null
        };
      }

      return jsonFallback(repositories.queue, { limit: 1 });
    }
  };
}

module.exports = {
  createQueryLayer,
  jsonFallback,
  listWithFallback
};
