const { buildSafeResponse } = require('../responses/safe-response');

function notFoundMiddleware(req, res) {
  const body = buildSafeResponse({
    requestId: req.requestId,
    status: 'error',
    data: null,
    meta: {
      path: req.originalUrl || req.url,
      method: req.method
    },
    fallback: {
      safeMode: true,
      reason: 'route-not-found'
    }
  });

  res.status(404).json(body);
}

function errorHandlerMiddleware(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const body = buildSafeResponse({
    requestId: req.requestId,
    status: 'error',
    data: null,
    meta: {
      path: req.originalUrl || req.url,
      method: req.method,
      error: error.message
    },
    fallback: {
      safeMode: true,
      reason: 'api-error-handler'
    }
  });

  return res.status(error.statusCode || 500).json(body);
}

module.exports = {
  errorHandlerMiddleware,
  notFoundMiddleware
};
