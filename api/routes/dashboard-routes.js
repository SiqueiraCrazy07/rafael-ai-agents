const {
  getDashboardMetrics,
  getDashboardSummary,
  getDashboardTimelines,
  getDashboardTraces,
  getProblematicWorkflows,
  getWorkerHealth
} = require('../controllers/dashboard-controller');
const { schemaValidationMiddleware } = require('../middleware/schema-validation');
const { chain } = require('./runtime-routes');

function validate(querySchema, responseSchema, handler) {
  return chain(schemaValidationMiddleware({ querySchema, responseSchema }), handler);
}

function createDashboardRoutes(expressModule) {
  const router = expressModule.Router();

  router.get('/dashboard/summary', validate('empty', 'dashboardSummary', getDashboardSummary));
  router.get('/dashboard/metrics', validate('empty', 'dashboardMetrics', getDashboardMetrics));
  router.get('/dashboard/timelines', validate('dashboardHistory', 'dashboardTimelines', getDashboardTimelines));
  router.get('/dashboard/traces', validate('dashboardHistory', 'dashboardTraces', getDashboardTraces));
  router.get('/dashboard/workflows/problematic', validate('dashboardHistory', 'dashboardProblematicWorkflows', getProblematicWorkflows));
  router.get('/dashboard/workers/health', validate('empty', 'dashboardWorkerHealth', getWorkerHealth));

  return router;
}

module.exports = {
  createDashboardRoutes
};
