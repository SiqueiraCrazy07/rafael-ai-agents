const { API_CONTRACT } = require('../contracts/runtime-contracts');
const { createRuntimeDataSource } = require('../data/runtime-data-source');

function pickLimit(req, defaultLimit = 20) {
  return (req.validatedQuery && req.validatedQuery.limit) || defaultLimit;
}

function pickOffset(req) {
  return (req.validatedQuery && req.validatedQuery.offset) || 0;
}

function getDataSource(req) {
  if (req.app && req.app.locals && req.app.locals.runtimeDataSource) {
    return req.app.locals.runtimeDataSource;
  }

  return createRuntimeDataSource();
}

function getEnvironmentFields(req) {
  const api = req.app && req.app.locals && req.app.locals.api;
  const environment = api && api.environment ? api.environment.responseFields : null;

  return environment || {
    runtimeFlags: null,
    databaseReadEnabled: null,
    jsonFallbackEnabled: null,
    safeModeEnabled: null
  };
}

function getHealth(req, res) {
  return res.safe({
    service: 'rafael-ai-agents-api',
    status: 'healthy',
    phase: 'phase-2',
    contract: API_CONTRACT,
    ...getEnvironmentFields(req),
    safety: {
      readonly: getEnvironmentFields(req).runtimeFlags
        ? getEnvironmentFields(req).runtimeFlags.API_READONLY_MODE
        : true,
      destructiveActions: false,
      runtimeChanged: false,
      workflowsChanged: false
    }
  });
}

function getRuntimeStatus(req, res) {
  return res.safe(getDataSource(req).readRuntimeStatus());
}

function getQueueStatus(req, res) {
  const result = getDataSource(req).readQueue();
  return res.safe(result, {
    fallback: result.fallback || null
  });
}

function getEventHistory(req, res) {
  const limit = pickLimit(req, 20);
  const offset = pickOffset(req);
  const filters = req.validatedQuery || {};
  const result = getDataSource(req).readEvents({
    ...filters,
    limit,
    offset
  });

  return res.safe({
    ...result,
    returned: result.returned,
    events: result.events,
    readErrors: result.readErrors
  }, {
    meta: {
      limit,
      offset,
      filters: {
        eventType: filters.eventType || null,
        workflowId: filters.workflowId || null,
        correlationId: filters.correlationId || null
      }
    },
    fallback: result.fallback
  });
}

function getDecisionHistory(req, res) {
  const limit = pickLimit(req, 20);
  const offset = pickOffset(req);
  const filters = req.validatedQuery || {};
  const result = getDataSource(req).readDecisions({
    ...filters,
    limit,
    offset
  });

  return res.safe({
    ...result,
    returned: result.returned,
    reports: result.reports,
    readErrors: result.readErrors
  }, {
    meta: {
      limit,
      offset,
      filters: {
        workflowId: filters.workflowId || null,
        correlationId: filters.correlationId || null
      }
    },
    fallback: result.fallback
  });
}

function getValidationStatus(req, res) {
  const result = getDataSource(req).readValidation();

  return res.safe(result, {
    fallback: result.fallback || null
  });
}

module.exports = {
  getDecisionHistory,
  getEventHistory,
  getHealth,
  getQueueStatus,
  getRuntimeStatus,
  getValidationStatus
};
