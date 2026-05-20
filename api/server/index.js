const { createApiApp } = require('./app');

const DEFAULT_PORT = 3077;

function startApiServer(options = {}) {
  const app = createApiApp(options);
  const port = options.port === undefined ? Number(process.env.API_PORT || DEFAULT_PORT) : options.port;
  const host = options.host || process.env.API_HOST || '127.0.0.1';

  const server = app.listen(port, host, () => {
    const address = server.address();
    const resolvedPort = typeof address === 'object' && address ? address.port : port;

    if (!options.silent) {
      console.log(JSON.stringify({
        status: 'api-server-started',
        baseUrl: `http://${host}:${resolvedPort}`,
        versionedBaseUrl: `http://${host}:${resolvedPort}/api/v1`,
        readonly: app.locals && app.locals.api && app.locals.api.readonly,
        serverMode: app.locals && app.locals.api && app.locals.api.serverMode,
        runtimeFlags: app.locals && app.locals.api && app.locals.api.environment
          ? app.locals.api.environment.responseFields.runtimeFlags
          : null
      }, null, 2));
    }
  });

  return { app, server };
}

if (require.main === module) {
  startApiServer();
}

module.exports = {
  startApiServer
};
