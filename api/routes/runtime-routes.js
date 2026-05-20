const {
  getDecisionHistory,
  getEventHistory,
  getHealth,
  getQueueStatus,
  getRuntimeStatus,
  getValidationStatus
} = require('../controllers/runtime-controller');
const { schemaValidationMiddleware } = require('../middleware/schema-validation');

function chain(...handlers) {
  return (req, res, next) => {
    let index = 0;

    const run = (error) => {
      if (error) {
        return next(error);
      }

      const handler = handlers[index];
      index += 1;

      if (!handler) {
        return next();
      }

      return handler(req, res, run);
    };

    return run();
  };
}

function validate(querySchema, responseSchema, handler) {
  return chain(schemaValidationMiddleware({ querySchema, responseSchema }), handler);
}

function createRuntimeRoutes(expressModule) {
  const router = expressModule.Router();

  router.get('/health', validate('empty', 'health', getHealth));
  router.get('/runtime/status', validate('empty', 'runtimeStatus', getRuntimeStatus));
  router.get('/runtime/queue', validate('empty', 'queueStatus', getQueueStatus));
  router.get('/runtime/events', validate('events', 'events', getEventHistory));
  router.get('/runtime/decisions', validate('decisions', 'decisions', getDecisionHistory));
  router.get('/runtime/validation', validate('empty', 'validation', getValidationStatus));

  return router;
}

module.exports = {
  chain,
  createRuntimeRoutes
};
