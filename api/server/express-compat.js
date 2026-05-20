const http = require('http');
const { URL } = require('url');

function createResponseAdapter(nodeResponse) {
  const response = nodeResponse;
  response.locals = {};
  response.statusCode = 200;
  response.status = (statusCode) => {
    response.statusCode = statusCode;
    return response;
  };
  response.json = (payload) => {
    if (!response.headersSent) {
      response.setHeader('content-type', 'application/json; charset=utf-8');
    }
    response.end(JSON.stringify(payload, null, 2));
    return response;
  };

  return response;
}

function createRouter() {
  const router = {
    _routes: [],
    get(routePath, handler) {
      this._routes.push({ method: 'GET', path: routePath, handler });
    }
  };

  return router;
}

function createApp() {
  const layers = [];
  const errorHandlers = [];

  function app(req, res) {
    app.handle(req, res);
  }

  app.use = (baseOrMiddleware, maybeRouter) => {
    if (typeof baseOrMiddleware === 'string' && maybeRouter && Array.isArray(maybeRouter._routes)) {
      const basePath = baseOrMiddleware === '/' ? '' : baseOrMiddleware;
      maybeRouter._routes.forEach((route) => {
        layers.push({
          kind: 'route',
          ...route,
          path: `${basePath}${route.path}`
        });
      });
      return app;
    }

    if (typeof baseOrMiddleware === 'function' && baseOrMiddleware.length === 4) {
      errorHandlers.push(baseOrMiddleware);
      return app;
    }

    if (typeof baseOrMiddleware === 'function') {
      layers.push({
        kind: 'middleware',
        handler: baseOrMiddleware
      });
      return app;
    }

    return app;
  };

  app.get = (routePath, handler) => {
    layers.push({ kind: 'route', method: 'GET', path: routePath, handler });
    return app;
  };

  app.listen = (port, hostOrCallback, maybeCallback) => {
    const host = typeof hostOrCallback === 'string' ? hostOrCallback : undefined;
    const callback = typeof hostOrCallback === 'function' ? hostOrCallback : maybeCallback;
    const server = http.createServer((req, res) => app.handle(req, res));
    return host ? server.listen(port, host, callback) : server.listen(port, callback);
  };

  app.handle = (nodeRequest, nodeResponse) => {
    const req = nodeRequest;
    const res = createResponseAdapter(nodeResponse);
    const parsedUrl = new URL(req.url, 'http://localhost');
    req.app = app;
    req.path = parsedUrl.pathname;
    req.originalUrl = req.url;
    req.query = Object.fromEntries(parsedUrl.searchParams.entries());

    let index = 0;
    let matchedRoute = false;
    const next = (error) => {
      if (error) {
        const handler = errorHandlers[0];
        if (handler) {
          return handler(error, req, res, () => undefined);
        }

        return res.status(500).json({
          ok: false,
          status: 'error',
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
          data: null,
          fallback: {
            safeMode: true,
            reason: 'unhandled-error'
          }
        });
      }

      const current = layers[index];
      index += 1;

      if (!current) {
        if (!matchedRoute && !res.writableEnded) {
          return res.status(404).json({
            ok: false,
            status: 'error',
            requestId: req.requestId,
            timestamp: new Date().toISOString(),
            data: null,
            fallback: {
              safeMode: true,
              reason: 'route-not-found'
            }
          });
        }

        return undefined;
      }

      try {
        if (current.kind === 'middleware') {
          return current.handler(req, res, next);
        }

        if (current.method === req.method && current.path === req.path) {
          matchedRoute = true;
          return current.handler(req, res, next);
        }

        return next();
      } catch (caughtError) {
        return next(caughtError);
      }
    };

    return next();
  };

  return app;
}

createApp.Router = createRouter;
createApp.json = () => (req, res, next) => next();

module.exports = createApp;
