const { createDashboardDataSource } = require('../data/dashboard-data-source');

function pickLimit(req, defaultLimit = 20) {
  return (req.validatedQuery && req.validatedQuery.limit) || defaultLimit;
}

function pickOffset(req) {
  return (req.validatedQuery && req.validatedQuery.offset) || 0;
}

function getDataSource(req) {
  if (req.app && req.app.locals && req.app.locals.dashboardDataSource) {
    return req.app.locals.dashboardDataSource;
  }

  return createDashboardDataSource();
}

function dashboardMeta(req, query = {}) {
  return {
    limit: query.limit || null,
    offset: query.offset || null,
    filters: {
      workflowId: query.workflowId || null,
      correlationId: query.correlationId || null
    }
  };
}

function sendDashboardResult(req, res, result, meta = {}) {
  return res.safe(result, {
    meta,
    fallback: result.fallback || null
  });
}

function getDashboardSummary(req, res) {
  return sendDashboardResult(req, res, getDataSource(req).readSummary());
}

function getDashboardMetrics(req, res) {
  return sendDashboardResult(req, res, getDataSource(req).readMetrics());
}

function getDashboardTimelines(req, res) {
  const query = {
    ...(req.validatedQuery || {}),
    limit: pickLimit(req, 20),
    offset: pickOffset(req)
  };
  return sendDashboardResult(req, res, getDataSource(req).readTimelines(query), dashboardMeta(req, query));
}

function getDashboardTraces(req, res) {
  const query = {
    ...(req.validatedQuery || {}),
    limit: pickLimit(req, 20),
    offset: pickOffset(req)
  };
  return sendDashboardResult(req, res, getDataSource(req).readTraces(query), dashboardMeta(req, query));
}

function getProblematicWorkflows(req, res) {
  const query = {
    ...(req.validatedQuery || {}),
    limit: pickLimit(req, 20),
    offset: pickOffset(req)
  };
  return sendDashboardResult(req, res, getDataSource(req).readProblematicWorkflows(query), dashboardMeta(req, query));
}

function getWorkerHealth(req, res) {
  return sendDashboardResult(req, res, getDataSource(req).readWorkerHealth());
}

module.exports = {
  getDashboardMetrics,
  getDashboardSummary,
  getDashboardTimelines,
  getDashboardTraces,
  getProblematicWorkflows,
  getWorkerHealth
};
