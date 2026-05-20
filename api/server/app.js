const { errorHandlerMiddleware, notFoundMiddleware } = require('../middleware/error-handler');
const { requestIdMiddleware } = require('../middleware/request-id');
const { safeQueryParserMiddleware, schemaValidationMiddleware } = require('../middleware/schema-validation');
const { safeResponseMiddleware } = require('../middleware/safe-response');
const { apiKeyAuthMiddleware } = require('../auth/api-key-auth');
const { createApiEnvironmentConfig } = require('../config/api-environment-config');
const { getHealth } = require('../controllers/runtime-controller');
const { createDashboardDataSource } = require('../data/dashboard-data-source');
const { createRuntimeDataSource } = require('../data/runtime-data-source');
const { auditTrailMiddleware } = require('../governance/audit-trail');
const { rateLimitMiddleware } = require('../governance/rate-limiter');
const { loadClients, redactClient } = require('../keys/client-registry');
const { governancePolicyMiddleware } = require('../policies/api-governance-policies');
const { chain, createRuntimeRoutes } = require('../routes/runtime-routes');
const { createDashboardRoutes } = require('../routes/dashboard-routes');
const { ensureDir, getRepositoryRoot } = require('./file-store');

function loadExpress() {
  try {
    return {
      express: require('express'),
      mode: 'express'
    };
  } catch (error) {
    return {
      express: require('./express-compat'),
      mode: 'express-compat',
      fallbackReason: error.message
    };
  }
}

function createApiApp(options = {}) {
  const loaded = loadExpress();
  const express = loaded.express;
  const app = express();
  const environment = createApiEnvironmentConfig(options.environment || {});

  ensureDir(`${getRepositoryRoot()}\\runtime-data\\api`);
  ensureDir(`${getRepositoryRoot()}\\memory\\api`);
  ensureDir(`${getRepositoryRoot()}\\runtime-data\\api-governance`);
  ensureDir(`${getRepositoryRoot()}\\memory\\api-governance`);
  ensureDir(`${getRepositoryRoot()}\\runtime-data\\dashboard-api`);
  ensureDir(`${getRepositoryRoot()}\\memory\\dashboard-api`);

  const clients = loadClients(options.auth || {});
  app.locals = app.locals || {};
  app.locals.api = {
    version: 'v1',
    readonly: environment.runtimeFlags.readonlyMode,
    serverMode: loaded.mode,
    fallbackReason: loaded.fallbackReason || null,
    environment,
    runtimeFlags: environment.runtimeFlags,
    clients,
    clientRegistry: clients.map(redactClient),
    rateLimit: (options.auth && options.auth.rateLimit) || {
      windowMs: 60000,
      maxRequests: 60
    }
  };
  app.locals.runtimeDataSource = createRuntimeDataSource({
    ...(options.data || {}),
    flags: environment.runtimeFlags
  });
  app.locals.dashboardDataSource = createDashboardDataSource({
    ...(options.dashboard || {}),
    flags: environment.runtimeFlags
  });

  app.use(express.json());
  app.use(requestIdMiddleware);
  app.use(safeQueryParserMiddleware);
  app.use(safeResponseMiddleware);
  app.use(auditTrailMiddleware);
  app.use(governancePolicyMiddleware);
  app.use(apiKeyAuthMiddleware);
  app.use(rateLimitMiddleware);

  const routes = createRuntimeRoutes(express);
  const dashboardRoutes = createDashboardRoutes(express);
  app.get('/health', chain(schemaValidationMiddleware({ querySchema: 'empty', responseSchema: 'health' }), getHealth));
  app.use('/api/v1', routes);
  app.use('/api/v1', dashboardRoutes);
  app.use('/', routes);

  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}

module.exports = {
  createApiApp
};
