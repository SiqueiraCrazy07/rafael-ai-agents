const { findClientByApiKey, redactClient } = require('../keys/client-registry');

function getApiKey(req) {
  if (!req.headers) {
    return null;
  }

  return req.headers['x-api-key'] || req.headers['X-Api-Key'] || null;
}

function apiKeyAuthMiddleware(req, res, next) {
  const apiConfig = req.app && req.app.locals && req.app.locals.api;
  const clients = apiConfig && apiConfig.clients ? apiConfig.clients : [];
  const flags = apiConfig && apiConfig.runtimeFlags ? apiConfig.runtimeFlags : { requireAuth: true };

  if (!flags.requireAuth) {
    req.auth = {
      authenticated: false,
      client: null,
      reason: 'auth-disabled-by-environment'
    };
    res.locals = res.locals || {};
    res.locals.clientId = 'auth-disabled';
    return next();
  }

  const apiKey = getApiKey(req);

  if (!apiKey) {
    req.auth = {
      authenticated: false,
      client: null,
      reason: 'missing-api-key'
    };

    return res.safe({
      authentication: {
        authenticated: false,
        client: null
      }
    }, {
      status: 'error',
      statusCode: 401,
      fallback: {
        safeMode: true,
        reason: 'missing-api-key',
        readonlyDeny: true
      },
      skipResponseValidation: true
    });
  }

  const client = findClientByApiKey(apiKey, clients);

  if (!client) {
    req.auth = {
      authenticated: false,
      client: null,
      reason: 'invalid-api-key'
    };

    return res.safe({
      authentication: {
        authenticated: false,
        client: null
      }
    }, {
      status: 'error',
      statusCode: 401,
      fallback: {
        safeMode: true,
        reason: 'invalid-api-key',
        readonlyDeny: true
      },
      skipResponseValidation: true
    });
  }

  req.auth = {
    authenticated: true,
    client,
    clientSafe: redactClient(client)
  };
  res.locals = res.locals || {};
  res.locals.clientId = client.clientId;

  return next();
}

module.exports = {
  apiKeyAuthMiddleware,
  getApiKey
};
